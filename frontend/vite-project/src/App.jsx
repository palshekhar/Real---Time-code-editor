import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

// 🔥 IMPORTANT: use your HTTPS domain here after NGINX setup
const socket = io("https://yourdomain.com", {
  transports: ["websocket"],
});

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomid, setRoomid] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  // 🔹 SOCKET EVENTS
  useEffect(() => {
    socket.on("userJoined", (users) => {
      console.log("Users:", users);
      setUsers(users);
    });

    socket.on("codeupdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("usertyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLang) => {
      setLanguage(newLang);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeupdate");
      socket.off("usertyping");
      socket.off("languageUpdate");
    };
  }, []);

  // 🔹 HANDLE TAB CLOSE
  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // 🔹 JOIN ROOM
  const joinRoom = () => {
    if (roomid && userName) {
      socket.emit("join", { roomid, userName });
      setJoined(true);
    }
  };

  // 🔹 COPY ROOM ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomid);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  // 🔹 LANGUAGE CHANGE
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("languageChange", { roomid, language: newLang });
  };

  // 🔹 CODE CHANGE
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomid, code: newCode });
    socket.emit("typing", { roomid, userName });
  };

  // 🔹 LEAVE ROOM
  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomid("");
    setUserName("");
    setLanguage("javascript");
    setCode("// start code here");
    setUsers([]);
  };

  // 🔹 UI
  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>

          <input
            type="text"
            placeholder="Room ID"
            value={roomid}
            onChange={(e) => setRoomid(e.target.value)}
          />

          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Room: {roomid}</h2>
          <button onClick={copyRoomId}>Copy ID</button>
          {copySuccess && <span>{copySuccess}</span>}
        </div>

        <h3>Users:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>

        <p>{typing}</p>

        <select value={language} onChange={handleLanguageChange}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button onClick={leaveRoom}>Leave Room</button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
};

export default App;
