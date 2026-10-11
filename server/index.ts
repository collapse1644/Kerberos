import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { SimulationStore, type Command } from './simulationStore.js';

const port = Number(process.env.PORT ?? 5174); const app = express(); const server = createServer(app); const store = new SimulationStore(); const clients = new Set<WebSocket>();
const publish = (snapshot: ReturnType<SimulationStore['snapshot']>) => { const data = JSON.stringify({ type: 'snapshot', snapshot }); clients.forEach((client) => { if (client.readyState === WebSocket.OPEN) client.send(data); }); };
store.subscribe(publish);
app.get('/api/snapshot', (_req, res) => res.json(store.snapshot()));
const dist = join(process.cwd(), 'dist'); if (existsSync(dist)) { app.use(express.static(dist)); app.get('/{*path}', (_req, res) => res.sendFile(join(dist, 'index.html'))); } else app.get('/', (_req, res) => res.json({ name: 'Kerberos V4 Protocol Lab', status: 'server ready' }));
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket) => { clients.add(socket); socket.send(JSON.stringify({ type: 'snapshot', snapshot: store.snapshot() })); socket.on('message', (raw) => { try { const value: unknown = JSON.parse(raw.toString()); if (!value || typeof value !== 'object' || !('type' in value)) { socket.send(JSON.stringify({ type: 'error', message: 'Invalid command.' })); return; } const accepted = store.command(value as Command); if (!accepted) socket.send(JSON.stringify({ type: 'error', message: 'Command is invalid in the current simulation state.' })); } catch { socket.send(JSON.stringify({ type: 'error', message: 'Malformed command.' })); } }); socket.on('close', () => clients.delete(socket)); });
server.listen(port, '0.0.0.0', () => console.log(`Kerberos simulation server: http://0.0.0.0:${port}`));
