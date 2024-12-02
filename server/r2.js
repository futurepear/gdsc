//THIS THING DOES NOTHING NOW CUZ I USE CLOUDFLARE WORKER INSTEAD

const { S3, ListObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

const hashedSecretKey = crypto.createHash('sha256').update(SECRET_ACCESS_KEY).digest('hex');

const S3Client = new S3({
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
    //signatureVersion: 'v4',
    region: 'auto' // Cloudflare R2 doesn't use regions, but this is required by the SDK
});

async function listContents() {
    const { Contents } = await S3Client.send(
        new ListObjectsCommand({ Bucket: BUCKET_NAME }),
    );
    console.log(Contents);
}
async function getImage(key) {
    key = 'poire.png';
    const response = await (await S3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    )).Body.toArray();

    return response;
}
module.exports = {
    S3Client,
    BUCKET_NAME,
    listContents,
    getImage
}