import http from "http";
import express from "express";
import SocketIO from "socket.io";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

const handleListen = () => console.log(`Listening ion http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);
wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Event : ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname);
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname)
    );
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
  socket.on("new_message", (roomName, message, done) => {
    done();
    socket.to(roomName).emit("new_message", `${socket.nickname} : ${message}`);
  });
});
/*
const wss = new WebSocket.Server({ server });
const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket.on("close", () => console.log("Disconnect from the Browser"));
  socket.on("message", (data) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "nickname":
        socket["nickname"] = message.payload;
        break;
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname} : ${message.payload.toString()}`)
        );
        break;
    }
  });
  socket.send("hello!");
});
*/
httpServer.listen(3000, handleListen);
