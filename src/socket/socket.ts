import { WebSocketServer, WebSocket, RawData } from "ws";
import * as https from 'https'
import { PeerManager } from '../PeerManager/peermanager.ts';
import { DB } from '../DBConnect/db.ts';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { User } from '../interfaces/user.ts';
import jwt from 'jsonwebtoken'
import fetch, {Response} from "node-fetch";
import { DBResult, ResultStatus } from "src/interfaces/db.ts";


interface Info {
    origin: string, 
    secure: boolean, 
    req: IncomingMessage
};

export class Socket {
    
    private wss: WebSocketServer;
    private peerManager: PeerManager;
    private db: DB;
    
    constructor(https: https.Server) {
        this.wss = new WebSocketServer({server: https, 
                                verifyClient: (info: Info, callback: (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void ) => {
                                    this.verifyClientInfo(info).then((value: boolean) => callback(value) );
                                }
                        });

        this.peerManager = new PeerManager();
        this.db = DB.getInstance();
    }

    async verifyClientInfo(info: Info) : Promise<boolean> {
        let userObj = {};
      
        console.log(info.req.headers);

        if(info.req.headers['x-amzn-oidc-data']) {

            let dataRaw = info.req.headers['x-amzn-oidc-data'] as string;
            const data = dataRaw.replaceAll("==", "");
            const jwtDec: jwt.Jwt = jwt.decode(data, {complete: true});

            const header: jwt.JwtHeader = jwtDec.header;
            
            const kid    = header.kid;
            const region = header['signer'].split(":")[3];

            let cert: string;

            await this.getAmznCert(region, kid).then((value: string) => {
                cert = value;
            });

            try{
                let jwtVer: jwt.JwtPayload = jwt.verify(data, cert, {algorithms: ['ES256']}) as jwt.JwtPayload;
                userObj["person_id"] = parseInt(jwtVer["sub"]);
                userObj["email"]     = jwtVer["email"];
                userObj["user_roles"]= jwtVer["user_roles"];

            } catch(err: any) {
                console.log(err);
                return false;
            }

        } else if(info.req.headers['user-data'] && process.env.ENV === 'local') {
            try {
                userObj = JSON.parse(info.req.headers['user-data'] as string);
            } catch(err: any) {
                console.log(err);
                return false;
            }

        } else {

            return false;

        }

        this.peerManager.addUser(userObj as User, info.req);
        
        return true;
    }

    async getAmznCert(region: string, kid: string) : Promise<string> {
        return fetch(`https://public-keys.auth.elb.${region}.amazonaws.com/${kid}`)
        .then((value: Response)      => value.text() )
        .then((resultstring: string) => resultstring );
    }

    peerHasAccesToRoom(room_id: number, person_id: number): boolean {
        let access = false;
        this.db.executeSp('sp_consultation_room_check_access', {room_id : room_id, person_id: person_id}, (result: DBResult) => {
            if(result.status === ResultStatus.Error) {
                console.log(result.error);

                return false;
            }
            console.log(result.res);
            const res = result.res.rows;
        })
        return access;
    }

    deleteRoom(room_id: number) {
        const room = this.peerManager.getRoom(room_id);
        if(room == null) {
            return;
        }

        for(const o of room) {
            o.connection.send(JSON.stringify({type: "order", order: "disconnect"}));
            o.connection.close(5400);
        }
        this.peerManager.removeRoom(room_id);
    }

    initSocket() {
        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            
            console.log(req);

            const user: User | undefined = this.peerManager.getUser(req);
            let connection_room_id = -1;

            if(user == null) {
                ws.send(JSON.stringify({type: "error", errtext: "unknwon user"}));
                return;
            }

            ws.on('error', console.error);

            ws.on('message', (data: RawData) => {

                console.log(data.toString());

                try {
                    const request = JSON.parse(data.toString());

                    switch(request.type) {
                        case 'send_ofer_to_peers': {
                            const room_id = request['room_id'];
                            if(this.peerHasAccesToRoom(room_id, user.person_id)) {

                                connection_room_id = room_id;
                                const room = this.peerManager.getRoom(room_id);

                                if(room != null) {
                                    for(const o of room) {
                                        o.connection.send(JSON.stringify({type: "offer", offer: request.offer}));
                                    }
                                }
                                this.peerManager.addToRoomOrCreateRoom(room_id, {user: user, connection: ws });
                                ws.send(JSON.stringify({type: "status", status: "enter_room"}))
                            } else {
                                ws.send(JSON.stringify({type: "status", status: "no_access_to_room"}));
                            }
                        }
                        case 'accept_offer_from_peer': {
                            const room_id = connection_room_id;

                            if(room_id > 0) {
                                const room = this.peerManager.getRoom(room_id);

                                for(const o of room) {
                                    if(o.user.person_id !== user.person_id) {
                                        o.connection.send(JSON.stringify({type: "answer", candidate: request.answer}));
                                    }
                                }
                            } else {
                                ws.send(JSON.stringify({type: "error", errtext: "no room set for offer"}));
                            }
                        }

                        case 'send_ice_candidate_to_peers': {
                            const room_id = connection_room_id;

                            if(room_id > 0) {
                                const room = this.peerManager.getRoom(room_id);

                                for(const o of room) {
                                    if(o.user.person_id !== user.person_id) {
                                        o.connection.send(JSON.stringify({type: "ice_candidate", candidate: request.candidate}));
                                    }
                                }
                            } else {
                                ws.send(JSON.stringify({type: "error", errtext: "no room set for ice candidate"}));
                            }
                        }
                        

                        default: return;
                    }
                    
                } catch(err) {
                    ws.send(JSON.stringify({type: "error", errtext: "invalid_data_sent"}));
                }
            })

            ws.on('close', (code: Number, reason: Buffer) => {
                console.log(`Connection closed with Peer ${user.person_id} due to reason ${reason.toString()}`);

                this.peerManager.removePeer(req, connection_room_id);
            });
        });
    }
}