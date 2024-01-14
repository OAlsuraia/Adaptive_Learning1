const express = require("express");
const users = require("../utils/users");
const messages = require("../utils/messages");
const app = express.Router();
const { knex } = require("../utils/db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/signup", async (req, res) => {
    const { email, username, password } = req.body;
    if(!email || !username || !password) return res.status(400).json({
        success: false
    });
    
    try {
        const result = await users.createUser(username, password, email);
        res.cookie("api_key", result).status(200).json({
            success: true
        });
    } catch(e) {
        let responseData = {
            success: false
        }
        responseData.message = e.message;
        return res.status(400).json(responseData)
    }
})

app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({
        success: false
    });
    const result = await users.checkUser(email, password);

    if(result) {
        res.cookie("api_key", result).status(200).json({
            success: true
        });
    } else {
        res.status(401).json({
            success: false
        });
    }
})

app.get("/check_api", async (req, res) => {
    const api_key = req.cookies.api_key;
    if(api_key) {
        const data = await users.checkByAPIKey(api_key);
        if(data) {
            res.status(200).json({
                success: true
            });
        } else {
            res.status(401).json({
                success: false
            });
        }
    } else {
        res.status(401).json({
            success: false
        });
    }
});

app.get("/history/:room", async (req, res) => {
    const api_key = req.cookies.api_key;
    const room = req.params.room;
    if(api_key) {
        const data = await users.checkByAPIKey(api_key);
        if(data) {
            const _messages = await messages.getMessages(room);
            res.status(200).json({
                success: true,
                messages: _messages
            });
        } else {
            res.status(401).json({
                success: false
            });
        }
    } else {
        res.status(401).json({
            success: false
        });
    }
})

app.get("/info", async (req, res) => {
    const api_key = req.cookies.api_key;
    if(api_key) {
        const data = await users.checkByAPIKey(api_key);
        if(data) {
            const userData = await knex("users").where({ api_key }).first();
            res.status(200).json({
                success: true,
                username: userData.username,
                email: userData.email
            });
        } else {
            res.status(401).json({
                success: false
            });
        }
    } else {
        res.status(401).json({
            success: false
        });
    }
});

module.exports = app;