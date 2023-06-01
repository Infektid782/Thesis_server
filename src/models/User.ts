import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountData {
    email: string;
    username: string;
    password: string;
}

export interface IPersonData {
    fullName: string;
    birthday: string;
    phoneNumber: string;
    gender: string;
    pictureURL: string;
}
export interface IUser {
    accountData: IAccountData;
    personData: IPersonData;
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
    {
        accountData: {
            type: {
                email: { type: String, required: true },
                username: { type: String, required: true },
                password: { type: String, required: true }
            },
            required: true
        },
        personData: {
            type: {
                fullName: { type: String, required: false },
                birthday: { type: String, required: false },
                phoneNumber: { type: String, required: false },
                gender: { type: String, required: false },
                pictureURL: { type: String, required: false }
            },
            required: false
        }
    },
    {
        versionKey: false
    }
);

export default mongoose.model<IUserModel>('User', UserSchema);
