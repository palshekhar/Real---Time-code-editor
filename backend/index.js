import express from 'express'
import http from 'http'
import {Server} from "socket.io"
import path from 'path';

const app=express();

const server=http.createServer(app);
const port=5000;
const io= new Server(server,{
    cors:{
       origin:"*",
    },
});

const rooms=new Map();

io.on("connection",(socket)=>{
    console.log("user connected",socket.id);
     
    let currroom=null;
    let curruser=null;
    socket.on("join",({roomid,userName})=>{
        if(currroom){
          socket.leave(currroom)
          rooms.get(currroom).delete(curruser)
          io.to(currroom).emit("userJoined", Array.from(rooms.get(currroom)));
        }
        
        currroom=roomid;
        curruser=userName;

        socket.join(roomid);

        if(!rooms.has(roomid)){
           rooms.set(roomid,new Set())
        }

        rooms.get(roomid).add(userName)
        io.to(roomid).emit("userJoined", Array.from(rooms.get(currroom)));

      //   console.log("user joined with",currroom);
      
      })
      socket.on("codeChange",({roomid,code})=>{
        socket.to(roomid).emit("codeupdate",code);
      })


      socket.on("leaveRoom",()=>{
         if(currroom && curruser){
             rooms.get(currroom).delete(curruser);
             io.to(currroom).emit("userJoined", Array.from(rooms.get(currroom)));
             socket.leave(currroom);
             currroom=null;
             curruser=null;
         }
      })
      
      socket.on("disconnect",()=>{
         if(currroom && curruser){
             rooms.get(currroom).delete(curruser);
             io.to(currroom).emit("userJoined", Array.from(rooms.get(currroom)));
             socket.leave(currroom);
             
             
         }
      })
      currroom=null;
      curruser=null;

      socket.on("typing",({roomid,userName})=>{
           socket.to(roomid).emit("usertyping",userName);
      })

      socket.on("languageChange",({roomid,language})=>{
            io.to(roomid).emit("languageUpdate",language);
      })

  });

const __dirname=path.resolve()

app.use(express.static(path.join(__dirname,"/frontend/vite-project/dist")))

app.get(/.*/,(req,res)=>{
   res.sendFile(path.join(__dirname,"frontend","vite-project","dist","index.html"))
})

server.listen(port,()=>{
   console.log("server start on 5000");
   
})
