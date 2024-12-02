# OSU GDSC Hackathon: PDFapp
This app allows users to upload PDFs of assignments and allow anyone to view and annotate them. This uses cloud infrastructure to build scalable and reliable architecture. The bulk of this project was made in about 5 days.  

Some features don't currently work, such as the left side search bar and navigation. 

## Architecture
**Database**: PostgreSQL (with NeonDB because its free)
**Large Data Storage**: Cloudflare R2 (stores images)
**Backend**: NodeJS + ExpressJS
**Frontend**: HTML/CSS/JS

## Setup:
**Environment**

**GHOST**: PostgreSQL environmental variables (see NeonDB docs):
**PGDATABASE**: PostgreSQL environmental variables (see NeonDB docs):
**PGUSER**: PostgreSQL environmental variables (see NeonDB docs):
**PGPASSWORD**: PostgreSQL environmental variables (see NeonDB docs):

**R2_ACCOUNT_ID**: R2 auth, see R2 docs. AWS S3 could be used too.
**R2_ACCESS_KEY**: R2 auth, see R2 docs. AWS S3 could be used too.
**R2_SECRET_ACCESS_KEY**: R2 auth, see R2 docs. AWS S3 could be used too.
**R2_BUCKET_NAME**: R2 auth, see R2 docs. AWS S3 could be used too.

**CDN_URL**: Points to R2 Bucket or a worker wrapping it. Used for caching.
**DIRECT_CDN_URL**:  Another URL with better caching capabilities. Can be CDN_URL

**NODE_ENV**: "development" or "production"

Also a few more for google oauth this is so much