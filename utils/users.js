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

// Added function getUserByEmail - NEW
async function getUserByEmail(email) {
    return knex("users").select("*").where({ email }).first();
}

// Added function isValidPassword - NEW
async function isValidPassword(inputPassword, storedPassword) {
    try {
        return await comparePassword(inputPassword, storedPassword);
    } catch {
        return false;
    }
}

// Added function updateAPIKey - NEW
async function updateAPIKey(email, newApiKey) {
    await knex("users").update({ api_key: newApiKey }).where({ email });
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

    // Refactored checkUser function - EDITED
    async checkUser(email, password) {
        const user = await getUserByEmail(email);
        if (!user) return false;

        const isValid = await isValidPassword(password, user.password);
        if (!isValid) return false;

        const newApiKey = await generateAPIKey();
        await updateAPIKey(email, newApiKey);

        return newApiKey;
    },

    async checkByAPIKey(api_key) {
        const data = await knex("users").select("*").where({ api_key }).first();
        if(data) {
            return true;
        } else {
            return false;
        }
    }
};
