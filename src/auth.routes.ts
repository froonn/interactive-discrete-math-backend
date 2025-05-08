import { Router } from 'express';
import { registerUser, loginUser, refreshToken, logoutUser } from './auth.controller';

const router = Router();

router.post('/register', (req, res, next) => {
    registerUser(req, res).catch(next);
});
router.post('/login', (req, res, next) => {
    loginUser(req, res).catch(next);
});
router.post('/refresh', (req, res, next) => {
    refreshToken(req, res).catch(next);
});
router.post('/logout', (req, res, next) => {
    logoutUser(req, res).catch(next);
});

export default router;
