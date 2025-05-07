import {Request, Response} from 'express';
import {scClient} from './connect-to-sc-client';
import {ScTemplate, ScType} from "ts-sc-client";
import CryptoJS from "crypto-js";

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
};

export async function loginUser(req: Request, res: Response) {
    const {login, firstHash} = req.body;

    const userLinks = await scClient.searchLinksByContents([`user_${login}`]);
    console.log(`user`);
    console.log(userLinks[0][0]);

    if (userLinks[0].length === 0) {
        return res.status(400).json({success: false, error: 'Неверный логин или пароль'});
    }

    const hashedPasswordLinks = await scClient.searchLinksByContents([CryptoJS.SHA256(firstHash).toString()]);
    console.log(`pass`);
    console.log(hashedPasswordLinks[0][0]);

    if (userLinks[0].length === 0) {
        return res.status(400).json({success: false, error: 'Неверный логин или пароль'});
    }

    const {nrelHashedPassword} = await scClient.searchKeynodes(`nrel_hashed_password`);

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

    searchResult.forEach((item) => {

        console.log(item.get(loginAlias));
        console.log(item.get(hashedPasswordAlias));

        if (
            ((item.get(loginAlias).value + 1) === userLinks[0][0].value) &&
            ((item.get(hashedPasswordAlias).value + 1) === hashedPasswordLinks[0][0].value)
        ) {
            return res.status(201).json({success: true, message: 'Успех'});
        }
    });

    return res.status(400).json({success: false, error: 'Неверный логин или пароль'});
}