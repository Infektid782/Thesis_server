import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import controller from './User';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/config';
import Logging from '../library/Logging';

export const checkDuplicate = async (email: string, username: string) => {
    try {
        const checkEmail = await User.findOne({ 'accountData.email': email });
        const checkUsername = await User.findOne({ 'accountData.username': username });
        if (checkEmail) throw new Error('E-mail address is taken!');
        if (checkUsername) throw new Error('Username is taken!');
        return { status: 'success' };
    } catch (error) {
        if (error instanceof Error) {
            return { status: 'failed', message: error.message };
        } else {
            return { status: 'failed', message: 'unknown error' };
        }
    }
};

const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const accountData = userData.accountData;
        if (!accountData.email || !accountData.username || !accountData.password) throw Error('Missing data!');
        const check = await checkDuplicate(accountData.email, accountData.username);
        if (check.status === 'failed') throw Error(check.message);
        accountData.password = await bcrypt.hash(accountData.password, 10);
        const user = await controller.createUser(userData);
        Logging.info(`Created: ${user}`);
        const token = jwt.sign({ username: accountData.username, password: accountData.password }, config.jwt.secretKey);
        res.append('x-access-token', token);
        res.status(201).json(user);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { accountData } = req.body;
        const user = await User.findOne({ 'accountData.username': accountData.username });
        if (!user) throw Error('Username is incorrect!');
        const checkPassword = await bcrypt.compare(accountData.password, user.accountData.password);
        if (!checkPassword) throw Error('Password is incorrect');
        const token = jwt.sign({ username: user.accountData.username, password: user.accountData.password }, config.jwt.secretKey);
        res.append('x-access-token', token);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

export default { register, login };
