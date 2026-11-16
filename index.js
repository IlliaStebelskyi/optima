const http = require("node:http");
const { Pool } = require("pg");

const port = Number(process.env.PORT || 3000);
const pool = new Pool();

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

async function start() {
  await pool.query("SELECT 1");
  console.log("Connected to PostgreSQL");

  const server = http.createServer(async (request, response) => {
    if (request.url === "/health") {
      try {
        await pool.query("SELECT 1");
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ status: "ok", database: "connected" }));
      } catch (error) {
        console.error("Database health check failed:", error);
        response.writeHead(503, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ status: "error", database: "unavailable" }));
      }
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Node.js app is running" }));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exitCode = 1;
});
