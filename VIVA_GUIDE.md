# Kerberos V4 Interactive Protocol Lab - Viva Guide

Use this as a project-specific speaking guide. The simulator is an **educational model**, not a production Kerberos implementation.

## 1. One-minute project explanation

This project is an interactive, multi-actor laboratory for understanding the Kerberos Version 4 authentication flow. Instead of playing a fixed animation, it uses one authoritative Node.js server that maintains the protocol state. The Client, Authentication Server (AS), Ticket-Granting Server (TGS), and Service Server each have their own dashboard.

The Client creates requests, but cannot approve itself. Requests enter the receiving server's queue. The operator of AS, TGS, or Service must select the request, validate it, and explicitly grant or reject it. The central Control Room and all open browser tabs receive synchronized state updates through WebSockets. This makes the demonstration closer to operating four logical servers than viewing a slideshow.

## 2. What happens in a successful demo

### Step 1 - Client requests a TGT

1. Open `/client`.
2. Click **Request TGT from AS**.
3. The server creates an `AS_REQ` with a stable request ID and puts it in the AS queue.
4. The Control Room shows a directed Client-to-AS edge.
5. Open `/as`, select the request, validate it, then click **Grant TGT**.
6. The server creates a simulated Ticket-Granting Ticket (TGT), stores it in the client ticket cache, and sends an `AS_REP` response back to Client.

Important: the TGT does not exist until the AS operator grants the already validated request.

### Step 2 - Client requests a service ticket

1. Return to `/client`.
2. **Request service ticket** becomes enabled only after a TGT exists.
3. Clicking it creates `TGS_REQ`, which is delivered to `/tgs`.
4. TGS validates the TGT, authenticator freshness, replay cache, clock-skew policy, and requested service.
5. If validation passes, the TGS operator issues the service ticket.
6. The client receives a simulated `TGS_REP` and caches its service ticket.

### Step 3 - Client requests application access

1. On `/client`, **Request access** becomes enabled only after a service ticket exists.
2. Client sends `AP_REQ` to `/service`.
3. The Service operator selects and validates the request.
4. When granted, the shared client state becomes `granted`, and all views update.

## 3. Architecture explanation

```text
React browser views
  /, /client, /as, /tgs, /service, /inspector
                  |
             WebSocket
                  |
Node.js + Express + ws server
  authoritative SimulationStore
                  |
typed request, ticket, validation, and audit state
```

### Why one authoritative server?

If each browser independently simulated Kerberos, two devices could disagree about whether a ticket exists or whether a request was approved. Here, `server/simulationStore.ts` is the only code allowed to create requests, validate them, issue tickets, grant access, reset a run, or emit messages. React only renders the snapshots received from the server and sends commands.

### Why WebSockets?

WebSockets provide immediate bidirectional communication. When one operator approves a request on `/as`, the server broadcasts a fresh snapshot to every connected Client, TGS, Service, Control Room, and LAN browser. This is more suitable than repeatedly polling an HTTP API.

### Why is the model deterministic?

The simulated clock starts from a fixed timestamp and advances predictably when audited events occur. Therefore ticket expiry, clock skew, replay checks, and tests do not depend on the laptop's wall clock.

## 4. Important files to mention

| File | Purpose |
|---|---|
| `server/index.ts` | Express server, static SPA serving, WebSocket endpoint, broadcasting snapshots |
| `server/simulationStore.ts` | Authoritative state, queues, validation, ticket issuance, audit events, transient edges |
| `src/kerberos/protocol/manualTypes.ts` | Typed requests, statuses, audit events, shared simulation state, commands |
| `src/kerberos/engine/simulationEngine.ts` | Pure deterministic V4 teaching engine and protocol transition tests |
| `src/hooks/useSimulation.ts` | React WebSocket client with reconnection behavior |
| `src/app/App.tsx` | Route views and operator controls |
| `src/styles.css` | Responsive laboratory UI and Control Room directed-edge presentation |
| `server/simulationStore.test.ts` | Tests for authoritative actor-driven workflow |

