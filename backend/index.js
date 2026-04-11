const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors({
  origin: "*", // change to Vercel URL in production
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // { roomid: [{ id, userName }] }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN
  socket.on("join", ({ roomid, userName }) => {
    socket.join(roomid);

    if (!rooms[roomid]) rooms[roomid] = [];

    rooms[roomid].push({
      id: socket.id,
      userName,
    });

    // send updated users
    io.to(roomid).emit(
      "userJoined",
      rooms[roomid].map((u) => u.userName)
    );
  });

  // CODE CHANGE
  socket.on("codeChange", ({ roomid, code }) => {
    socket.to(roomid).emit("codeupdate", code);
  });

  // LANGUAGE
  socket.on("languageChange", ({ roomid, language }) => {
    socket.to(roomid).emit("languageUpdate", language);
  });

  // TYPING
  socket.on("typing", ({ roomid, userName }) => {
    socket.to(roomid).emit("usertyping", userName);
  });

  // LEAVE ROOM
  socket.on("leaveRoom", ({ roomid, userName }) => {
    if (!rooms[roomid]) return;

    rooms[roomid] = rooms[roomid].filter(
      (u) => u.id !== socket.id
    );

    io.to(roomid).emit(
      "userJoined",
      rooms[roomid].map((u) => u.userName)
    );
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let roomid in rooms) {
      rooms[roomid] = rooms[roomid].filter(
        (u) => u.id !== socket.id
      );

      io.to(roomid).emit(
        "userJoined",
        rooms[roomid].map((u) => u.userName)
      );
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
