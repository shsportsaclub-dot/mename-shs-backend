SCORING HEROES - GO LIVE GUIDE (Telugu-English)

FILES
  server.js        backend (OTP SMS, SMS link login, live cricket feed). No installs needed.
  .env.example     settings. Copy to .env and fill.
  app-index.html   the app. Rename to index.html when you host it.

STEP 1  Server (Render / Railway / any VPS with Node 20.6+)
  - Upload server.js, package.json, .env
  - Start command:  node --env-file=.env server.js
  - You get an address like https://shs-api.onrender.com
  - Test:  open  <address>/health   -> {"ok":true}

STEP 2  Cricket live key
  - In .env put CRIC_API_KEY=<your CricketData.org key>. Key stays on the server only.
  - Free plan = 100 hits/day. Server caches 60 seconds, so all users share the same hit.
  - Open <address>/api/live to check.
  - The key was pasted in chat, so regenerate it on cricketdata.org after setup.

STEP 3  SMS from "SH Sports"  (India rules, important)
  - Use MSG91 (or any DLT-ready gateway). Register your company on DLT (Jio/Airtel/Vi portal).
  - Register Sender ID: SHSPRT (6 letters. "SH Sports" itself cannot be a sender; 6 characters only).
  - Register the SMS template and the link domain (your app address) on DLT. Approval takes 1-3 days.
  - Template text example:
      ##otp## is your Scoring Heroes code. Or tap to login: ##link## - SH Sports
  - In MSG91 create a Flow with that template; put AUTHKEY and TEMPLATE_ID in .env, SMS_PROVIDER=msg91
  - Until approval, keep SMS_PROVIDER=console (OTP prints in server log) for testing.

STEP 4  Host the app
  - Put app-index.html as index.html on Netlify / Vercel / Cloudflare Pages / GitHub Pages (HTTPS).
  - Open the app > menu > Settings > "OTP server URL" and paste your server address (or set DEFAULT_API in the code).
  - In .env set APP_URL and ALLOWED_ORIGINS to the app address, restart server.

HOW THE SMS LINK WORKS
  User enters number -> SMS arrives -> tap the link -> app opens and logs in automatically.
  (Or type the 6-digit code.) A phone cannot be forced to "allow" anything: a normal https link
  opens in the browser with no settings change. To make it an installable app icon later,
  add a PWA manifest; to open directly inside an APK use Android App Links.

SECURITY BUILT IN
  OTP valid 5 min, 5 wrong tries, 1 SMS per 30 sec per number, 5 per hour, link single use.
  First registered user becomes admin; add other admins/scorers in ADMIN_PHONES / SCORER_PHONES.

=====================================================================
LOGIN BY SENDING AN SMS  (user sends SMS from own phone -> auto login)
=====================================================================
How it works for the user
  1. Enters mobile number -> screen shows:  SMS "SH 123456" to +91 90000 00000, button "Open SMS and send"
  2. Taps the button, the SMS app opens with the text ready, presses Send.
  3. The app logs in by itself within a few seconds. Nothing else to type.
The server trusts only the sender number that the telecom network gives with the SMS.

What you must set up (one time)
  1. Buy an inbound SMS number from a gateway that supports India inbound SMS
     (MSG91 virtual number / Exotel / Kaleyra / Twilio).
  2. In .env set  MO_NUMBER=+91xxxxxxxxxx  (that number)  and  WEBHOOK_SECRET=some-secret
  3. In the gateway panel set the inbound SMS webhook (HTTP POST) to:
        https://YOUR-SERVER/api/mo/inbound?key=some-secret
     The server understands the common field names (from / From / sender / mobile and
     text / Body / message), JSON or form data.
  4. Restart the server. If MO_NUMBER is empty, the app falls back to normal OTP SMS.
Notes
  - The user pays their normal SMS rate. Code is valid 10 minutes, works once.
  - Android and iPhone both open the SMS app with the text pre-filled.

WHATSAPP LOGIN (no SMS, no DLT)
1. Meta for Developers: create app, add WhatsApp product, get a business number.
2. Webhook URL: https://YOUR-SERVER/api/wa/webhook, verify token = WA_VERIFY_TOKEN in .env, subscribe to "messages".
3. Put the number (with country code, digits only) in WA_NUMBER, restart.
The login screen then shows "Verify on WhatsApp"; the user presses send and is logged in on the web page automatically.
