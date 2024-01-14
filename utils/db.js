const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./db.sqlite"
    },
    useNullAsDefault: true
});

;(async () => {
    if(!await knex.schema.hasTable("users")) {
        await knex.schema.createTable("users", table => {
            table.string("username");
            table.string("password");
            table.string("email");
            table.string("api_key");
            table.boolean("isAdmin");
        })
    }
    if(!await knex.schema.hasTable("messages")) {
        await knex.schema.createTable("messages", table => {
            table.string("message");
            table.string("username");
            table.string("time");
            table.string("room");
        })
    }
})();

module.exports = { knex };