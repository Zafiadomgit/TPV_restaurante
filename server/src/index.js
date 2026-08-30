import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import menuRouter from "./routes/menu.js";
import ordersRouter from "./routes/orders.js";
import { getOrders } from "./store.js";

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter(io));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.emit("pedidos:estado_inicial", getOrders());
});

httpServer.listen(PORT, () => {
  console.log(`Servidor TPV escuchando en http://localhost:${PORT}`);
});
