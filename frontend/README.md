# Spendora frontend

A React and Vite interface for the Spendora Express API.

## Run locally

1. Make sure the backend `.env` file has a working `MONGO_URI` and `PORT`.
2. Start the backend from the `backend` directory with `npm start`.
3. In this directory, install dependencies with `npm install`.
4. Start the Vite development server with `npm run dev`.

The frontend defaults to `http://localhost:5000/api/v1`. If your backend uses a
different address, create a `.env` file in this directory and set:

```env
VITE_API_URL=http://localhost:YOUR_PORT/api/v1
```

The API currently stores amounts without a currency setting, so totals are
shown as plain numbers. Transactions use the existing income and expense
endpoints; the list is paginated in the browser because the API does not expose
pagination.

## Accounts

Create an account with an email and password. New accounts are created unverified,
so after signing up you land on a "check your inbox" screen instead of the money
overview. Transactions created after this change belong to the logged-in account.
Records that were created before accounts existed have no owner and are not shown;
they need to be assigned to an account separately if you want to keep using them.

### Email verification

There is no mail provider wired up yet. `backend/utils/mailer.js` prints the link
to the backend console:

```
[auth] Verification link for you@example.com: http://localhost:5173/?verify=<token>
```

Copy that link into the browser to finish signing up. Clicking it verifies the
account and logs you in. The link is valid for 24 hours and the API only stores a
hash of the token.

Unverified accounts are deleted automatically: `verificationExpiresAt` has a
MongoDB TTL index, so a signup that is never verified is removed about 24 hours
later. Verified accounts have that field cleared, so they are never touched. This
is what keeps throwaway addresses from filling the database.

Logging in before verifying returns a 403 with `code: "email-not-verified"`, which
the frontend turns into the pending screen, where you can request a new link. That
endpoint always answers the same way so it can't be used to probe for registered
emails.

`mailer.js` builds links from `FRONTEND_URL`, defaulting to `http://localhost:5173`.
Set it in `backend/.env` if the frontend runs somewhere else:

```env
FRONTEND_URL=http://localhost:5173
```

In development the register/resend responses also include `verificationUrl` so the
pending screen can show a shortcut. That field is omitted when
`NODE_ENV=production`.

## Overview extras

The overview also shows three small charts (monthly cash flow, expenses by
category, and balance over time) computed from the loaded transactions. The
transaction list can be searched, filtered by type, sorted by date or amount, and
exported to CSV; its footer shows the total of whatever is currently filtered. The
add form suggests categories you have already used so the charts group cleanly.
Charts are plain SVG/CSS and the export uses `Blob`, so no extra dependencies were
added. The sidebar links jump to Overview, Insights and Transactions and highlight
whichever section is currently in view.

This is basic app authentication, not a complete identity system. It does not
include password recovery or login rate limiting. The login token is stored in
this browser; do not use this setup for sensitive production data without a
security review.
