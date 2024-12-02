require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const R2 = require("./r2.js");
const { Readable } = require("stream");
const oauth = require("./oauth2.js");

const { neon } = require('@neondatabase/serverless');
const sql = neon(`postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`);

const db = require("./db.js");

async function getPgVersion() {
    const result = await sql`SELECT version()`;
    console.log(result[0]);
}
getPgVersion();


// support parsing of application/json type post data
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.text({ limit: "2mb" }));
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
app.get("/auth/google/google-callback/oauth/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/oauth.html"));
});
app.get("/editor/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/editor.html"));
});
app.get("/image/*", async (req, res) => {
    let destination = req.url.substring(7);
    res.redirect(process.env.DIRECT_CDN_URL+"/pdfapp/files/"+destination);
});
app.get("/data/*", async (req, res) => {
    let destination = req.url.substring(6);
    let url = process.env.DIRECT_CDN_URL + "/pdfapp/files/" + destination;
   
    res.redirect(url);
});

app.post("/oauth/google/verify", async (req, res) => {
    return;
    let code = req.body;
    let params = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/auth/google/google-callback/oauth/login",
    };
    const query = new URLSearchParams("");
    for (let i in params)
        query.append(i, params[i]);
    
    let url = "https://oauth2.googleapis.com/token?" + query.toString();

    let result = await fetch(url, { method: "POST" });
    result = await result.json();

    if (result.id_token == null) return;

    let user = await oauth.getUserFromToken(result.id_token);
    console.log(user);
    
});

app.delete("/file/:id", async (req, res) => {
    if (req.params.id == null) return;
    let id = req.params.id;
    
    let user = await userFromSession(req);
    if (user == null) return;

    //check permissions
    let parent = {}; 
    let result = await db.findFile(sql, id);
    if (result == null) return;
    if (result.type == 1)  //edit file not pdf file
        parent = await db.findFile(sql, result.category);

    let edits = [];
    //if its a file we want all sub-files (edits)
    if (result.type == 0) {
        edits = await sql`SELECT file FROM files WHERE category=${id}`;
    }
    let permission = (result.author == user.username) || (parent.author == user.username);
    if (!permission) return;
    console.log("deleting" + id + edits);
    //ok now delete!
    await sql`DELETE FROM files WHERE category=${id} OR file=${id}`;

    mainUrl = process.env.CDN_URL + "/pdfapp/files/" + id + "/base.png";
    if (result.type == 1) mainUrl = process.env.CDN_URL + "/pdfapp/files/" + result.category + "/" + id + ".dat";
    fetch(mainUrl, {
        method: "DELETE",
        headers: {
            "X-Custom-Auth-Key": process.env.R2_SECRET_ACCESS_KEY,
            "Content-Type": "image/png"
        }
    });
    for (let i in edits) {
        let url = process.env.CDN_URL + "/pdfapp/files/" + id + "/" + edits[i].file + ".dat";
        console.log(url);
        fetch(url, {
            method: "DELETE",
            headers: {
                "X-Custom-Auth-Key": process.env.R2_SECRET_ACCESS_KEY,
                "Content-Type": "image/png"
            }
        });
    }

    res.send(JSON.stringify({ success: true }));
});

app.post("/uploadFile", async (req, res) => {
    let user = await userFromSession(req);
    if (user == null) return res.send(JSON.stringify({ success: false }));;

    let title = req.query.title;
    let id = uuidv4();
    let file = "/pdfapp/files/" + id + "/base.png";
    let result = db.createFile(sql, title, user.username, null, null, id); //TODO: check if this uplaoded
    
    let response = await fetch(process.env.CDN_URL + file, {
        method: "PUT",
        headers: {
            "X-Custom-Auth-Key": process.env.R2_SECRET_ACCESS_KEY,
            "Content-Type": "image/png"
        },
        body: req.body
    });
    response = await response.json();
    res.send(JSON.stringify(response));
});
app.post("/uploadFileEdit", async (req, res) => {
    let parentID = req.query.parent; //TODO: check if this is even valid
    let user = await userFromSession(req);
    if (user == null || parentID == null) return res.send(JSON.stringify({ success: false }));

    let id = uuidv4();
   
    let file = "/pdfapp/files/" + parentID + "/" + id + ".dat";
    let result = db.createFileEdit(sql, parentID, user.username, id);

    let response = await fetch(process.env.CDN_URL + file, {
        method: "PUT",
        headers: {
            "X-Custom-Auth-Key": process.env.R2_SECRET_ACCESS_KEY,
            "Content-Type": "text/plain"
        },
        body: req.body
    });
    response = await response.json();
    res.send(JSON.stringify(response));
});

//POST REQUESTS - ALL THE API IS HERE
app.post("/api/createAccount", async (req, res) => {
    let data = req.body;
    //check 1 - valid input?
    if (data.name == null || data.username == null || data.pass == null) {
        console.log("Invalid input", data);
        return res.end(JSON.stringify({ "success": false, "reason": "Invalid input" }));
    }
    if (!data.name.match(/^[0-9a-zA-Z-_.]+$/gm)) {
        return res.end(JSON.stringify({ "success": false, "reason": "Username can only contain alphanumeric symbols and _ - ." }));
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
app.get("/fileDetails/:id", async (req, res) => {
    if (req.params.id == null) return;
    let results = await db.findFullFileDetails(sql, req.params.id);
    let result = {};
    //clean up the data
    for (let i = 0; i < results.length; i++) {
        if (results[i].type == 0) {
            result = results[i];
            results.splice(i, 1);
            break;
        }
    }
    result.children = results;
    res.send(JSON.stringify(result));
});
app.get("/api/my-info", async (req, res) => {
    let session = req.cookies["session"];
    let info = { loggedin: false, name: null };
    if (session == null) return res.send(JSON.stringify(info));

    let acc = (await db.getUserBySession(sql, session))[0];
    
    if (acc != null) {
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
    if (acc == null) return res.end(JSON.stringify({ "success": false, "reason": "Account does not exist" }));
    //check 3: for non dev login: check password
    let auth = await db.encrypt.compare(data.pass, acc.hash);
    if (!auth) return res.end(JSON.stringify({ "success": false, "reason": "Invalid password" }));

    //login success: set cookies
    let session = Buffer.from(data.username + "." + uuidv4()).toString('base64');
    res.cookie("session", session);
    res.end(JSON.stringify({ "success": true, "reason": "Good job!!" }));   
    db.setSession(sql, data.username, session);
});

app.listen(process.env.PORT || 3000);

//db.createUsersTable(sql);
//db.createAccount(sql);
//db.createFilesTable(sql);
