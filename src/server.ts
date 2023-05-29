import * as https from 'https'
import express from 'express'
import * as dotenv from "dotenv";
import { Socket } from './socket/socket.ts';
import { HTTPServer } from './HtppServer/httpserver.ts';

dotenv.config({ path: '../.env' });
if(process.env.env === 'local') {
    console.log("Local env, disbaling cert validation")
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const port: string = process.env.APP_PORT ?? "443";
const host: string = process.env.APP_HOST ?? "127.0.0.1";

const app = express();

const cred = {
    key:  process.env.CERT_KEY,
    cert: process.env.CERT_CERT,
};

const httpsServ = https.createServer(cred, app);

const socket = new Socket(httpsServ);
socket.initSocket();

console.log("Socket initialized");

const server = new HTTPServer(app);
server.initServer();

console.log("HTTP Server initialized");

httpsServ.listen(parseInt(port), host);