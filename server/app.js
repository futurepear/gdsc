require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const { neon } = require('@neondatabase/serverless');
const sql = neon(`postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`);

const accounts = require("./accounts.js");

async function getPgVersion() {
    const result = await sql`SELECT version()`;
    console.log(result[0]);
}
getPgVersion();


getUserInfo("a");


// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //support parsing of forms or someting idk kinda useless tbh
app.use((err, req, res, next) => { //catch body parser errors
    if (err) { console.log(err); } else { next() }
});
app.use(cookieParser());

//PAGE ROUTES HERE - GET REQUESTS
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/test.html");
});

//POST REQUESTS - ALL THE API IS HERE
app.post("/api/createAccount", (req, res) => {
    let data = req.body;
    account.createAccount(sql, data.name, data.username);
});

app.post("/dev/login", async (req, res) => {

});

app.listen(3000);

accounts.createAccount(sql);

