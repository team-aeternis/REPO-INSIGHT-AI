import app from "./app.js";
import http from "http";
import { env } from "./config/env.js";

const PORT = env.PORT;

const server = http.createServer(app);

const startServer = () => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    }); 
}

startServer();

