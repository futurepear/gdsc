const { v4: uuidv4 } = require("uuid");

async function createAccount(sql, name, username) {
    const result = await sql`INSERT INTO users(username, name, created, session)
        VALUES (${username}, ${name}, ${sqlDate()}, ${uuidv4()});
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
async function createUsersTable(sql) {
    const a = await sql`DROP TABLE users;`;

    const result = await sql`CREATE TABLE users (
        uuid SERIAL PRIMARY KEY,
        username VARCHAR(30),
        name char(30),
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
        data char(10)
    )`;
    console.log(result);
}
async function createFile(sql, title, author, course, category, data) {
    const result = await sql`INSERT INTO users(title, author, created, class, category, data)
        VALUES (${title}, ${author}, ${sqlDate()}, ${course}, ${category}, ${data});
    `;
    return result;
}
function sqlDate() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
}

module.exports = { createAccount, sqlDate, getUser, createUsersTable, setSession, createFilesTable, createFile };