## 5. Technologies used

| Technology | Why it is used |
|---|---|
| React | Component-based browser interface and independent dashboards |
| TypeScript | Strong types for actors, tickets, requests, status values, events, and commands |
| Vite | Fast local React development server and production frontend build |
| Node.js | Runs the local shared simulation authority |
| Express | Serves the built SPA and snapshot HTTP endpoint in production |
| `ws` | WebSocket server for live broadcast and command handling |
| Framer Motion | Used for purposeful visual protocol/message motion in the frontend |
| Lucide React | Consistent accessible SVG icons |
| Vitest | Automated unit tests for engine and server state machine |
| CSS | Responsive dark technical UI without a large UI framework |

## 6. Kerberos V4 concepts used in the project

### Client (C)

The user's workstation. It requests authentication, holds tickets in a local simulated ticket cache, creates authenticators, and requests service access.

### Authentication Server (AS)

The AS performs initial identity/credential validation. After successful validation it issues:

- A client-TGS session-key reference for the client.
- A TGT protected for the TGS.

### Ticket-Granting Ticket (TGT)

The TGT proves that the AS authenticated the client. It is intended for the TGS, not the client. The client carries it but should not be able to decrypt its protected content.

### Ticket-Granting Server (TGS)

The TGS validates the TGT and authenticator, then issues a service ticket for the requested application service.

### Service Server (V)

The application server validates the service ticket and fresh authenticator before granting access.

### Session keys

Conceptually, Kerberos establishes temporary keys:

- `K_C,TGS`: Client-TGS session key.
- `K_C,V`: Client-Service session key.

This simulator exposes only safe references and teaching metadata. It does not broadcast raw reusable secret material.

### Authenticator

An authenticator contains client identity and a fresh timestamp, protected using the current session-key relationship. It prevents a captured ticket alone from being reused indefinitely.

## 7. Request status lifecycle

Each request has a stable ID and passes through explicit server-side states:

```text
Pending -> Selected -> Validated -> Granted
                           |             
                           -> Validation failed -> Rejected
Selected/Validated -> Rejected (administrative decision)
```

- **Pending**: delivered to a receiving actor queue.
- **Selected**: operator opened it for review.
- **Validated**: protocol checks passed; issuance is now allowed.
- **Validation failed**: mandatory check failed; grant is blocked.
- **Granted**: ticket or access response was issued exactly once.
- **Rejected**: operator rejected it or confirmed a validation failure.

This prevents duplicate ticket issuance and prevents an operator from granting before validation.

## 8. Validation and attack scenarios

Scenarios configure input conditions. They do not automatically approve anything. The usual queue workflow still applies.

| Scenario | Validating actor | Rule that fails |
|---|---|---|
| Invalid credentials | AS | Synthetic principal credential check |
| Expired TGT | TGS | TGT validity lifetime |
| Tampered TGT | TGS | TGT integrity/protected-envelope check |
| Clock skew | TGS | Authenticator timestamp must be within permitted skew |
| Replay attempt | TGS | Authenticator is already present in replay cache |
| Unknown service | TGS | Requested service is not allowed/known |
| Tampered service ticket | Service | Service-ticket integrity check |
| Expired service ticket | Service | Ticket lifetime check |
| Mutual authentication | Client/Service | Service returns a timestamp proof under client-service context |

## 9. Control Room arrows

The root route shows a live directed edge only for the most recent message delivery/response:

- Client request: `C -> AS`, `C -> TGS`, or `C -> V`.
- Actor decision: `AS -> C`, `TGS -> C`, or `V -> C`.

The authoritative server stores this as `liveEdge`. It remains visible until a new message replaces it or a maximum 45-second timeout clears it. The client UI never decides protocol state from the animation.

## 10. Cryptography disclaimer

Kerberos V4 historically used DES. DES is obsolete and should not be used in production.

This project accurately teaches the **roles and boundaries** of long-term keys, session keys, tickets, authenticators, timestamps, lifetimes, and replay prevention. It deliberately does not implement real DES, real password verification, KDC databases, binary V4 encoding, network interoperability, or production-grade encryption. All principals and ticket values are synthetic.

