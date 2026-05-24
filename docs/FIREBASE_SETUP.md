# Firebase Setup & Configuration Guide

ZeroPay uses Firebase for:
1. **Realtime Database (RTDB)**: Dual customer-merchant wallet state synchronization, real-time receipt generation, and chat messaging.
2. **Firebase Cloud Messaging (FCM)**: Push notifications dispatched by background workers when payments are incoming or settled.

---

## 🗄️ 1. Realtime Database Security Rules

To secure transaction payloads in production, you must restrict database writes to the authenticated admin SDK, while allowing authorized reads to the customer/merchant clients.

Go to your Firebase console → **Realtime Database** → **Rules**, and deploy the following schema rules:

```json
{
  "rules": {
    "chats": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "invoices": {
      "$invoiceId": {
        ".read": "true",
        ".write": "auth != null"
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

---

## 🔑 2. Generating Admin SDK Service Credentials

The backend application requires administrative access to sign JWT tokens, write invoice status changes, and send push notifications.

1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Click the gear icon next to **Project Overview** and select **Project Settings**.
3. Navigate to the **Service accounts** tab.
4. Click **Generate new private key** to download the JSON credentials.
5. In your production `.env` configuration file, extract the values:
   - `FIREBASE_PROJECT_ID` (maps to `project_id`)
   - `FIREBASE_CLIENT_EMAIL` (maps to `client_email`)
   - `FIREBASE_PRIVATE_KEY` (maps to `private_key`, preserving newline `\n` characters)
   - `FIREBASE_DATABASE_URL` (under the Admin SDK configuration snippet)

---

## 🔔 3. Web Push Notifications (FCM) Configuration

To support desktop and mobile browser push notifications:
1. Under **Project Settings** → **Cloud Messaging** tab.
2. Scroll to the **Web configuration** section.
3. Click **Generate key pair** to generate your public VAPID key.
4. Use this VAPID key in the frontend PWA service worker configurations to prompt customers and merchants for notification authorization permissions.
