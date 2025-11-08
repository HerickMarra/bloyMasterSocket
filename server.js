// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // depois você limita pro IP do seu jogo Unity
    methods: ["GET", "POST"]
  }
});

// Lista dos jogadores conectados
let players = {};

// Quando um novo cliente conecta
io.on("connection", (socket) => {
  console.log(`🟢 Jogador conectado: ${socket.id}`);

  // Quando o jogador entra no jogo
  socket.on("joinGame", (data) => {
  const room = data.room || "default";
  const name = data.name || "SemNome";

  socket.join(room);

  if (!players[room]) players[room] = {};

  players[room][socket.id] = {
    id: socket.id,
    name,
    position: { x: 0, y: 0, z: 0 },
  };

  console.log(`🟢 ${socket.id} entrou na sala ${room}`);

  // Envia apenas pra ele os outros jogadores da mesma sala
  socket.emit("currentPlayers", players[room]);
  socket.emit("pushId", socket.id);

  // Avisa os outros jogadores da sala
  socket.to(room).emit("newPlayer", {
    user: players[room][socket.id],
  });
});

  socket.on("playerMove", (data) => {
  if (!players[socket.id]) return;

  // Atualiza posição e rotação do jogador
  players[socket.id].position = { x: data.x, y: data.y, z: data.z };
  players[socket.id].rotation = { x: data.rx, y: data.ry, z: data.rz };

  // Envia para todos os outros jogadores
  socket.broadcast.emit("playerMoved", {
    id: socket.id,
    position: players[socket.id].position,
    rotation: players[socket.id].rotation
  });

});

socket.on("playerAnimSetFloat", (data) => {
  if (!players[socket.id]) return;


  // Envia para todos os outros jogadores
  socket.broadcast.emit("playerAnimGetFloat", {
    id: socket.id,
    param: data.param,
    val: data.val
  });

  console.log(`🟢 Anim Mudou:`, {
    id: socket.id,
    param: data.param,
    val: data.val
  });
  
});


  // Quando o jogador sai
  socket.on("disconnect", () => {
    console.log(`🔴 Jogador saiu: ${socket.id}`);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
