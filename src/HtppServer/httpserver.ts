import express, {Request, Response} from 'express'
import { DB } from '../DBConnect/db.ts';
import { DBResult, ResultStatus } from '../interfaces/db.ts';

export class HTTPServer {
    private app: express.Express;
    private db: DB;
    private deleteRoomCallback: (room_id: number) => void;
    
    constructor(app: express.Express, deleteRoomCallback: (room_id: number) => void) {
        this.app = app;
        this.app.use(express.json());
        this.db  = DB.getInstance();
        this.deleteRoomCallback = deleteRoomCallback;
    }

    validateHeader(req: Request, res: Response): boolean {
        if(req.headers['x-api-key'] !== process.env.HTTP_API_KEY) {
            res.statusCode = 404;
            res.send("Wrong Credentials");
            return false;
        } 
        return true;
    }

    initServer() {
        this.app.all('*', (req: Request, res: Response) => {
            if(!this.validateHeader(req, res)) {
                return;
            } else {
                req.next();
            }
        });

        this.app.put('/room_open', (req: Request, res: Response) => {
            try{
                console.log(req.body);
                const body = req.body;
                if(body['room_id'] && body['person_id_create'] && body['participants']) {
                    this.db.executeSp('sp_create_consultation_room', body, (result : DBResult) => {
                        if(result.status === ResultStatus.Error) {
                            console.log(result.error);
                            res.statusCode = 401;
                            res.send({status: 'error', error: result.error});
                        } else {
                            res.send({status: 'success', result: 'successfully added room'});
                        }
                    })
                } else {
                    res.statusCode = 401;
                    res.send({status: 'error', error: 'no complete data provided'});
                }
            } catch(err: any) {
                res.statusCode = 401;
                res.send({status: 'error', error: err});
            }
        });

        this.app.delete('/room_open', (req: Request, res: Response) => {
            if(req.query['room_id'] == null) {
                res.statusCode = 401;
                res.send({status: 'error', error: 'no room_id provided'});
            }
            const room_id = parseInt(req.query['room_id'] as string);
            this.deleteRoomCallback(room_id);

            this.db.executeSp('sp_close_consultation_room', {room_id: room_id}, (result : DBResult) => {
                if(result.status === ResultStatus.Error) {
                    console.log(result.error);
                    res.statusCode = 401;
                    res.send({status: 'error', error: result.error});
                } else {
                    res.send({status: 'success', result: 'successfully deleted room'});
                }
            })
        });
    }
}