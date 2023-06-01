import mongoose, { Document, Schema } from 'mongoose';

export type UserAttendance = 'Invited' | 'Attending' | 'Missing';

export type Rank = 'owner' | 'admin' | 'member';

export interface IInvitedUser {
    username: string;
    attendance: UserAttendance;
    profilePic: string;
}

export interface IEvent {
    title: string;
    group: string;
    users: IInvitedUser[];
    owner: string;
    date: string;
    repeat: string;
    location: string;
}

export interface IEventModel extends IEvent, Document {}

const EventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        group: { type: String, required: true },
        users: { type: [{ username: String, attendance: String, profilePic: String }], required: true },
        owner: { type: String, required: true },
        date: { type: String, required: true },
        repeat: { type: String, required: true },
        location: { type: String, required: true }
    },
    {
        versionKey: false
    }
);

export default mongoose.model<IEventModel>('Event', EventSchema);
