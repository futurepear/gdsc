
const {OAuth2Client} = require("google-auth-library");

const client = new OAuth2Client();

async function getUserFromToken(token) {
    let ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    let payload = ticket.getPayload();
    return payload;
}

module.exports = { getUserFromToken };