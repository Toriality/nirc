import './style.scss'
import { io } from 'socket.io-client'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div id="user">
        <h1>Welcome to <span id="title">nIRC</span>!</h1>
        <h2>Enter a nickname below to start chatting</h2>
        <form>
            <input type="text" id="nickname">
            <button id="connect" type="buttonn">Connect</button>
            <p id="error"></p>
        </form>
    </div>
    <div id="room">
        <div id="users"></div>
        <div id="chat">
            <div id="messages"></div>
            <div id="input">
                    <input type="text" id="message">
                    <button id="send">Send</button>
            </div>
        </div>
    </div>
`

const socket = io();

const button = document.getElementById("connect");
const form = document.getElementById("user");

const room = document.getElementById("room");
const users = document.getElementById("users");

const userSend = document.querySelector("#input button");
const messages = document.querySelector("#messages");
const message = document.querySelector("#input input") as HTMLInputElement;

const nicknameDiv = document.getElementById("nickname") as HTMLInputElement;
//@ts-ignore
let nickname: string;

message?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        socket.emit("userSend", message!.value);
        message!.value = "";
    }
})

userSend?.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("userSend", message!.value);
    message!.value = "";
})

button?.addEventListener("click", (e) => {
    e.preventDefault();
    socket.emit("userEnter", nicknameDiv!.value);
})

socket.on("enterRoom", () => {
    nickname = nicknameDiv!.value;
    room!.classList.add("active");
    form!.classList.add("hidden");
});

socket.on("userAllowed", (e) => {
    users!.innerHTML = "";
    e.forEach((user: any) => {
        const li = document.createElement("li");
        li.innerText = user.nickname;
        users!.appendChild(li);
    })
    message
});

socket.on("userLeft", (e) => {
    users!.innerHTML = "";
    e.forEach((user: any) => {
        const li = document.createElement("li");
        li.innerText = user.nickname;
        users!.appendChild(li);
    })
});

socket.on("rejected", (e) => {
    document.getElementById("error")!.innerText = e;
});

socket.on("newMessage", (e) => {
    const msg = document.createElement("div");
    msg.classList.add("message");

    let isServer = false;
    let newMessage = document.createElement("span");
    if (e.user.id === 0) {
        isServer = true
        msg.classList.add("server");
    }

    if (isServer) {
        switch (e.message) {
            case "newuser":
                newMessage.innerHTML = `user <span class="nickname">${e.user.nickname}</span> has joined`;
                break;
            case "userleft":
                newMessage.innerHTML = `user <span class="nickname">${e.user.nickname}</span> left`;
                break;
        }
    } else {
        newMessage.innerText = e.message
    }

    msg.innerHTML = `
<div class="user-nick ${isServer ? "server" : ""}">
<span>${isServer ? "server" : e.user.nickname}</span>
</div>
<div class="user-msg ${isServer ? "server" : ""}">
${newMessage.innerHTML}
</div>
`
    messages!.appendChild(msg);
    messages!.scrollTo(0, messages!.scrollHeight);
});

