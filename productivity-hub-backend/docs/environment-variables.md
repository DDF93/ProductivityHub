# ProductivityHub Environment Variables

**Location:** `~/ProductivityHub/productivity-hub-backend/.env`

## Current Variables

**Server:**

- PORT=3000
- NODE_ENV=production
- API_BASE_URL=https://api.productivityhub.app

**Database (Railway):**

- DATABASE_URL=postgresql://[full connection string from Railway]

**Authentication:**

- JWT_SECRET=[your secret key]
- BCRYPT_SALT_ROUNDS=10

**Email (AWS SES):**

- EMAIL_SERVICE=aws-ses
- AWS_REGION=eu-west-2
- AWS_ACCESS_KEY_ID=[from AWS IAM]
- AWS_SECRET_ACCESS_KEY=[from AWS IAM]
- EMAIL_FROM_NAME=ProductivityHub
- EMAIL_FROM_ADDRESS=noreply@productivityhub.app
- EMAIL_VERIFICATION_EXPIRES_HOURS=24

## How to View Variables

Terminal command: `cd ~/ProductivityHub/productivity-hub-backend && cat .env`

## How to Update Variables

1. Edit: `nano ~/ProductivityHub/productivity-hub-backend/.env`
2. Save: Ctrl+O, Enter, Ctrl+X
3. Restart: `pm2 restart productivity-hub-api`

## Emergency: Lost .env File

Get DATABASE_URL from Railway dashboard
Generate new JWT_SECRET: `openssl rand -base64 32` (invalidates sessions)
Get AWS credentials from AWS IAM console
