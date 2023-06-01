import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Group from '../models/Group';
import Logging from '../library/Logging';
import Event from '../models/Event';

const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, eventIDs, members, owner, description, iconURL } = req.body;
        const checkName = await Group.findOne({ name: name });
        if (checkName) throw new Error('This name is already taken!');
        const group = new Group({
            _id: new mongoose.Types.ObjectId(),
            name,
            eventIDs,
            members,
            owner,
            description,
            iconURL
        });
        await group.save();
        Logging.info('Created: ' + group);
        res.status(201).json(group);
    } catch (error) {
        if (error instanceof Error) {
            Logging.err(error.message);
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupID = req.params.groupID;
        const group = await Group.findById(groupID);
        if (!group) throw new Error('Group not found!');
        res.status(200).json(group);
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'unknown error' });
        }
    }
};

const readAllGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groups = await Group.find();
        if (!groups[0]) throw new Error('There are no groups!');
        res.status(200).json({ groups });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readGroupsForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.username;
        const groups = await Group.find({ 'members.username': username });
        if (!groups[0]) throw new Error('This user has no groups!');
        res.status(200).json({ groups });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupID = req.params.groupID;
        const { name } = req.body;
        const group = await Group.findById(groupID);
        if (!group) throw new Error('Group not found');
        if (name !== group?.name) {
            const checkName = await Group.findOne({ name: name });
            if (checkName) throw new Error('This name is already taken!');
            group.eventIDs.map(async (eventID) => {
                const event = await Event.findById(eventID);
                if (event) {
                    event.group = group.name;
                    await event?.save();
                }
            });
        }
        group.set(req.body).save();
        Logging.info('Updated: ' + group);
        res.status(201).json({ group });
    } catch (error) {
        if (error instanceof Error) {
            Logging.err(error.message);
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const memberJoined = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupID = req.params.groupID;
        const { username, rank, profilePic } = req.body;
        const group = await Group.findById(groupID);
        if (!group) throw new Error('Group not found');
        group.members.push({ username: username, rank: rank, profilePic: profilePic });
        await group.save();
        group.eventIDs.map(async (eventID) => {
            const event = await Event.findById(eventID);
            event?.users.push({ username: username, attendance: 'Invited', profilePic: profilePic });
            await event?.save();
        });
        Logging.info('Member added: ' + group);
        res.status(201).json({ group });
    } catch (error) {
        if (error instanceof Error) {
            Logging.err(error.message);
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const memberLeft = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupID = req.params.groupID;
        const { username } = req.body;
        const group = await Group.findById(groupID);
        if (!group) throw new Error('Group not found');
        group.members = group.members.filter((m) => m.username !== username);
        await group.save();
        await Promise.all(
            group.eventIDs.map(async (eventID) => {
                const event = await Event.findById(eventID);
                if (!event) throw new Error('Event not found!');
                event.users = event?.users.filter((e) => e.username !== username);
                await event?.save();
            })
        );
        Logging.info('Member left: ' + group);
        res.status(201).json({ group });
    } catch (error) {
        if (error instanceof Error) {
            Logging.err(error.message);
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupID = req.params.groupID;
        Logging.info(groupID);
        const group = await Group.findById(groupID);
        if (!group) throw new Error('Group not found');
        const deletedEvents = await Event.deleteMany({ _id: { $in: group.eventIDs } });
        const deletedGroup = await Group.findByIdAndDelete(groupID);
        Logging.info('Deleted group: ' + group);
        res.status(201).json({ message: 'Deleted group!' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

export default { createGroup, readGroup, readAllGroups, readGroupsForUser, updateGroup, memberJoined, memberLeft, deleteGroup };
