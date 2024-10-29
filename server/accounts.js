const { v4: uuidv4 } = require("uuid");
async function createAccount(sql, name, username) {
    const result = await sql`INSERT INTO users(uuid, ${username}, ${name}, created)
        VALUES (${uuidv4()}, ${"guh"}, ${"Mon Name"}, ${sqlDate()});
    `;
}

async function getUser(username) {
    const result = await sql`SELECT * FROM users WHERE username='${username}'`;
    console.log(result);
}
async function createUsersTable() {
    const result = await sql`CREATE TABLE users (
        uuid char(36),
        username VARCHAR(30),
        name char(30),
        created DATE
    )`;
    console.log(result);
}

function sqlDate() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
}

module.exports = { createAccount, sqlDate, getUser };