import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server, Socket } from "socket.io";
import ViteExpress from "vite-express";

dotenv.config();

const app = express();
app.use(cors());


const server = ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);

interface user {
    id: string;
    ip: string;
    nickname: string;
    isAlt: boolean;
}

let users: user[] = [];

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket: Socket) => {
    socket.on("userEnter", (nickname: string) => {
        nickname = nickname.trim()

        if (nickname.length === 0) {
            socket.emit("rejected", "Nickname cannot be empty");
            return;
        }
        if (nickname.length > 16) {
            socket.emit("rejected", "Nickname cannot be longer than 16 characters");
            return;
        }
        if (users.some((u) => u.nickname === nickname)) {
            socket.emit("rejected", "Nickname already taken");
            return;
        }

        const ip = socket.handshake.address;
        const user = {
            id: socket.id,
            ip,
            nickname,
            isAlt: users.some((u) => u.ip === ip)
        }
        users.push(user);
        console.log(`[new user] (@${socket.handshake.address} #${socket.id}): ${nickname}`);
        socket.join("allowedUsers");
        socket.emit("enterRoom", users);
        io.to("allowedUsers").emit("userAllowed", users);
        io.to("allowedUsers").emit("newMessage",
            {
                user: {
                    id: 0,
                    nickname: nickname
                },
                message: "newuser"
            }
        );
    });

    socket.on("userSend", (message: string) => {
        message = message.trim();
        if (message.length === 0) return
        const user = users.find((u) => u.id === socket.id);
        if (user) {
            io.to("allowedUsers").emit("newMessage",
                {
                    user: {
                        id: user.id,
                        nickname: user.nickname,
                    },
                    message: message
                }
            );
        }
    });

    socket.on('disconnect', () => {
        const user = users.find((u) => u.id === socket.id);
        if (user) {
            users = users.filter((u) => u.id !== socket.id);
            console.log(`[user left] (@${user.ip} #${user.id}): ${user.nickname}`);
            io.to("allowedUsers").emit("userAllowed", users);
            io.to("allowedUsers").emit("newMessage", {
                user: {
                    id: 0,
                    nickname: user.nickname
                },
                message: 'userleft'
            });
        }
    });
});

