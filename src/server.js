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
  // 채팅 입장시 default nickname
  socket["nickname"] = "Anon";

  // 모든 소켓 이벤트 로그
  socket.onAny((event) => {
    console.log(`Socket Event : ${event}`);
  });

  // 룸 입장
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    // 해당 룸에 welcome event emit
    socket.to(roomName).emit("welcome", socket.nickname);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname)
    );
  });

  // 닉네임 설정
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));

  // 새로운 메시지
  socket.on("new_message", (roomName, message, done) => {
    done();
    socket.to(roomName).emit("new_message", `${socket.nickname} : ${message}`);
  });
});
httpServer.listen(3000, handleListen);
