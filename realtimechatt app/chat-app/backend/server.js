const express = require('express');
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { Pool } = require('pg');
const prom = require('prom-client');

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://chat:chat@localhost:5432/chat';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const pool = new Pool({ connectionString: DATABASE_URL });

// Metrics
prom.collectDefaultMetrics();
const connections = new prom.Gauge({ name: 'chat_active_connections', help: 'Active sockets' });
const messages = new prom.Counter({ name: 'chat_messages_total', help: 'Messages sent' });

app.use(express.static('public'));
app.get('/health', (_req, res) => res.json({ status: 'ok', instance: os.hostname() }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', prom.register.contentType);
  res.end(await prom.register.metrics());
});

async function start() {
  // Redis adapter: lets all backend replicas broadcast to each other
  const pub = createClient({ url: REDIS_URL });
  const sub = pub.duplicate();
  await Promise.all([pub.connect(), sub.connect()]);
  io.adapter(createAdapter(pub, sub));

  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY, room TEXT NOT NULL, username TEXT NOT NULL,
    text TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`);

  io.on('connection', (socket) => {
    connections.inc();
    socket.on('join', async ({ room, username }) => {
      socket.data = { room, username };
      socket.join(room);
      const { rows } = await pool.query(
        'SELECT username, text, created_at FROM messages WHERE room=$1 ORDER BY id DESC LIMIT 50', [room]);
      socket.emit('history', rows.reverse());
      io.to(room).emit('system', `${username} joined (served by ${os.hostname()})`);
    });
    socket.on('message', async (text) => {
      const { room, username } = socket.data || {};
      if (!room || !text) return;
      await pool.query('INSERT INTO messages(room, username, text) VALUES($1,$2,$3)', [room, username, text]);
      messages.inc();
      io.to(room).emit('message', { username, text, created_at: new Date() });
    });
    socket.on('disconnect', () => connections.dec());
  });

  server.listen(PORT, () => console.log(`Chat backend on ${PORT} (${os.hostname()})`));
}

start().catch((e) => { console.error(e); process.exit(1); });
