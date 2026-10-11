# Kerberos V4 Interactive Protocol Lab

A local, multi-device teaching laboratory for the historical Kerberos V4 exchange. A single Node.js simulation authority runs the deterministic protocol model; all React dashboards receive the same sanitized state and events over WebSockets.

## Architecture

```text
Browser dashboards (Control / Client / AS / TGS / Service / Inspector)
                              | WebSocket snapshots and validated commands
                              v
              Node + Express + WebSocket authoritative store
                              |
                pure deterministic Kerberos teaching engine
```

The server holds all simulation state in memory. Browser pages never execute protocol transitions themselves. The workflow is deliberately manual: C creates a request, the receiving actor receives it in a queue, selects it, validates it, and then explicitly grants or rejects it. A reset increments the run ID, clears pending work, and broadcasts an empty snapshot to every connected browser.

## Run locally or on a LAN

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Other devices on the same Wi-Fi can use `http://YOUR-LAN-IP:5173` (for example `http://192.168.1.25:5173`). Allow Node.js through the Windows firewall for private networks if the device cannot connect.

For a production-style server:

```bash
npm run build
npm start
```

Open `http://YOUR-LAN-IP:5174`. The server serves the built SPA, including direct route refreshes and WebSocket synchronization.

## Routes

| Route | Purpose |
|---|---|
| `/` | Shared Control Room: actor links, live queue counts, outcome, audit timeline |
| `/client` | Client principal, ticket cache, and manual request buttons |
| `/as` | Incoming AS queue; select, validate, grant or reject TGT requests |
| `/tgs` | Incoming TGS queue; validate TGT/authenticator and issue/reject service tickets |
| `/service` | Incoming access queue; validate and grant/reject service access |
| `/inspector` | Field-level packet and ticket protection inspection |

## Protocol model

1. `C -> AS`: `AS_REQ` asks for `krbtgt/ATHENA`; no password is sent on the wire.
2. `AS -> C`: `AS_REP` supplies the C-TGS session-key reference for C and a TGT sealed for TGS.
3. `C -> TGS`: `TGS_REQ` presents the opaque TGT and fresh authenticator for a requested service.
4. `TGS -> C`: `TGS_REP` returns a C-V session-key reference and service ticket sealed for V.
5. `C -> V`: `AP_REQ` presents the service ticket and authenticator; V validates before granting access.
6. Optional `AP_REP`: V returns a timestamp proof for mutual authentication.

Supported scenarios include invalid credentials, expired/tampered TGT, tampered/expired service ticket, clock skew, replay-cache rejection, unknown service, mutual-authentication failure, and normal/mutual success.

## Cryptographic scope

Kerberos V4 historically used DES. DES is obsolete. This application models V4 message roles, key ownership boundaries, ticket lifetimes, timestamp checks, and replay behavior with synthetic data. It does **not** implement DES, real password handling, a KDC database, V4 wire encoding, or production authentication. Public WebSocket snapshots deliberately omit session-key material.

## Quality checks

```bash
npm test
npm run build
```

Tests cover the pure engine's normal/failure paths, deterministic replay, mutual authentication, and server-store stepping, reset run IDs, command validation, and subscriber updates.

## Suggested demonstration

1. Open `/client` on one device and `/as` on another.
2. From Client select **Request TGT from AS**. Observe it appear as pending on AS.
3. On AS: open the request, validate it, then explicitly grant the TGT.
4. Repeat that controlled workflow between Client and TGS, then Client and Service.
5. Repeat the workflow with a configured failure scenario to observe the matching validator rejection.

### Viva prompts

- **Why can C not open the TGT?** It is protected by TGS's long-term key; C transports it unchanged.
- **Why use an authenticator?** It proves current session-key possession and contributes freshness/replay protection.
- **What does AP_REP prove?** The intended service knows the C-V session key.
- **Why is V4 not production safe?** Its DES-era cryptography and legacy design are obsolete.
