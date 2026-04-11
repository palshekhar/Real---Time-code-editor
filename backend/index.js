import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();

app.use(cors({
  origin: "*"
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", ({ roomid, userName }) => {
    socket.join(roomid);

    if (!rooms[roomid]) rooms[roomid] = [];

    rooms[roomid].push({ id: socket.id, userName });

    io.to(roomid).emit(
      "userJoined",
      rooms[roomid].map(u => u.userName)
    );
  });

  socket.on("codeChange", ({ roomid, code }) => {
    socket.to(roomid).emit("codeupdate", code);
  });

  socket.on("languageChange", ({ roomid, language }) => {
    socket.to(roomid).emit("languageUpdate", language);
  });

  socket.on("typing", ({ roomid, userName }) => {
    socket.to(roomid).emit("usertyping", userName);
  });

  socket.on("leaveRoom", ({ roomid }) => {
    if (!rooms[roomid]) return;

    rooms[roomid] = rooms[roomid].filter(u => u.id !== socket.id);

    io.to(roomid).emit(
      "userJoined",
      rooms[roomid].map(u => u.userName)
    );
  });

  socket.on("disconnect", () => {
    for (let roomid in rooms) {
      rooms[roomid] = rooms[roomid].filter(u => u.id !== socket.id);

      io.to(roomid).emit(
        "userJoined",
        rooms[roomid].map(u => u.userName)
      );
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
