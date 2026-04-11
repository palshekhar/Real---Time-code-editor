import { useEffect, useState, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const App = () => {
  const socketRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [roomid, setRoomid] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  // 🔥 CONNECT SOCKET
  useEffect(() => {
    socketRef.current = io("https://real-time-code-editor-2-r5s7.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current.id);
    });

    socketRef.current.on("userJoined", (usersList) => {
      setUsers(usersList);
    });

    socketRef.current.on("codeupdate", (newCode) => {
      setCode(newCode);
    });

    socketRef.current.on("languageUpdate", (newLang) => {
      setLanguage(newLang);
    });

    socketRef.current.on("usertyping", (user) => {
      setTyping(`${user} is typing...`);
      setTimeout(() => setTyping(""), 1500);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // 🔹 JOIN ROOM
  const joinRoom = () => {
    if (roomid && userName) {
      socketRef.current.emit("join", { roomid, userName });
      setJoined(true);
    }
  };

  // 🔹 CODE CHANGE
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socketRef.current.emit("codeChange", { roomid, code: newCode });
    socketRef.current.emit("typing", { roomid, userName });
  };

  // 🔹 LANGUAGE CHANGE
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socketRef.current.emit("languageChange", { roomid, language: newLang });
  };

  // 🔹 LEAVE ROOM
  const leaveRoom = () => {
    socketRef.current.emit("leaveRoom", { roomid, userName });
    setJoined(false);
    setUsers([]);
  };

  if (!joined) {
    return (
      <div>
        <h1>Join Room</h1>
        <input
          placeholder="Room ID"
          value={roomid}
          onChange={(e) => setRoomid(e.target.value)}
        />
        <input
          placeholder="Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "250px" }}>
        <h3>Room: {roomid}</h3>

        <h4>Users:</h4>
        <ul>
          {users.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>

        <p>{typing}</p>

        <select value={language} onChange={handleLanguageChange}>
          <option value="javascript">JS</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>

        <button onClick={leaveRoom}>Leave</button>
      </div>

      <div style={{ flex: 1 }}>
        <Editor
          height="100vh"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};

export default App;
