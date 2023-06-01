import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Logging from '../library/Logging';
import * as bcrypt from 'bcrypt';

const createUser = async (userData: IUser) => {
    const { accountData, personData } = userData;
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        accountData,
        personData
    });
    return await user.save();
};

const readUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.username;
        const user = await User.findOne({ username });
        if (!user) throw new Error('User not found!');
        res.status(200).json({ user });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

const readAllUsers = (req: Request, res: Response, next: NextFunction) => {
    return User.find()
        .then((users) => res.status(200).json({ users }))
        .catch((error) => res.status(500).json({ error }));
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const { username } = userData.accountData;
        Logging.warn(userData.accountData.username);
        const user = await User.findOne({ 'accountData.username': username });
        if (!user) throw new Error('User not found!');
        user.personData = userData.personData;
        await user.save();
        Logging.info('Updated: ' + user);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ 'accountData.username': username });
        if (!user) throw new Error('User not found!');
        const checkPassword = await bcrypt.compare(oldPassword, user.accountData.password);
        if (!checkPassword) throw Error('Password is incorrect');
        user.accountData.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.username;
        const user = await User.deleteOne({ username });
        if (user.deletedCount === 0) throw new Error('User not found!');
        Logging.info('Deleted: ' + user);
        res.status(201).json({ message: 'Deleted user.' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

export default { createUser, readUser, readAllUsers, updateUser, updatePassword, deleteUser };
