import { WebSocketServer, WebSocket, RawData } from "ws";
import * as https from 'https'
import { PeerManager } from '../PeerManager/peermanager.ts';
import { DB } from '../DBConnect/db.ts';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { User } from '../interfaces/user.ts';
import jwt from 'jsonwebtoken'
import fetch, {Response} from "node-fetch";
import { DBResult, ResultStatus } from "../interfaces/db.ts";


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

        this.deleteRoom = this.deleteRoom.bind(this);
    }

    async verifyClientInfo(info: Info) : Promise<boolean> {
        let userObj = {};
      
        console.log(info.req.url);

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

        } else if(info.req.url.includes("?") && process.env.ENV === 'local') { // only for local testing
            try {
                const person_id = parseInt(info.req.url.split("=") [1]);
                userObj["person_id"] = person_id;
                //userObj = JSON.parse(info.req.headers['user-data'] as string);
            } catch(err: any) {
                console.log(err);
                return false;
            }

        } else {

            return false;

        }
        return this.peerManager.addUser(userObj as User, info.req);
    }

    async getAmznCert(region: string, kid: string) : Promise<string> {
        return fetch(`https://public-keys.auth.elb.${region}.amazonaws.com/${kid}`)
        .then((value: Response)      => value.text() )
        .then((resultstring: string) => resultstring );
    }

    peerHasAccesToRoom(room_id: number, person_id: number, callback: (access: boolean) => void) {
        this.db.executeSp('sp_consultation_room_check_access', {room_id : room_id, person_id: person_id}, (result: DBResult) => {
            if(result.status === ResultStatus.Error) {
                console.log(result.error);

                callback(false);
            }
            callback(result.res.rows[0].has_access);
        })
    }

    deleteRoom(room_id: number) {
   
        const room = this.peerManager.getRoom(room_id);

        if(room == null) {
            return;
        }

        for(const o of room) {
            o.connection.send(JSON.stringify({type: "order", order: "disconnect"}));
            o.connection.close();
        }
        this.peerManager.removeRoom(room_id);
    }

    initSocket() {
        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            
            const user: User | undefined = this.peerManager.getUser(req);
            let connection_room_id = -1;

            if(user == null) {
                ws.send(JSON.stringify({type: "error", error: "unknwon user"}));
                return;
            }

            ws.on('error', console.error);

            ws.on('message', (data: RawData) => {

                console.log(data.toString());

                try {
                    const request = JSON.parse(data.toString());

                    switch(request.type) {
                        case 'request_room': {
                            const room_id = request['room_id'];

                            this.peerHasAccesToRoom(room_id, user.person_id, (access: boolean)   => { 
 
                                if(access) {
                                    connection_room_id = room_id;
                                    const userList = this.peerManager.getUserList(room_id);

                                    this.peerManager.addToRoomOrCreateRoom(connection_room_id, {user: user, connection: ws });
                                  
                                    ws.send(JSON.stringify({type: "room_info", userlist: userList}))
                                } else {
                                    ws.send(JSON.stringify({type: "error", error: "no_access_to_room"}));
                                }
                            })                  
                        }
                        case 'send_offer_to_peers': {
                            if(connection_room_id >= 0) {
                                    const room = this.peerManager.getRoom(connection_room_id);

                                    if(room != null) {
                                        for(const o of room) {
                                            if(o.user.person_id !== user.person_id) {
                                                o.connection.send(JSON.stringify({type: "offer", offer: request.offer, person_id: user.person_id}));
                                            }
                                        }
                                    }
                                    ws.send(JSON.stringify({type: "status", status: "enter_room"}))
                                } else {
                                    ws.send(JSON.stringify({type: "error", error: "no_room_requested"}));
                                }                                                 
                        }
                        break;
                        case 'send_offer_to_single_peers': {
                            if(connection_room_id >= 0) {
                                    const room = this.peerManager.getRoom(connection_room_id);
                                    const person_id_receive = request.person_id_receive;
                                    
                                    if(room != null) {
                                        for(const o of room) {
                                            if(o.user.person_id === person_id_receive) {
                                                o.connection.send(JSON.stringify({type: "offer", offer: request.offer, person_id: user.person_id}));
                                            }
                                        }
                                    }
                                    ws.send(JSON.stringify({type: "status", status: "enter_room"}))
                                } else {
                                    ws.send(JSON.stringify({type: "error", error: "no_room_requested"}));
                                }                                                 
                        }
                        break;
                        case 'accept_offer_from_peer': {
                            const room_id = connection_room_id;

                            if(room_id > 0) {
                                const room = this.peerManager.getRoom(room_id);

                                for(const o of room) {
                                    if(o.user.person_id !== user.person_id) {
                                        o.connection.send(JSON.stringify({type: "answer", answer: request.answer, person_id: user.person_id}));
                                    }
                                }
                            } else {
                                ws.send(JSON.stringify({type: "error", error: "no room set for offer"}));
                            }
                        }
                        break;
                        case 'send_ice_candidate_to_peers': {
                            const room_id = connection_room_id;
                            const person_id_receive = request.person_id_receive;

                            if(room_id > 0) {
                                const room = this.peerManager.getRoom(room_id);

                                for(const o of room) {
                                    if(o.user.person_id === person_id_receive) {
                                        o.connection.send(JSON.stringify({type: "ice_candidate", candidate: request.candidate, person_id: user.person_id}));
                                    }
                                }
                            } else {
                                ws.send(JSON.stringify({type: "error", error: "no room set for ice candidate"}));
                            }
                        }
                        case 'message': {
                            if(connection_room_id > 0) {
                                const room = this.peerManager.getRoom(connection_room_id);

                                for(const o of room) {
                                    if(o.user.person_id !== user.person_id) {
                                        o.connection.send(JSON.stringify({type: "message", message: request.message}));
                                    }
                                }
                            }
                        }
                        break;
                        default: return;
                    }
                    
                } catch(err) {
                    ws.send(JSON.stringify({type: "error", error: "invalid_data_sent"}));
                }
            })

            ws.on('close', (code: Number, reason: Buffer) => {
                console.log(`Connection closed with Peer ${user.person_id} due to reason ${reason.toString() ?? 'unknown'} and code ${code}`);

                this.peerManager.removePeer(req, connection_room_id);
            });
        });
    }
}