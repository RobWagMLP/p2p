export enum IncomingRequestType {
    RequestRoom             = 1,
    SendOfferToPeers        = 2,
    SendOfferToSinglePeer   = 3,
    AcceptOfferFromPeers    = 4,
    SendIceCandidateToPeers = 5,
    Message                 = 6
}

export enum OutgoingRequestType {
    Error        = 1,
    RoomInfo     = 2,
    Status       = 3,
    Offer        = 4,
    Answer       = 5, 
    IceCandidate = 6,
    Order        = 7,
    Message      = 8
}