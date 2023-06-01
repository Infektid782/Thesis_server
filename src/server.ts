import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';
import eventRoutes from './routes/Event';
import userRoutes from './routes/User';
import authRoutes from './routes/Auth';
import groupRoutes from './routes/Group';
import Event from './controllers/Event';

const router = express();

/** Connect to database. */
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Connected to database.');
        StartServer();
    })
    .catch((error) => {
        Logging.err('Connection failed: ');
        Logging.err(error);
    });

/** Only start the server if database connection is complete. */
const StartServer = () => {
    router.use((req, res, next) => {
        /** Log the request */
        Logging.info(`Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            /** Log the response */
            Logging.info(`Outgoing -> Method: [${req.method}] - URL: [${req.url}] - IP [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    /** Rules of the API */
    router.use((req, res, next) => {
        /** Requests can come from anywhere */
        res.header('Access-Control-Allow-Origin', '*');
        /** The headers allowed to use */
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method == 'OPTIONS') {
            /** Return all options */
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }

        next();
    });

    /** Routes */
    router.use('/events/', eventRoutes);
    router.use('/users/', userRoutes);
    router.use('/auth', authRoutes);
    router.use('/groups/', groupRoutes);

    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ message: 'pong' }));

    const cron = require('node-cron');
    cron.schedule('59 18 * * *', () => {
        Event.eventGarbageCollector();
    });

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('Invalid endpoint');
        Logging.err(error);

        return res.status(404).json({ message: error.message });
    });

    http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}.`));
};
