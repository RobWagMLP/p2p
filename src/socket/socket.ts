import { WebSocketServer, WebSocket, RawData } from "ws";
import * as https from 'https'
import { PeerManager } from '../PeerManager/peermanager.ts';
import { DB } from '../DBConnect/db.ts';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { User } from '../interfaces/user.ts';
import jwt from 'jsonwebtoken'

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
                                    callback(this.verifyClientInfo(info));
                                }
                        });

        this.peerManager = new PeerManager();
        this.db = DB.getInstance();
    }

    verifyClientInfo(info: Info) : boolean {
        let userObj = {};
      
        console.log(info.req.headers);

        if(info.req.headers['x-amzn-oidc-data']) {

            const data = info.req.headers['x-amzn-oidc-data'] as string;
            const jwtDec: jwt.Jwt = jwt.decode(data, {complete: true});

            const header: jwt.JwtHeader = jwtDec.header;
            
            const kid    = header.kid;
            const signer = header['signer'].split(":");
            const region = signer[3];

            let cert: string;

            console.log(data, header);

            this.getAmznCert(region, kid).then((value: string) => {
                cert = value;
            });
            try{
                let jwtVer: jwt.JwtPayload = jwt.verify(data, cert, {algorithms: ['ES256']}) as jwt.JwtPayload;
                userObj["persom_id"] = jwtVer["sub"];
                userObj["email"]     = jwtVer["email"];
                userObj["user_roles"]= jwtVer["user_roles"];

            } catch(err: any) {
                console.log(err);
                return false;
            }

        } else if(info.req.headers['user-data'] && process.env.env === 'local') {
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

    getAmznCert(region: string, kid: string) : Promise<string> {
        
        return fetch(`https://public-keys.auth.elb.${region}.amazonaws.com/${kid}`)
        .then((value: Response)      => value.text() )
        .then((resultstring: string) => resultstring );
    }

    initSocket() {
        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            
            console.log(req);

            const user: User | undefined = this.peerManager.getUser(req);

            if(user == null) {
                ws.send('no user known');
                return;
            }
            ws.send('yeah das klappt');
            
            ws.on('error', console.error);

            ws.on('message', (data: RawData) => {
                console.log(data);
                ws.send("got it");
            })
        });
    }
}