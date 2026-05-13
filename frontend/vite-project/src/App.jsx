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

  // 🔥 CONNECT SOCKET - Real-time communication is a fundamental component [cite: 190]
  useEffect(() => {
    // Note: Replace with your actual deployed URL if needed
    socketRef.current = io("https://real-time-code-editor-2-r5s7.onrender.com", {
      transports: ["websocket"], // WebSocket facilitates instantaneous transmission [cite: 191]
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

  // 🔹 CODE CHANGE - Propagates changes to maintain data consistency [cite: 34]
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

  // 🔹 LOGIN SCREEN
  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
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
      </div>
    );
  }

  // 🔹 MAIN EDITOR LAYOUT - React framework for interactive UI 
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Room ID</h2>
          <span>{roomid}</span>
        </div>

        <div className="users-section">
          <h3>Collaborators</h3>
          <ul>
            {users.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>

        <p className="typing-status">{typing}</p>

        <div className="controls">
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Language</label>
          <select value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <button className="leave-btn" onClick={leaveRoom}>
            Leave Session
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default App;
