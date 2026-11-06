# Spendora

Spendora is a personal finance tracker web app. It lets you register/login, verify your email, track income and expenses, view summaries/charts, edit/delete transactions, export CSV, manage a basic profile (including a local photo upload), reset your password, and switch display currency (default: **TND — Tunisian Dinar**).

## Tech stack
- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Node.js + Express + Mongoose (`backend/`)
- **Database:** MongoDB (local or MongoDB Atlas)
- **Email:** Gmail SMTP via Nodemailer (for email verification and password reset)

## Project structure
```text
Spendora/
  backend/      # Express API, auth, transactions, email
  frontend/     # React app (Vite)
  postman/      # (optional) API collection/assets if present
  README.md
```

## Prerequisites
- **Node.js** (LTS recommended) and **npm**
- A **MongoDB** database (MongoDB Atlas connection string or local MongoDB)
- A **Gmail account** with an **App Password** (for sending verification/reset emails)

## 1) Clone the repository
```bash
git clone https://github.com/ayoubrouis/Spendora.git
cd Spendora
```

## 2) Backend setup
### Install dependencies
```bash
cd backend
npm install
```

### Configure environment variables
Create `backend/.env` (you can copy from `backend/.env.example`) and set the values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

# Gmail SMTP (required to send verification/reset emails to real inboxes)
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

**Notes:**
- `MONGO_URI`: use your MongoDB Atlas URI or a local URI (e.g. `mongodb://127.0.0.1:27017/spendora`).
- `CLIENT_URL`: must match where the frontend runs (Vite default is `http://localhost:5173`). This is used to build verification/reset links.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD`: used by Nodemailer to send emails via Gmail SMTP.
  - Enable **2-Step Verification** on your Google account.
  - Create an **App Password**: Google Account → **Security** → **2-Step Verification** → **App passwords**.
  - Use the generated 16-character app password (spaces optional).
- **Do not commit `.env`**. It is gitignored.

### Run the backend
```bash
npm start
```
The API runs at `http://localhost:5000` (by default) under `/api/v1` (e.g. `http://localhost:5000/api/v1/...`).

## 3) Frontend setup
Open a new terminal:

```bash
cd frontend
npm install
```

### (Optional) Configure API URL
The frontend defaults to `http://localhost:5000/api/v1` (see `frontend/src/api/client.js`).  
If your backend runs elsewhere, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Run the frontend
```bash
npm run dev
```
Open the URL shown by Vite (usually `http://localhost:5173`).

## 4) Using the app (local)
1. Start **backend** and **frontend** in separate terminals.
2. Register a new account with your email.
3. Check your inbox (and Spam/Junk) for the **verification email** and click the link.
4. Log in and start adding income/expense transactions.

### Email verification notes
- Verification links are sent via **Gmail SMTP** when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are configured.
- If SMTP credentials are missing, the backend falls back to logging verification/reset links in the backend console (useful for local debugging).
- Gmail has sending limits; this setup is suitable for personal/small-project use.

### Currency
- Default display currency is **TND**.
- You can switch currencies from the app UI. The app **converts displayed values** using a simple static (approximate) rate table for convenience (it does not fetch live exchange rates). Stored transaction amounts remain unchanged.

## 5) Build frontend (production)
```bash
cd frontend
npm run build
npm run preview   # optional local preview
```

## Troubleshooting
- **“Could not connect to the server…” / CORS or network errors:** make sure the backend is running on the expected port and `VITE_API_URL` / `CLIENT_URL` match your setup. Restart backend after changing `.env`.
- **Verification email not received:** confirm `GMAIL_USER`/`GMAIL_APP_PASSWORD` are correct in `backend/.env`, restart backend, and check backend logs. Also check Spam/Junk. Gmail may block/limit sends if credentials are wrong.
- **MongoDB connection errors:** verify `MONGO_URI` and that your IP/network is allowed (Atlas IP allowlist / credentials).
- **Large profile image upload fails:** the backend accepts larger JSON bodies for avatar data URLs; keep images reasonably small (the UI limits uploads).

## Scripts
### Backend (`backend/package.json`)
- `npm start` — runs the server with `nodemon`

### Frontend (`frontend/package.json`)
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## Security / repo notes
- Never commit real secrets (`.env`, Gmail app passwords, database credentials, API keys).
- Registration/login uses hashed passwords and token-based sessions; email verification and password reset use expiring tokens.
