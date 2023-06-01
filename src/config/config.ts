import dotenv from 'dotenv';

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.abrey8f.mongodb.net/`;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '';
const TOKEN_HEADER_NAME = process.env.TOKEN_HEADER_NAME || '';

const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;

export const config = {
    mongo: {
        url: MONGO_URL
    },
    server: {
        port: SERVER_PORT
    },
    jwt: {
        secretKey: JWT_SECRET_KEY
    },
    token: {
        headerName: TOKEN_HEADER_NAME
    }
};
