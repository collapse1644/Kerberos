import type { ActorId, Scenario, Ticket } from './types';
export type RequestKind = 'AS_REQ' | 'TGS_REQ' | 'AP_REQ';
export type RequestStatus = 'pending' | 'selected' | 'validated' | 'validation_failed' | 'granted' | 'rejected';
export interface ManualRequest { id: string; kind: RequestKind; from: ActorId; to: ActorId; client: string; service: string; createdAt: number; status: RequestStatus; scenario: Scenario; validation?: { passed: boolean; rule: string; evidence: string[] }; decision?: string; ticketId?: string; }
export interface AuditEvent { id: string; timestamp: number; actor: ActorId; requestId?: string; action: string; outcome: 'info' | 'accepted' | 'rejected'; message: string; }
export interface ManualState { scenario: Scenario; clock: number; runId: number; client: { principal: string; targetService: string; tgt?: Ticket; serviceTicket?: Ticket; access: 'idle' | 'granted' | 'denied'; lastResponse?: string }; requests: ManualRequest[]; events: AuditEvent[]; liveEdge?: { from: ActorId; to: ActorId; label: string }; }
export type ManualCommand =
  | { type: 'scenario'; scenario: Scenario } | { type: 'reset' } | { type: 'clearClient' }
  | { type: 'demoRound' }
  | { type: 'clientRequest'; kind: RequestKind } | { type: 'select'; actor: ActorId; requestId: string }
 | { type: 'validate'; actor: ActorId; requestId: string } | { type: 'grant'; actor: ActorId; requestId: string } | { type: 'reject'; actor: ActorId; requestId: string };
