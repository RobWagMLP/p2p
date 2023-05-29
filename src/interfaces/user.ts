import * as ws from 'ws'

export interface User {
    person_id : number;
    email     : string;
    user_roles: string[];
}

export interface UserConnection {
    user: User;
    connection: ws.WebSocket
}