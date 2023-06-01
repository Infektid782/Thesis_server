import { NextFunction, Request, Response } from 'express';
import { config } from '../config/config';
import * as jwt from 'jsonwebtoken';

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.get(config.token.headerName);
        if (!token) {
            throw new Error('Token is missing!');
        }
        const decoded = jwt.verify(token, config.jwt.secretKey) as { username: string };
        req.username = decoded.username;
        res.set(config.token.headerName, `${token}`);

        return next();
    } catch (error) {
        if (error instanceof Error) res.status(401).json({ status: 'failed', message: error.message });
        else res.status(401).json({ status: 'failed', message: 'Unauthorized' });
    }
};

export default verifyToken;
