require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const R2 = require("./r2.js");


const { neon } = require('@neondatabase/serverless');
const sql = neon(`postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`);

const db = require("./db.js");

async function getPgVersion() {
    const result = await sql`SELECT version()`;
    console.log(result[0]);
}
getPgVersion();


// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.raw({type: 'image/png', limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '2mb',  extended: true })); //support parsing of forms or someting idk kinda useless tbh
app.use((err, req, res, next) => { //catch body parser errors
    if (err) { console.log(err); } else { next() }
});
app.use(cookieParser());

//PAGE ROUTES HERE - GET REQUESTS
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/login.html"));
});
app.get("/editor", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/editor.html"));
});
app.get("/editor/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/editor.html"));
});
app.get("/image", async (req, res) => {
    res.redirect(process.env.CDN_URL+"/poire.png");
    return;
    
    res.writeHead(200, { 'Content-Type': 'image/png' });
    let data = await R2.getImage("");
    for (let i = 0; i < data.length; i++)
        res.write(data[i]);
    res.end();
    
});
app.post("/uploadFile", async (req, res) => {
    let user = await userFromSession(req);
    if (user == null) return;

    let title = req.query.title;

    let id = uuidv4();
    let file = "/pdfapp/files/" + id + "/base.png";
    let result = db.createFile(sql, title, user.username, null, null, id);
    
    let response = await fetch(process.env.CDN_URL + file, {
        method: "PUT",
        headers: {
            "X-Custom-Auth-Key": process.env.R2_SECRET_ACCESS_KEY,
            "Content-Type": "image/png"
        },
        body: req.body
    });
    console.log(await response.text());
});

//POST REQUESTS - ALL THE API IS HERE
app.post("/api/createAccount", async (req, res) => {
    let data = req.body;
    //check 1 - valid input?
    if (data.name == null || data.username == null || data.pass == null) {
        console.log("Invalid input", data);
        return res.end(JSON.stringify({ "success": false, "reason": "Invalid input" }));
    }
    //check 2 - does user exist
    let acc = await db.getUser(sql, data.username);
    if (acc.length > 0) {
        console.log("user exists", data);
        return res.end(JSON.stringify({ "success": false, "reason": "Username in use" }));
    }

    await db.createAccount(sql, data.name, data.username, data.pass);
    return res.end(JSON.stringify({ "success": true, "reason": "GOod job!!" }));
});

async function userFromSession(req) {
    let session = req.cookies["session"];
    if (session == null) return null;
    let acc = (await db.getUserBySession(sql, session))[0];
    return acc;
}

app.get("/filesList", async (req, res) => {
    let category = req.query.category;
    let results = await db.findFiles(sql);
    res.send(JSON.stringify(results));
});
app.get("/api/my-info", async (req, res) => {
    let session = req.cookies["session"];
    let info = { loggedin: false, name: null };
    if (session == null) return res.send(JSON.stringify(info));

    let acc = (await db.getUserBySession(sql, session))[0];
    if (acc !== null) {
        info.loggedin = true;
        info.name = acc.username;
    }
    return res.send(JSON.stringify(info));
});

app.post("/api/login", async (req, res) => {
    let data = req.body; //{username: string}
    //check 1 - valid input 
    if (data.username == null || data.pass == null) {
        return res.end(JSON.stringify({ "success": false, "reason": "Invalid input" }));
    }
    //check 2 - does user exist?
    let acc = (await db.getUser(sql, data.username))[0];
    if (acc == null) return res.end(JSON.stringify({ "success": false, "reason": "bruh dis account no exist" }));
    //check 3: for non dev login: check password
    let auth = await db.encrypt.compare(data.pass, acc.hash);
    if (!auth) return res.end(JSON.stringify({ "success": false, "reason": "Invalid password" }));

    //login success: set cookies
    let session = Buffer.from(data.username + "." + uuidv4()).toString('base64');
    res.cookie("session", session);
    res.end(JSON.stringify({ "success": true, "reason": "GOod job!!" }));   
    db.setSession(sql, data.username, session);
});

app.listen(3000);

//db.createUsersTable(sql);
//db.createAccount(sql);
//db.createFilesTable(sql);

