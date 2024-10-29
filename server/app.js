require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const path = require("path");
const express = require("express");
const app = express();

const { neon } = require('@neondatabase/serverless');
const sql = neon(`postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`);

async function getPgVersion() {
    const result = await sql`SELECT version()`;
    console.log(result[0]);
}
getPgVersion();

async function bruh() {
    const result = await sql`CREATE TABLE users (
        uuid char(36),
        username VARCHAR(30),
        name char(30),
        created DATE
    )`;
    console.log(result);
}

async function getUserInfo(username){
   // const result = await sql`SELECT * FROM users WHERE username='${username}'`;
    //console.log(result);
}

getUserInfo("a");


app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/test.html");
});

app.listen(3000);