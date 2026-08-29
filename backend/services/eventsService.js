/**
 * backend/services/eventsService.js
 *
 * Real-time Server-Sent Events (SSE) bus.
 *
 * Provides instantaneous, zero-latency push updates to all active Farmer
 * and Admin screens whenever queue stages, new bookings, counter statuses,
 * or payments change.
 */

const clients = new Set();

/**
 * Register a new SSE connection for a client.
 */
function addClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial ping to establish connection
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const client = { res, id: Date.now() + Math.random() };
  clients.add(client);

  req.on('close', () => {
    clients.delete(client);
  });
}

/**
 * Broadcast an event payload to all connected clients in real time.
 */
function broadcast(eventType, payload = {}) {
  const dataString = JSON.stringify({ type: eventType, ...payload, timestamp: Date.now() });
  for (const client of clients) {
    try {
      client.res.write(`data: ${dataString}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 20 seconds to prevent proxy timeouts
setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(': heartbeat\n\n');
    } catch {
      clients.delete(client);
    }
  }
}, 20000);

module.exports = {
  addClient,
  broadcast,
};
