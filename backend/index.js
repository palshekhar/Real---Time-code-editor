import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 5000;

// Store rooms
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let currRoom = null;
  let currUser = null;

  // 🔹 JOIN ROOM
  socket.on("join", ({ roomid, userName }) => {
    // Leave previous room
    if (currRoom && rooms.has(currRoom)) {
      rooms.get(currRoom).delete(currUser);
      io.to(currRoom).emit(
        "userJoined",
        Array.from(rooms.get(currRoom))
      );
      socket.leave(currRoom);
    }

    currRoom = roomid;
    currUser = userName;

    socket.join(roomid);

    if (!rooms.has(roomid)) {
      rooms.set(roomid, new Set());
    }

    rooms.get(roomid).add(userName);

    console.log("Users in room:", Array.from(rooms.get(roomid)));

    io.to(roomid).emit(
      "userJoined",
      Array.from(rooms.get(roomid))
    );
  });

  // 🔹 CODE CHANGE
  socket.on("codeChange", ({ roomid, code }) => {
    socket.to(roomid).emit("codeupdate", code);
  });

  // 🔹 TYPING
  socket.on("typing", ({ roomid, userName }) => {
    socket.to(roomid).emit("usertyping", userName);
  });

  // 🔹 LANGUAGE CHANGE
  socket.on("languageChange", ({ roomid, language }) => {
    io.to(roomid).emit("languageUpdate", language);
  });

  // 🔹 LEAVE ROOM
  socket.on("leaveRoom", () => {
    if (currRoom && currUser && rooms.has(currRoom)) {
      rooms.get(currRoom).delete(currUser);

      io.to(currRoom).emit(
        "userJoined",
        Array.from(rooms.get(currRoom))
      );

      socket.leave(currRoom);

      // cleanup empty room
      if (rooms.get(currRoom).size === 0) {
        rooms.delete(currRoom);
      }

      currRoom = null;
      currUser = null;
    }
  });

  // 🔹 DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (currRoom && currUser && rooms.has(currRoom)) {
      rooms.get(currRoom).delete(currUser);

      io.to(currRoom).emit(
        "userJoined",
        Array.from(rooms.get(currRoom))
      );

      if (rooms.get(currRoom).size === 0) {
        rooms.delete(currRoom);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
