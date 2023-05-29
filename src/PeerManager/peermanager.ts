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

    deleteUser(req: IncomingMessage) {
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
}