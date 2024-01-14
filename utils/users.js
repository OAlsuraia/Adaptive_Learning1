const { knex } = require('./db');
const bcrypt = require("bcrypt");

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(15).then(salt => {
            bcrypt.hash(password, salt).then(resolve).catch(reject)
        }).catch(reject);
    });
}

function comparePassword(password, hashedPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hashedPassword).then(resolve).catch(reject);
    });
}

function generateRandomUUID() {
    let result = "";
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i = 0; i < 124; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function generateAPIKey() {
    let api_key = generateRandomUUID();
    while(await knex("users").select("*").where({ api_key }).first()) {
        api_key = generateRandomUUID();
    }
    return api_key;
}

module.exports = {
    async createUser(username, password, email) {
        const data = await knex("users").select("*").where({ username }).first();
        const sameEmail = await knex("users").select("*").where({ email }).first();
        if(sameEmail) throw new Error("email already exists");
        if(data) {
            throw new Error("user already exists");
        } else {
            const api_key = await generateAPIKey();
            await knex("users").insert({
                username,
                password: await hashPassword(password),
                email,
                api_key,
                isAdmin: false
            });
            return api_key;
        }
    },
    async checkUser(email, password) {
        const data = await knex("users").select("*").where({ email }).first();
        if(data) {
            const hashedPassword = data.password;
            try {
                const api_key = await generateAPIKey();
                const result = await comparePassword(password, hashedPassword);
                if(result) await knex("users").update({ api_key }).where({ email });
                
                return api_key;
            } catch {
                return false;
            }
        } else {
            return false;
        }
    },
    async checkByAPIKey(api_key) {
        const data = await knex("users").select("*").where({ api_key }).first();
        if(data) {
            return true;
        } else {
            return false;
        }
    }
}