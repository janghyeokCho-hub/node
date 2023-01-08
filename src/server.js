import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));

const handleListen = () => console.log(`Listening ion http://localhost:3000`);

const server = http.createServer(app);

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

server.listen(3000, handleListen);
