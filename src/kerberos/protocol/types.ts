export type ActorId = 'C' | 'AS' | 'TGS' | 'V';
export type MessageType = 'AS_REQ' | 'AS_REP' | 'TGS_REQ' | 'TGS_REP' | 'AP_REQ' | 'AP_REP';
export type Scenario = 'success' | 'badCredentials' | 'expiredTgt' | 'tamperedTgt' | 'tamperedServiceTicket' | 'clockSkew' | 'replay' | 'unknownService' | 'mutualAuth' | 'mutualAuthFail' | 'expiryAfterAccess';
export type Outcome = 'pending' | 'accepted' | 'rejected';
export interface EncryptedPart { label: string; protectedBy: string; readableBy: ActorId[]; contents: string[]; }
export interface ProtocolMessage { id: string; type: MessageType; from: ActorId; to: ActorId; purpose: string; fields: string[]; encrypted: EncryptedPart[]; timestamp: number; outcome: Outcome; validation?: string; }
export interface Ticket { kind: 'TGT' | 'Service Ticket'; id: string; client: string; service: string; issuedAt: number; expiresAt: number; protectedBy: string; corrupted?: boolean; }
export interface Event { sequence: number; timestamp: number; message: ProtocolMessage; summary: string; }
export interface SimulationState { scenario: Scenario; phase: number; clock: number; events: Event[]; messages: ProtocolMessage[]; replayCache: { authenticatorId: string; expiresAt: number }[]; tgt?: Ticket; serviceTicket?: Ticket; ctgsKey?: string; cvKey?: string; access: 'idle' | 'granted' | 'denied'; error?: string; started: boolean; }
