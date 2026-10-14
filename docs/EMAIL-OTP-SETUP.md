# Email OTP setup — Gmail App Password and Render

The backend already implements email OTP in server.js:
- POST /api/email/send
- POST /api/email/verify
- EMAIL_PROVIDER: console, smtp, or resend

## Gmail App Password

A Gmail App Password is issued by Google. This repository cannot generate one.
1. Sign into the sending Google account.
2. Enable 2-Step Verification if needed.
3. Open https://myaccount.google.com/apppasswords
4. Use the label "Scoring Heroes Email" and create an App Password if the account supports it.
5. Put that value directly into the hosting provider's secret environment field SMTP_PASS.
Never commit it, put it in an APK, or post it in chat/screenshots.

Google help: https://support.google.com/accounts/answer/185833

## Important: Render Free does not support Gmail SMTP

The checked-in render.yaml selects plan: free.
Render Free web services block outbound ports 25, 465 and 587.
An App Password does not remove this restriction.

Choose either:
- An SMTP-capable deployment (such as a paid Render service) for Gmail SMTP; or
- The existing Resend HTTPS email route, using a verified permitted sender and a private API key.

No paid plan is selected or purchased by this guide.

Render documentation: https://render.com/docs/free
Render announcement: https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports

## SMTP-capable deployment environment

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_TLS=ssl
SMTP_USER=<sending Gmail address>
SMTP_PASS=<Google-issued App Password; secret field only>
EMAIL_FROM=SH Sports <sending Gmail address>

Do not paste angle-bracket placeholders literally. Use the real address privately.
Set values in the deployment's Environment panel, then deploy/restart.

## Existing HTTPS route environment

EMAIL_PROVIDER=resend
RESEND_API_KEY=<private provider API key>
EMAIL_FROM=SH Sports <sender authorised by the provider>

A Gmail App Password is not a Resend API key.

## Delivery check

Request one OTP to an address you control, confirm receipt, then verify that code.
Provider acceptance is not proof of inbox delivery.
EMAIL_PROVIDER=console is test-only: it logs the OTP and does not send email.
Do not call the deployment live until a real inbox/verification test passes.
Do not publish OTPs, keys or passwords in logs/screenshots.

## Status

Email implementation exists in source.
This setup guide does not generate credentials, configure Render secrets, deploy a service,
send a test email, or establish runtime delivery.
