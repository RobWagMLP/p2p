import express, {Request, Response} from 'express'
import { DB } from '../DBConnect/db.ts';

export class HTTPServer {
    private app: express.Express;
    private db: DB;
    
    constructor(app: express.Express) {
        this.app = app;
        this.db  = DB.getInstance();
    }

    initServer() {
        this.app.put('/room_open', (req: Request, res: Response) => {
            console.log(req);
            res.send("Hello Hansi");
        })
    }
}