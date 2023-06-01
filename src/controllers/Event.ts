import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Logging from '../library/Logging';
import Event from '../models/Event';
import Group from '../models/Group';

const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, group, users, owner, date, repeat, location } = req.body;
        const event = new Event({
            _id: new mongoose.Types.ObjectId(),
            title,
            group,
            users,
            owner,
            date,
            repeat,
            location
        });
        const groupObj = await Group.findOne({ name: group });
        if (!groupObj) {
            throw new Error('Group not found');
        }
        groupObj.eventIDs.push(event._id);
        await groupObj.save();
        await event.save();
        Logging.info(`Created: ${event}`);
        res.status(201).json(event);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventID = req.params.eventID;
        const event = await Event.findById(eventID);
        if (!event) throw new Error('Event not found!');
        res.status(200).json(event);
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await Event.find();
        if (!events[0]) throw new Error('There are no events!');
        res.status(200).json({ events });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readEventsForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.username;
        const events = await Event.find({ 'users.username': username });
        if (!events[0]) throw new Error('This user has no events!');
        res.status(200).json({ events });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const readEventsForGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupName = req.params.groupName;
        const events = await Event.find({ group: groupName });
        if (!events[0]) throw new Error('There are no events for this group!');
        res.status(200).json({ events });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventID = req.params.eventID;
        const event = await Event.findById(eventID);
        if (!event) throw new Error('Event not found');
        event.set(req.body).save();
        Logging.info('Updated: ' + event);
        res.status(201).json({ event });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventID = req.params.eventID;
        const event = await Event.findById(eventID);
        if (!event) throw new Error('Event not found');
        const group = await Group.findOneAndUpdate({ name: event.group }, { $pull: { eventIDs: eventID } }, { new: true });
        Logging.warn(group?.eventIDs);
        if (!group) throw new Error('Group not found');
        const deletedEvent = await Event.findByIdAndDelete(eventID);
        Logging.info('Deleted: ' + event);
        res.status(201).json({ message: 'Deleted event!' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Unknown error!' });
        }
    }
};

const eventGarbageCollector = async () => {
    const events = await Event.find();
    events.forEach(async (event) => {
        const eventDate = new Date(event.date);
        const currentDate = new Date();

        if (eventDate < currentDate && event.repeat === 'never') {
            await event.deleteOne();
        } else if (event.repeat === 'every day') {
            const newDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
            event.date = newDate.toISOString();
            await event.save();
        } else if (event.repeat === 'every week') {
            const newDate = new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            event.date = newDate.toISOString();
            await event.save();
        } else if (event.repeat === 'every month') {
            const newDate = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate());
            event.date = newDate.toISOString();
            await event.save();
        }
    });
};

export default { createEvent, readEvent, readAllEvents, readEventsForUser, readEventsForGroup, updateEvent, deleteEvent, eventGarbageCollector };
