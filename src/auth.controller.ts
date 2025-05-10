import { Request, Response } from 'express';
import { scClient } from './connect-to-sc-client';
import { ScTemplate, ScType, ScAddr } from "ts-sc-client";
import jwt from 'jsonwebtoken';
import CryptoJS from "crypto-js";
import 'dotenv/config';

export async function registerUser(req: Request, res: Response): Promise<Response> {
    try {
        const {login, firstHash} = req.body;

        if (!login || !firstHash) {
            return res.status(400).json({success: false, error: 'Логин и пароль обязательны'});
        }

        const found = await scClient.searchLinksByContents([`user_${login}`]);

        if (found[0].length) {
            return res.status(409).json({success: false, error: 'Логин уже занят'});
        }

        const secondHash = CryptoJS.SHA256(firstHash).toString();

        const result = await scClient.generateElementsBySCs([
            `concept_user -> user_${login};;`,
            `user_${login} => nrel_username: ${login};;`,
            `user_${login} => nrel_hashed_password: ${secondHash};;`,
        ]);

        if (!result) {
            return res.status(500).json({success: false, error: 'Ошибка при создании пользователя'});
        }

        return res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован'
        });

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        return res.status(500).json({
            success: false,
            error: 'Произошла внутренняя ошибка сервера'
        });
    }
}

export async function loginUser(req: Request, res: Response) {
    const {login, firstHash} = req.body;

    if (login.includes(' ')) {
        return res.status(400).json({success: false, error: 'Логин не должен содержать пробелы'})
    }

    const JWT_SECRET = process.env.SECRET_KEY || 'default_secret';

    const userLinks = await scClient.searchLinksByContents([`user_${login}`]);

    if (userLinks[0].length === 0) {
        return res.status(401).json({success: false, error: 'Неверный логин или пароль'});
    }

    const { nrelHashedPassword } = await scClient.searchKeynodes(`nrel_hashed_password`);

    const loginAlias = "_login";
    const hashedPasswordAlias = "_hashed_password";

    const template = new ScTemplate();
    template.quintuple(
        loginAlias,
        ScType.VarCommonArc,
        [ScType.VarNode, hashedPasswordAlias],
        ScType.VarPermPosArc,
        nrelHashedPassword
    );

    const searchResult = await scClient.searchByTemplate(template);

    for (const item of searchResult) {

        const findedLogin = await scClient.getLinkContents([new ScAddr(item.get(loginAlias).value + 1)]);
        const findedHashedPassword = await scClient.getLinkContents([new ScAddr(item.get(hashedPasswordAlias).value + 1)]);

        if (
            (findedLogin[0].data === `user_${login}`) &&
            (findedHashedPassword[0].data === CryptoJS.SHA256(firstHash).toString())
        ) {
            // Generate access and refresh tokens
            const accessToken = jwt.sign(
                { name: login },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { name: login },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Save refreshToken in httpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return res.status(200).json({
                success: true,
                user: login,
                accessToken: accessToken
            });
        }
    }

    return res.status(401).json({success: false, error: 'Неверный логин или пароль'});
}

export async function refreshToken(req: Request, res: Response) {
    const JWT_SECRET = process.env.SECRET_KEY || 'default_secret';

    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, error: 'Отсутствует refresh token' });
        }

        jwt.verify(
            refreshToken,
            JWT_SECRET,
            (err: any, decoded: any) => {
                if (err) {
                    return res.status(403).json({ success: false, error: 'Неверный или истёкший refresh token' });
                }
                const accessToken = jwt.sign(
                    { name: decoded.name },
                    JWT_SECRET,
                    { expiresIn: '15m' }
                );
                return res.status(200).json({
                    success: true,
                    accessToken: accessToken
                });
            }
        );
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Не удалось обновить access token' });
    }
}

export async function logoutUser(req: Request, res: Response) {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.status(200).json({ success: true, message: 'Вы успешно вышли из системы' });
}
