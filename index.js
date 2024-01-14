const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const path = require("path");
const users = require('./utils/users.js');

const cookieParser = require('cookie-parser');
const messages = require('./utils/messages.js');

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on("connection", socket => {
    socket.on("message", async (message, room) => {
        const api_key = socket.handshake.headers.api_key;
        try {
            const data = await messages.sendMessage(message, api_key, room, io);
            (await io.fetchSockets()).forEach(s => {
                s.emit("message", message, data.username, room);
            })
        } catch(e) {
            socket.emit("error", e.message);
        }
    })
})

app.use(cookieParser());

app.use("*", async (req, res, next) => {
    const authorizationLinks = [
        "/signup/sign-up-en.html",
        "/signup/sign-up.html",
        "/signin/sign-In.html",
        "/signin/sign-in-en.html"
    ];
    if(authorizationLinks.map(f => req.originalUrl.startsWith(f)).includes(true)) {
        const api_key = req.cookies.api_key;
        if(api_key) {
            const data = await users.checkByAPIKey(api_key);
            if(data) {
                res.redirect("/");
            } else {
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
});

app.use("/", express.static(path.join(__dirname, "frontEnd")))

app.use("/api", require("./routes/api.js"))

const listener = server.listen(80, () => {
  console.log('server running at http://localhost:' + listener.address().port);
});