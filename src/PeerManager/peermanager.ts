import { IncomingMessage } from "http";
import { User, UserConnection } from "../interfaces/user.ts";

export class PeerManager {
    private userMap: WeakMap<IncomingMessage, User>;
    //map room_id to participating users
    private connectionMap: Map<number,  Array<UserConnection>>;
    
    constructor() {
        this.userMap = new WeakMap<IncomingMessage, User>();
        this.connectionMap = new Map<number,  Array<UserConnection>>();
    }

    addUser(user: User, req: IncomingMessage) {
        this.userMap.set(req, user);
    }
    
    getUser(req: IncomingMessage) : User | undefined {
        return this.userMap.get(req);
    }

    removeUser(req: IncomingMessage) {
        this.userMap.delete(req);
    }

    addToRoomOrCreateRoom(room_id: number, connection: UserConnection) {
        const con: Array<UserConnection> = this.connectionMap.get(room_id) ?? [];
        
        con.push(connection);

        this.connectionMap.set(room_id, con);
    }

    getRoom(room_id: number): Array<UserConnection> | undefined {
        return this.connectionMap.get(room_id);
    }

    removeRoom(room_id) {
        this.connectionMap.delete(room_id);
    }

    getRoomIdForUser(person_id: number): number {
        for(const o in this.connectionMap) {
            const userList = this.connectionMap.get(parseInt(o));
            if( userList != null ) {
                for(const u of userList) {
                    if(u.user.person_id === person_id) {
                        return parseInt(o);
                    }
                }
            }
        }
        return -1;
    }

    removePeer(req: IncomingMessage, room_id: number) {
        const person_id = this.userMap.get(req).person_id;
        if(person_id != null) {
            this.userMap.delete(req);
            const userArr = this.connectionMap.get(room_id);
            if(userArr == null) {
                return;
            }
            for(const o in userArr) {
                if(userArr[o].user.person_id === person_id) {
                    const newArr = userArr.splice(parseInt(o), 1);
                    this.connectionMap.set(room_id, newArr);
                    return;
                }
            }
            
        }
    }
}