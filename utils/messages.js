const { knex } = require("./db.js");


module.exports = {
    async sendMessage(message, api_key, room) {
        const userData = await knex("users").select("*").where({ api_key }).first();
        if(!userData) throw new Error("invalid api key");
        const { username } = userData;
        const result = {
            message,
            username,
            room,
            time: new Date(Date.now()).getTime().toString()
        };
        await knex("messages").insert(result);
        return result;
    },
    async getMessages(room) {
        return await knex("messages").select("*").where({ room });
    }
}