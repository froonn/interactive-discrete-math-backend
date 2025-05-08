import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth.routes';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
