import * as http from 'http'
import express, {Request, Response}  from 'express'
import * as dotenv from "dotenv";
import { Socket } from './socket/socket.ts';
import { HTTPServer } from './HtppServer/httpserver.ts';

dotenv.config({ path: '.env' });

const port: string = process.env.APP_PORT ?? "4430";
const host: string = process.env.APP_HOST ?? "127.0.0.1";

const app = express();

const httpServ = http.createServer(app);

const socket = new Socket(httpServ);

socket.initSocket();

console.log("Socket initialized");

const server = new HTTPServer(app, socket.deleteRoom);

server.initServer();

console.log("HTTP Server initialized");

httpServ.listen(parseInt(port), host, () => {
    console.log(`listening on ${host}:${port}`);
});