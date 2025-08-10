import { serve } from "bun";
import { runQuery } from "./sqlite";

const MAX_ROWS = parseInt(process.env.MAX_ROWS || "1000");
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "5000");
const ROOM_ID = process.env.ROOM_ID || "default";

const clients = new Set<any>();

const server = serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);

    if (req.headers.get("upgrade") === "websocket") {
      const clientRoom = url.searchParams.get("room") || "default";

      if (clientRoom !== ROOM_ID) {
        return new Response("Room mismatch", { status: 400 });
      }

      // Bun's built-in WebSocket upgrade
      if (server.upgrade) {
        return server.upgrade(req, {
          data: {
            room: clientRoom,
          },
        });
      }

      return new Response("Upgrade failed", { status: 400 });
    }
    return new Response(Bun.file("./public/index.html"));
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("Client connected");
    },

    close(ws) {
      clients.delete(ws);
      console.log("Client disconnected");
    },

    // message(ws, message) {
    //   let data;
    //   try {
    //     data = JSON.parse(message.toString());
    //   } catch {
    //     ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    //     return;
    //   }

    //   const { id, sql } = data;

    //   if (!id || !sql || typeof sql !== 'string') {
    //     ws.send(JSON.stringify({ error: 'Missing id or sql' }));
    //     return;
    //   }

    //   console.log('Running query:', sql);

    //   runQuery(sql, MAX_ROWS, TIMEOUT_MS).then(result => {
    //     const payload = { id, ...result };
    //     const msg = JSON.stringify(payload);

    //     // Broadcast to all clients
    //     for (const client of clients) {
    //       client.send(msg);
    //     }
    //   });
    // }

    message(ws, message) {
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const { id, sql } = data;

      if (!id || !sql || typeof sql !== "string") {
        ws.send(JSON.stringify({ error: "Missing id or sql" }));
        return;
      }

      console.log("Running query:", sql);

      runQuery(sql, MAX_ROWS, TIMEOUT_MS).then((result) => {
        const payload = { id, sql, ...result }; // Add sql to payload
        const msg = JSON.stringify(payload);

        // Broadcast to all clients
        for (const client of clients) {
          client.send(msg);
        }
      });
    },
  },
});

console.log("Listening on http://localhost:3000");
