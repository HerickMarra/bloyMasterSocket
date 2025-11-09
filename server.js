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
  socket.on("joinGame", (playerData) => {
    players[socket.id] = {
      id: socket.id,
      name: playerData.name || "SemNome",
      position: { x: 0, y: 0, z: 0 },
      animator: {
        "Speed": 0
      }
    };
    
    // Envia pra ele todos os outros jogadores
    socket.emit("currentPlayers", players);
    socket.emit("pushId", socket.id);

    // Envia pros outros que um novo entrou
    socket.broadcast.emit("newPlayer", {
      user: players[socket.id]
    });
  });

  // Atualização da posição do jogador
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

//Atualiza float no animator
socket.on("playerAnimSetFloat", (data) => {
  if (!players[socket.id]) return;

  players[socket.id].animator[data.param] = data.val
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
