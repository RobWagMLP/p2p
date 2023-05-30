import express, {Request, Response} from 'express'
import { DB } from '../DBConnect/db.ts';
import pkg from 'pg'
import { ResultStatus } from '../interfaces/dbenums.ts';

export class HTTPServer {
    private app: express.Express;
    private db: DB;
    
    constructor(app: express.Express) {
        this.app = app;
        this.app.use(express.json());
        this.db  = DB.getInstance();
    }

    initServer() {
        this.app.put('/room_open', (req: Request, res: Response) => {
            if(req.headers['x-api-key'] !== process.env.HTTP_API_KEY) {
                res.statusCode = 404;
                res.send("Wrong Credentials");
                return;
            }
            try{
                console.log(req.body);
                const body = req.body;
                if(body['room_id'] && body['person_id_create'] && body['participants']) {
                    this.db.executeSp('sp_create_consultation_room', body, (result : {status: ResultStatus, res?: pkg.QueryResult, error?: Error}) => {
                        console.log(result);
                        if(result.status === ResultStatus.Error) {
                            console.log(result.error);
                            res.statusCode = 401;
                            res.send({status: 'error', error: result.error});
                        } else {
                            res.send({status: 'success', result: 'successfully added room'});
                        }
                    })
                }
            } catch(err: any) {
                res.statusCode = 401;
                res.send({status: 'error', error: err});
            }
        })
    }
}