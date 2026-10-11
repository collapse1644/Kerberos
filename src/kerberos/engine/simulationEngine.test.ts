import { describe, expect, it } from 'vitest';
import { createSimulation, next, replay } from './simulationEngine';
const run=(x= createSimulation())=>{let s=x;for(let i=0;i<7;i++)s=next(s);return s;};
describe('deterministic Kerberos teaching engine',()=>{
 it('completes normal flow and issues tickets',()=>{const s=run();expect(s.access).toBe('granted');expect(s.tgt?.kind).toBe('TGT');expect(s.serviceTicket?.kind).toBe('Service Ticket');expect(s.events).toHaveLength(5);});
 it.each(['badCredentials','expiredTgt','tamperedTgt','tamperedServiceTicket','clockSkew','replay','unknownService','expiryAfterAccess'] as const)('rejects %s through validation',x=>{const s=run(createSimulation(x));expect(s.access).toBe('denied');expect(s.events.at(-1)?.message.outcome).toBe('rejected');});
 it('supports mutual auth and deterministic replay',()=>{const s=run(createSimulation('mutualAuth'));expect(s.messages.at(-1)?.type).toBe('AP_REP');expect(replay(createSimulation()).events.map(e=>e.message.type)).toEqual(run().events.map(e=>e.message.type));});
 it('rejects an invalid mutual-authentication proof',()=>{const s=run(createSimulation('mutualAuthFail'));expect(s.access).toBe('denied');expect(s.messages.at(-1)?.type).toBe('AP_REP');});
});
