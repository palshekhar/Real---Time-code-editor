import { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client'
import Editor from '@monaco-editor/react'

const socket=io("http://13.233.173.38:5000");

const App = () => {
  const[joined,setjoined]=useState(false);
  const[roomid,setroomid]=useState("");
  const[userName,setuserName]=useState("");
  const[language,uselanguage]=useState("javascript");
  const[code,setcode]=useState("//start code here");
  const[copySuccess,setcopySuccess]=useState("");    
  const[users,setUsers]=useState([]);
  const[codeupdate,setcodeupdate]=useState([]);
  const[typing,setTyping]=useState("");

  useEffect(()=>{
     socket.on("userJoined",(users)=>{
        console.log("users event fired:", users);
        setUsers(users);
        // console.log(users);
        
     });

     socket.on("codeupdate",(newcode)=>{
        setcode(newcode);
       
     })

     socket.on("usertyping",(user)=>{
        setTyping(`${user.slice(0,8)}...is typing`)
        setTimeout(()=>setTyping(""),2000);
     })

     socket.on("languageUpdate",(newlanguage)=>{
          uselanguage(newlanguage);
     })

     return ()=>{
        socket.off("userJoined");
        socket.off("codeupdate");
        socket.off("usertyping");
        socket.off("languageUpdate");
     }
  },[]);

  useEffect(()=>{
     const handleBeforeUnload=()=>{
        socket.emit("leaveRoom");
     }

     window.addEventListener("beforeunload",handleBeforeUnload)

     return()=>{
       window.removeEventListener("beforeunload",handleBeforeUnload)
     }
  },[]);

  

  const joinroom=()=>{
      if(roomid && userName){
         socket.emit("join",{roomid,userName})
         setjoined(true);
      }
    }
  const copyRoomId=()=>{
    navigator.clipboard.writeText(roomid)
    setcopySuccess("Copied");
    setTimeout(()=>setcopySuccess(""),2000);
       
  }
  const handleLanguageChange=(e)=>{
         const newlanguage=e.target.value;
         uselanguage(newlanguage);
         socket.emit("languageChange",{roomid,language:newlanguage});
  }

  const handleCodeChange=(newcode)=>{
        setcode(newcode);
        socket.emit("codeChange",{roomid,code: newcode});
        socket.emit("typing",{roomid,userName});
  }

  const leaveroom=()=>{
      socket.emit("leaveroom");
      setjoined(false);
      setroomid("");
      setuserName("");
      uselanguage("javascript");
      setcode("//start code here");
  }

  if(!joined){
      return <div className="join-container">
        <div className="join-form">
           <h1>join code room</h1>

           <input type='text' placeholder='Room id'
           value={roomid} onChange={(e)=>setroomid(e.target.value)}/>

           <input type='text' placeholder='your name'
           value={userName} onChange={(e)=>setuserName(e.target.value)}/>

           <button onClick={joinroom}>Join room</button>

        </div>
      </div>
  }
  return (
    <div className='editor-container'>
       <div className='sidebar'>
          <div className='room-info'>
             <h2>Code Room : {roomid}</h2>
             <button onClick={copyRoomId}>
                  Copy Id
             </button>
             {copySuccess && <span className="copy-success">{copySuccess}</span>}
          </div>
          <h3>Users in Room :</h3>
          <ul>
          {users.map((user,index)=>(
              <li key={index}>{user.slice(0,8)}</li>
          ))}
             
          </ul>
          <p className='typing indicator'>{typing}</p>
          <select className='language-selector' value={language} onChange={handleLanguageChange}>
             <option value="javascript">javascript</option>
             <option value="python">python</option>
             <option value="java">java</option>
             <option value="cpp">c++</option>

          </select>
          <button className='leave-room' onClick={leaveroom}>Leave Room</button>
       </div>
       <div className='editor-wrapper'>
          <Editor
          height={"100%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme='vs-dark'
          option={
             {
               minimap:{enabled:false},
               fontSize:14
             }
          }
          />
       </div>
       
    </div>
  )
}

export default App;
