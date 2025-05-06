import { Request, Response } from 'express';
import { generateSalt, hashPassword } from './auth-utils'
import { scClient } from './connect-to-sc-client';
import { ScAddr, ScTemplate, ScType } from "ts-sc-client";

export async function registerUser(req: Request, res: Response): Promise<Response> {
    try {
        const { login, firstHash } = req.body;

        if (!login || !firstHash) {
            return res.status(400).json({success: false, error: 'Логин и пароль обязательны'});
        }

        const found = await scClient.searchLinksByContents([`user_${login}`]);
        if (found[0].length) {
            return res.status(409).json({success: false, error: 'Логин уже занят'});
        }

        const salt = generateSalt();
        const secondHash = hashPassword(firstHash, salt);

        const result = await scClient.generateElementsBySCs([
            `concept_user -> user_${login};;`,
            `user_${login} => nrel_username: ${login};;`,
            `user_${login} => nrel_hashed_password: ${secondHash};;`,
            `user_${login} => nrel_salt: ${salt};;`
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
};

export async function loginUser(req: Request, res: Response) {
    const { login, firstHash } = req.body;

    const userLinks = await scClient.searchLinksByContents([`user_${login}`]);
    if (userLinks[0].length === 0) {
        return res.status(400).json({success: false, error: 'Неверный логин или пароль'});
    }

    const saltLinks = await scClient.searchLinksByContents([`nrel_salt`]);

    const saltAlias = '_salt';
    const templateSalt = new ScTemplate();
    templateSalt.quintuple(
        userLinks[0][0],
        ScType.VarCommonArc,
        [ScType.VarNodeLink, saltAlias],
        ScType.VarPermPosArc,
        saltAlias[0][0]
    );

    const fakeDialog = new ScAddr(15515);

    const params = {
        [saltAlias]: fakeDialog,
    };

    const result = await scClient.searchByTemplate(templateSalt);

    console.log(result);
}