## 11. Viva questions and suggested answers

### Q1. What problem does Kerberos solve?

Kerberos provides centralized network authentication. It allows a user to obtain tickets for services without repeatedly sending a password to each service server.

### Q2. Why is a password not sent in AS_REQ?

Sending passwords over a network creates a theft risk. In Kerberos, the client proves knowledge of a secret indirectly and receives ticket/session-key information after AS validation.

### Q3. What is the difference between a TGT and service ticket?

A TGT is used with the TGS to request tickets for services. A service ticket is used with one specific application server, such as the ledger service in this demo.

### Q4. Why cannot the client decrypt the TGT?

The TGT is conceptually protected using the TGS long-term key. The client only stores and forwards it. This prevents the client from altering the protected ticket contents.

### Q5. What is an authenticator and why do we need it?

An authenticator proves current possession of the session-key context and includes a fresh timestamp. It prevents an attacker from replaying only a captured ticket.

### Q6. How is replay detected here?

The TGS validation model uses a replay-cache condition for an authenticator identity/timestamp. A repeated authenticator is rejected inside server validation, not only displayed as a UI failure.

### Q7. What is clock skew?

Distributed machines may not have identical clocks. Kerberos permits a small configured time difference. An authenticator outside that time window is rejected because it might be stale or replayed.

### Q8. Why use WebSockets instead of REST only?

The project has several synchronized operator dashboards. WebSockets immediately broadcast server state changes to every connected tab or LAN device, while REST alone would require polling for updates.

### Q9. How do you prevent two AS operators from issuing the same TGT?

The server validates request status before every command. Grant is permitted only from `validated`; after grant the request becomes terminal (`granted`), so a second grant command is rejected.

### Q10. How is client-side cheating prevented?

React does not own the protocol state. Buttons send commands, but the Node.js server checks request ownership, state, and validations. A browser cannot directly create a ticket by changing local state.

### Q11. What happens if two people open the project on the same Wi-Fi?

They connect to the same Node.js authority. Both receive the same WebSocket snapshots. If one person validates or grants an AS request, the other sees the status update immediately.

### Q12. What happens on reset?

The server creates a new run ID, clears requests, tickets, audit history, and temporary edges. This prevents old messages or queued requests from being reused in the new run.

### Q13. Is this a real production Kerberos V4 server?

No. It is intentionally an educational simulator. It does not implement DES, production key storage, real KDC communication, real accounts, or V4 wire-level interoperability.

### Q14. Why is Kerberos V4 historically important but insecure today?

V4 used DES, which has a small key size and is obsolete. Modern Kerberos V5 adds stronger cryptography, improved extensibility, more ticket options, and better cross-realm support.

### Q15. What is mutual authentication?

Normal authentication lets the service validate the client. Mutual authentication additionally lets the client verify that the service knows the client-service session-key context, reducing the risk of connecting to an impostor service.

### Q16. What is the role of TypeScript here?

TypeScript gives compile-time guarantees around actor IDs, request kinds, statuses, commands, tickets, and events. It makes invalid state transitions and mismatched message structures easier to detect before runtime.

### Q17. What are the project limitations?

It is in-memory only, so state resets if the server restarts. It has no persistent database, user accounts, actual DES cryptography, real network Kerberos packets, or production authorization policies. These are deliberate limits for a safe academic demonstration.

## 12. Recommended presentation order

1. Start at `/` and explain that it is a shared overview, not an auto-play animation.
2. Open `/client` and `/as` in separate windows.
3. Demonstrate Client `AS_REQ`, then AS queue/select/validate/grant.
4. Point out the reverse response edge and Client ticket cache update.
5. Repeat using `/tgs`, explaining the TGT, authenticator, expiry, and replay validation.
6. Repeat using `/service`, explaining service-ticket validation and access grant.
7. Open `/inspector` to show safe message metadata and protection boundaries.
8. End with the limitations: teaching model, synthetic credentials, DES is historical only.
