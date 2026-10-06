// Run: k6 run load-test.js
import ws from 'k6/ws';
import { check } from 'k6';
export const options = { vus: 200, duration: '60s' };
export default function () {
  const url = 'ws://localhost:8080/socket.io/?EIO=4&transport=websocket';
  const res = ws.connect(url, {}, (socket) => {
    socket.on('open', () => socket.setInterval(() => socket.send('42["message","hello from k6"]'), 2000));
    socket.setTimeout(() => socket.close(), 30000);
  });
  check(res, { 'status 101': (r) => r && r.status === 101 });
}
