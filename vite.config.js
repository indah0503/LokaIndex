import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { exec } from "child_process";

function terminalPlugin() {
  return {
    name: "terminal-executor",
    configureServer(server) {
      server.middlewares.use("/api/execute", (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", () => {
          try {
            const { command, cwd } = JSON.parse(body);

            if (!command || typeof command !== "string") {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Missing command" }));
              return;
            }

            const timeout = 30000;
            const workingDir = cwd || process.cwd();

            exec(command, { cwd: workingDir, timeout, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  stdout: stdout || "",
                  stderr: stderr || "",
                  exitCode: error ? error.code || 1 : 0,
                  message: error ? error.message : null,
                }),
              );
            });
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), terminalPlugin()],
  server: {
    port: 5173,
    host: "localhost",
  },
});
