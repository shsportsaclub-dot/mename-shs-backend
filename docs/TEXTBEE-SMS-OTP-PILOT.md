# TextBee 300-message SMS OTP pilot

The Android gateway is the supplied textbee.dev.v2.9.0.apk (package com.vernu.sms).
The Scoring Heroes APK is a separate client; the API sends to TextBee over HTTPS,
and the linked Android gateway phone sends through its SIM.

## Hosting configuration
Set privately in Render Environment:
SMS_PROVIDER=textbee
SMS_REGIONS=91
TEXTBEE_API_KEY=<your private TextBee API key>
TEXTBEE_DEVICE_ID=<your linked phone's device ID>
TEXTBEE_SIM_SUBSCRIPTION_ID=<optional current SIM subscription ID>

Do not put these credentials in GitHub, the APK, screenshots or chat.
Save and deploy the backend after setting them.

## Phone setup
Install the gateway, register/link it to your TextBee account, and enable sending.
Allow SMS permission and required background operation. On Android 15+ check restricted
settings if permission is blocked. Choose the intended SIM and keep the phone online.
The TextBee account email must be verified.

## Pilot allowance
Hosted Free: one device, 50 messages/day, 300/month. Sent and received messages both count.
Check your dashboard for remaining quota and reset time.
This is real SMS testing, not simulated delivery.
Carrier SMS charges/allowance and restrictions still apply.
The sender is your SIM number. "SH Sports" is in the message text, not a masked sender ID.

## Behaviour
POST /api/otp/send creates the existing six-digit, five-minute OTP and submits one message.
On provider acknowledgement, the API returns deliveryStatus=queued and smsBatchId.
Queued is not sent/delivered. Use TextBee delivery history to confirm phone/carrier status.
Quota returns 429. Missing configuration returns 503.
Rejected/failed requests invalidate that pending OTP and link.
The adapter does not automatically retry an uncertain send, avoiding accidental duplicates.
Start with one request to a number you control, then verify the received OTP.

## Status
Source implementation and mocked/local tests complete.
API key/device setup and real phone delivery remain unverified.
No bulk campaign and no real SMS were sent during development.

References:
https://textbee.dev/docs/faq
https://textbee.dev/docs/sending-sms/sending-sms

## 50-user burst handling
50 concurrent OTP requests for distinct numbers are supported behind one shared IP.
SMS_OTP_IP_HOURLY_LIMIT defaults to 100 (configurable 50–1000). Per-number limits remain active.
Each OTP uses its own request; a 50-recipient bulk-batch entitlement is not assumed.
Provider quotas/API limits and device/carrier pacing still govern sending.
Mocked test: 50 queued requests, 50 codes verified, immediate repeat blocked. Zero real SMS.
