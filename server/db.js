const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

async function createAccount(sql, name, username, pass) {
    const result = await sql`INSERT INTO users(username, name, hash, created, session)
        VALUES (${username}, ${name}, ${await encrypt.hash(pass)}, ${sqlDate()}, ${uuidv4()});
    `;
    return true;
}

async function setSession(sql, username, token) {
    const result = await sql`UPDATE users
    SET session = ${token}
    WHERE username=${username}
    `;
}

//returns array of all records that matches the query
async function getUser(sql, username) {
    const result = await sql`SELECT * FROM users WHERE username=${username}`;
    return result;
}
async function getUserBySession(sql, token) {
    const result = await sql`SELECT * FROM users WHERE session=${token}`;
    return result;
}

async function createUsersTable(sql) {
    const a = await sql`DROP TABLE users;`;

    const result = await sql`CREATE TABLE users (
        uuid SERIAL PRIMARY KEY,
        username VARCHAR(30),
        name char(30),
        hash char(60),
        created DATE,
        session VARCHAR(100)
    )`;
    console.log(result);
}
async function createFilesTable(sql) {
    const a = await sql`DROP TABLE files;`;

    const result = await sql`CREATE TABLE files (
        uuid SERIAL PRIMARY KEY,
        title VARCHAR(30),
        author VARCHAR(30),
        created DATE,
        class VARCHAR(100),
        category VARCHAR(100),
        file char(36)
    )`;
    console.log(result);
}
async function createFile(sql, title, author, course, category, file) {
    const result = await sql`INSERT INTO files(title, author, created, class, category, file)
        VALUES (${title}, ${author}, ${sqlDate()}, ${course}, ${category}, ${file});
    `;
    return result;
}
async function findFiles(sql) {
    const results = await sql`SELECT * FROM files`;
    return results;
}
function sqlDate() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
} 

const encrypt = {
    hash: async (password) => {
        let salt = 10;
        const hashed = await bcrypt.hash(password, salt);
        return hashed;
    },
    compare: async (pass, hashedPass) => {
        return await bcrypt.compare(pass, hashedPass);
    }
}

module.exports = { createAccount, sqlDate, getUser, createUsersTable, setSession, createFilesTable, createFile, encrypt, getUserBySession, findFiles };