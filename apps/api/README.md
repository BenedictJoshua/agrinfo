# Primary Key API

## Run locally

```powershell
cd "C:\Users\jeffr\Desktop\Jeffrey Clg\DBMS-Project-Lockin\apps\api"
npm install
Copy-Item .env.example .env
npm run dev
```

The API listens on `http://localhost:4000`.

Useful routes:

- `GET /health`
- `GET /api/modules`
- `GET /api/locations?q=madurai`
- `GET /api/explore?location=Madurai`
- `GET /api/weather?latitude=9.9252&longitude=78.1198`
- `GET /api/integrations/status`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/verify`

The current API uses a small development dataset. It does not claim that the sample records are live agricultural measurements. MySQL repositories, authentication, and verified data imports should be added before production use.

## Provider configuration

Copy `.env.example` to `.env`. The default weather provider is OpenWeather. Do not commit `.env` or put server-side provider secrets in the React app.

The local secret file is `apps/api/.env`. It is ignored by the repository's `.gitignore` files and must remain on the backend machine only. Store the SMTP username and SMTP password there; never add them to `apps/web/.env.local`, any `VITE_*` variable, or a committed example file.

## MySQL setup

1. Install and start MySQL.
2. Run `database/migrations/001_initial_auth.sql`.
3. Set the `MYSQL_*` values in `apps/api/.env`.
4. Restart the API.

## Password reset email

Configure SMTP values in `.env`. The OTP is valid for 10 minutes, is stored hashed in MySQL, and expires after five failed attempts. The current flow verifies the OTP and returns the user to the main page; setting a new password can be added as a separate step.
