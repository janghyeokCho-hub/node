import http from "http";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

const handleListen = () => console.log(`Listening ion http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
  mode: "development",
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRooms(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  // 채팅 입장시 default nickname
  socket["nickname"] = "Anon";

  // 모든 소켓 이벤트 로그
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event : ${event}`);
  });

  // 룸 입장
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    // 해당 룸에 welcome event emit
    socket.to(roomName).emit("welcome", socket.nickname, countRooms(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRooms(roomName) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
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
