import pkg from 'pg'

export enum ResultStatus {
    Error,
    Success
};

export interface DBResult {
    status:  ResultStatus, 
    res?:    pkg.QueryResult, 
    error?:  Error
};