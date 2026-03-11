const http = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

if (!Number.isFinite(port) || port <= 0) {
    console.error("[startup] Invalid PORT:", process.env.PORT);
    process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function shutdown(server, code) {
    if (!server) {
        process.exit(code || 0);
        return;
    }

    server.close(() => process.exit(code || 0));
    setTimeout(() => process.exit(code || 0), 10000).unref();
}

(async function bootstrap() {
    let server;

    try {
        await app.prepare();

        server = http.createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url || "", true);
                await handle(req, res, parsedUrl);
            } catch (error) {
                console.error("[request] error:", error);
                if (!res.headersSent) {
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "text/plain; charset=utf-8");
                }
                res.end("Internal Server Error");
            }
        });

        server.on("error", (error) => {
            console.error("[server] error:", error);
            shutdown(server, 1);
        });

        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

        server.listen(port, hostname, () => {
            console.log(`[startup] Ready on http://${hostname}:${port} env=${process.env.NODE_ENV || "development"}`);
        });

        process.on("SIGTERM", () => shutdown(server, 0));
        process.on("SIGINT", () => shutdown(server, 0));
        process.on("uncaughtException", (error) => {
            console.error("[process] uncaughtException:", error);
            shutdown(server, 1);
        });
        process.on("unhandledRejection", (reason) => {
            console.error("[process] unhandledRejection:", reason);
            shutdown(server, 1);
        });
    } catch (error) {
        console.error("[startup] fatal:", error);
        shutdown(server, 1);
    }
})();
