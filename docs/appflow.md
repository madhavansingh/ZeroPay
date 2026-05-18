# ZeroPay — App Flow Document

### Version 1.0 · Team Null Void · Cardano Hackathon Asia IBW 2025 → Production
### Document Owner: Madhavan Singh Parihar
### Depends On: PRD v1.0 · TRD v1.0 · UI/UX v1.0
### Status: Living Document — Updated as Flows Evolve

---

## Table of Contents

1. [Document Purpose & How to Read](#1-document-purpose--how-to-read)
2. [App Navigation Architecture](#2-app-navigation-architecture)
3. [Screen Inventory & Route Map](#3-screen-inventory--route-map)
4. [Flow 01 — First Launch & Sign Up (Customer)](#4-flow-01--first-launch--sign-up-customer)
5. [Flow 02 — First Launch & Sign Up (Merchant)](#5-flow-02--first-launch--sign-up-merchant)
6. [Flow 03 — Returning User Sign In](#6-flow-03--returning-user-sign-in)
7. [Flow 04 — Merchant Onboarding (Post Sign-Up)](#7-flow-04--merchant-onboarding-post-sign-up)
8. [Flow 05 — Wallet Connection](#8-flow-05--wallet-connection)
9. [Flow 06 — Customer Scans QR & Opens Chat](#9-flow-06--customer-scans-qr--opens-chat)
10. [Flow 07 — Merchant Creates Payment Request in Chat](#10-flow-07--merchant-creates-payment-request-in-chat)
11. [Flow 08 — Customer Pays from Chat](#11-flow-08--customer-pays-from-chat)
12. [Flow 09 — Payment Confirmation Pipeline (Background)](#12-flow-09--payment-confirmation-pipeline-background)
13. [Flow 10 — Counter Checkout (Merchant)](#13-flow-10--counter-checkout-merchant)
14. [Flow 11 — Invoice Expiry](#14-flow-11--invoice-expiry)
15. [Flow 12 — Transaction Failed Recovery](#15-flow-12--transaction-failed-recovery)
16. [Flow 13 — Receipt Generation & Viewing](#16-flow-13--receipt-generation--viewing)
17. [Flow 14 — Push Notification Tap-to-Screen](#17-flow-14--push-notification-tap-to-screen)
18. [Flow 15 — Merchant Dashboard Drill-Down](#18-flow-15--merchant-dashboard-drill-down)
19. [Flow 16 — Merchant QR Download & Share](#19-flow-16--merchant-qr-download--share)
20. [Flow 17 — Settings & Account Management](#20-flow-17--settings--account-management)
21. [Flow 18 — Wallet Disconnect & Reconnect](#21-flow-18--wallet-disconnect--reconnect)
22. [Flow 19 — Customer Refund After Expiry (Smart Contract)](#22-flow-19--customer-refund-after-expiry-smart-contract)
23. [Flow 20 — New User Receives Notification Before Onboarding](#23-flow-20--new-user-receives-notification-before-onboarding)
24. [Cross-Flow State Dependencies](#24-cross-flow-state-dependencies)
25. [Background Process Flow Map](#25-background-process-flow-map)
26. [Data Flow: Frontend → Backend → Blockchain](#26-data-flow-frontend--backend--blockchain)
27. [Data Flow: Blockchain → Backend → Frontend](#27-data-flow-blockchain--backend--frontend)
28. [Real-Time Update Flow (Firebase)](#28-real-time-update-flow-firebase)
29. [Error Recovery Flow Catalogue](#29-error-recovery-flow-catalogue)
30. [Flow Edge Cases & Corner Case Handling](#30-flow-edge-cases--corner-case-handling)

---

## 1. Document Purpose & How to Read

### What This Document Is

The App Flow Document is the authoritative reference for how every user journey, background process, and system interaction moves through ZeroPay. Where the PRD defines what the product does and the TRD defines how it is built, the App Flow Document answers a third question: what exactly happens, in what order, triggered by what, and ending where?

Every flow in this document traces a complete path from a trigger (a user action, a system event, a push notification, a scheduled job) through every screen, API call, database write, Firebase update, and background process that results — until the flow reaches a resting state. No step is hand-waved. No transition is assumed.

This document is used by: engineers to understand what must be implemented before a feature is complete, testers to build test cases that cover every branch of a flow, designers to identify gaps or contradictions between screens, and product owners to verify that every user story has a complete, end-to-end flow.

### How to Read the Flow Diagrams

Each flow is written in two formats: a prose description explaining the logic and rationale, and a step-by-step structured flow written with consistent notation. The notation conventions are:

**[SCREEN: Name]** — The user is on this screen. The screen name matches the screen names defined in the UI/UX document.

**[ACTION: Description]** — The user performs this action (tap, swipe, type, scan).

**[SYSTEM: Description]** — The system performs this operation automatically (API call, database write, Firebase update, job enqueue). No user action required.

**[DECISION: Condition]** — A branch point. The flow splits based on a condition. Branches are labeled YES and NO, with each branch continuing below.

**[WAIT: Condition]** — The flow pauses until an event occurs. The user can interact with other parts of the app during a wait unless marked as blocking.

**[END: Outcome]** — The flow reaches a terminal state. Outcome is described.

**[GOTO: Flow Name, Step N]** — The flow continues at a named step in another (or the same) flow. Used to avoid repeating common sub-flows.

### Reading Parallel Flows

Some flows describe simultaneous activity on two devices — the merchant's device and the customer's device. When this happens, the flow is written in two parallel columns: left for the merchant's perspective, right for the customer's perspective. Steps that happen simultaneously are shown at the same vertical position. Steps where one party waits while the other acts are shown with a [WAIT] marker on the waiting party's column.

---

## 2. App Navigation Architecture

### Navigation Model Overview

ZeroPay uses a hybrid navigation architecture. The outer shell uses a tab-based navigation that persists across the user's session. Inside each tab, a stack navigator handles forward/backward navigation within that section. Modal screens (sheets, pickers, confirmation dialogs) layer on top of the entire navigation stack and are dismissed by a back gesture, a close button, or completing the modal's action.

### Tab Structure — Customer Role

When the user's role is `customer` (or `both`), three tabs are shown:

**Tab 1 — Chats (default tab on login):** The chat room list. All conversations between this customer and any merchant they have connected with. The primary entry point for initiating and tracking payments.

**Tab 2 — Scan:** Opens the QR scanner directly. A shortcut to the most common customer action: scan a new merchant's QR code. After a successful scan, navigates to the appropriate chat room and then switches back to Tab 1.

**Tab 3 — Profile:** Account settings, wallet connection status, notification preferences, and sign-out.

### Tab Structure — Merchant Role

When the user's role is `merchant` (or `both`), three tabs are shown:

**Tab 1 — Dashboard (default tab on login):** The merchant's revenue overview, 7-day chart, and transaction history. The primary financial view.

**Tab 2 — Messages:** The chat room list from the merchant's perspective — incoming payment requests from customers. Functionally identical to the customer's Chats tab but with merchant-appropriate context.

**Tab 3 — Profile:** Account settings, wallet connection status, merchant profile configuration, QR code access, and sign-out.

A floating action button (FAB) is present on the Dashboard tab only: the "Counter Checkout" button. It is a persistent pill-shaped button docked at the bottom-right of the screen, above the tab bar.

### Stack Navigation Within Each Tab

Each tab maintains its own navigation stack. When the user taps a chat room in Tab 1 (Chats), the Chat Room screen is pushed onto Tab 1's stack. When the user taps the back button, they return to the chat list within Tab 1, and Tab 2 and Tab 3 remain undisturbed. This is standard iOS and Android navigation behavior.

Navigating between tabs does not reset the stack of the tab being navigated away from. If the user is deep in a chat room (Tab 1), switches to Tab 3 (Profile) to check something, and switches back to Tab 1, they return to the chat room — not the chat list.

### Modal Screens

Modal screens sit outside the tab navigation and layer on top of everything. The following screens are modals:

Invoice creation sheet (invoked from the chat input bar). Wallet connection sheet (invoked from profile or during onboarding). Payment approval screen (invoked when customer taps "Pay Now"). QR scanner (invoked from Tab 2 or FAB). Merchant onboarding flow (invoked after first sign-up if user selects merchant role). Transaction detail expanded view (invoked from dashboard table row). Receipt viewer (invoked from receipt link in chat or dashboard).

Modals are dismissed by: completing their action, tapping a close button, or swiping down (on mobile, for bottom sheets).

### Deep Link Routes

The app supports deep linking for push notification taps and QR scan resolution. Every major screen has a deep link route:

`zeropay://chat/{roomId}` — Opens the chat room for the given room ID.

`zeropay://invoice/{invoiceId}` — Opens the invoice detail. If the invoice is in an active chat room, opens the chat room and scrolls to the invoice card.

`zeropay://pay?m={merchantId}` — Resolves the merchant by merchantId, then navigates to the existing chat room with that merchant or creates a new one.

`zeropay://receipt/{invoiceId}` — Opens the receipt viewer for the given invoice.

`zeropay://dashboard` — Opens the merchant dashboard (Tab 1 for merchants).

---

## 3. Screen Inventory & Route Map

### Complete Screen List

The following is the canonical list of every screen in the application. Screen names are used consistently across this document, the UI/UX document, and the codebase.

**Authentication Group:**
- Splash — `/` (entry point, redirects based on auth state)
- Auth Entry — `/auth` (sign in / sign up selector)
- Phone Auth — `/auth/phone`
- OTP Verify — `/auth/otp`
- Email Auth — `/auth/email`

**Onboarding Group (shown only during first merchant setup):**
- Role Select — `/onboarding/role`
- Shop Details — `/onboarding/shop`
- Wallet Connect (onboarding) — `/onboarding/wallet`
- QR Ready — `/onboarding/qr`

**Customer Tab Group:**
- Chat List — `/chats`
- Chat Room — `/chats/{roomId}`
- Payment Approval — `/chats/{roomId}/pay/{invoiceId}`
- Payment Processing — part of Chat Room screen, not a separate route

**Merchant Tab Group:**
- Dashboard — `/dashboard`
- Transaction Detail — `/dashboard/invoice/{invoiceId}`
- Counter Checkout — `/checkout`
- Counter Checkout QR — `/checkout/qr/{invoiceId}`
- Counter Checkout Confirmed — `/checkout/confirmed/{invoiceId}`

**Shared Tab Group:**
- Messages (Merchant) — `/messages` (mirrors `/chats` for merchant context)
- Profile — `/profile`
- Wallet Settings — `/profile/wallet`
- Merchant Settings — `/profile/merchant`
- Notification Settings — `/profile/notifications`

**Modal / Sheet Group (no persistent routes, rendered over current screen):**
- Invoice Creation Sheet
- Wallet Connection Sheet
- QR Scanner
- Receipt Viewer

### Route Decision Logic at App Launch

When the app loads, the Splash screen is shown for a maximum of 1.5 seconds (or until auth state is determined, whichever comes first). After auth state is determined:

If no authenticated user → navigate to Auth Entry.

If authenticated user with `customer` role and no incomplete onboarding → navigate to Chat List (Tab 1).

If authenticated user with `merchant` or `both` role and no incomplete onboarding → navigate to Dashboard (Tab 1).

If authenticated user with incomplete onboarding (merchant onboarding started but not finished) → navigate to the appropriate onboarding step (Role Select, Shop Details, Wallet Connect, or QR Ready, depending on the last completed step stored in MongoDB).

---

## 4. Flow 01 — First Launch & Sign Up (Customer)

### Trigger
User opens ZeroPay for the first time. No existing account. Intends to use as a customer.

### Pre-conditions
No Firebase Auth session exists on the device.

### Flow Steps

**[SCREEN: Splash]**
App loads. Firebase Auth state listener fires. No user detected.
**[SYSTEM: Auth state = unauthenticated]**
After 1.5 seconds maximum.
**[SYSTEM: Navigate to Auth Entry]**

---

**[SCREEN: Auth Entry]**
User sees "Get started" (primary) and "Sign in" (ghost) buttons.
**[ACTION: Tap "Get started"]**
**[SYSTEM: Navigate to Phone Auth]**

---

**[SCREEN: Phone Auth]**
User sees phone number input with +91 country prefix.
**[ACTION: Type phone number, e.g. 9876543210]**
**[ACTION: Tap "Continue"]**
**[SYSTEM: Validate phone number format (10 digits, valid Indian number)]**

**[DECISION: Phone number valid?]**

NO → Inline error below input: "Enter a valid 10-digit mobile number." Flow stays on Phone Auth. User corrects and retries.

YES → **[SYSTEM: Firebase Auth — send OTP to phone number]**
**[SYSTEM: Navigate to OTP Verify]**

---

**[SCREEN: OTP Verify]**
User sees: "We sent a code to +91 ••••••3210." Six individual OTP input boxes.
**[ACTION: Type OTP digits one by one]**
OTP boxes auto-advance on each digit. After the sixth digit is entered:
**[SYSTEM: Auto-submit OTP to Firebase Auth]**
**[SYSTEM: Firebase verifies OTP]**

**[DECISION: OTP correct?]**

NO → All six boxes shake (error animation). Error toast: "Incorrect code. Try again." Boxes clear. User retries. After 3 failed attempts: "Too many attempts. Request a new code." Resend link becomes active.

YES → **[SYSTEM: Firebase creates new Auth account]**
**[SYSTEM: Firebase ID token issued]**
**[SYSTEM: Backend: POST /api/v1/users/register called automatically]**
**[SYSTEM: MongoDB: User document created — role: "customer", firebaseUid set]**
**[SYSTEM: Navigate to Role Select (onboarding)]**

---

**[SCREEN: Role Select]**
User sees two large cards: "I'm a customer — pay with ADA" and "I'm a merchant — accept ADA payments."
**[ACTION: Tap "I'm a customer — pay with ADA"]**
**[SYSTEM: Backend: PATCH /api/v1/users/role — role remains "customer"]**
**[SYSTEM: Navigate to Chat List]**

---

**[SCREEN: Chat List]**
Empty state: illustration, "No conversations yet," "Scan a merchant QR to start," QR scan button.
**[END: Customer sign-up complete. User is on home screen.]**

### Post-conditions
- Firebase Auth account exists.
- MongoDB User document exists with role `customer`.
- User is on the Chat List screen.

### Failure Modes
- Firebase OTP send fails (network issue): Error toast "Couldn't send code. Check your connection." Retry button on Phone Auth screen.
- Firebase OTP verification times out: OTP expires after 10 minutes. After expiry, boxes are disabled and a "Code expired. Request a new one." message appears with a resend link.
- Backend `/register` call fails: Retried automatically up to 3 times. If all fail, a non-blocking banner appears: "Account created but profile sync failed. We'll retry shortly." The user proceeds to the app; the register call is retried on next app open.

---

## 5. Flow 02 — First Launch & Sign Up (Merchant)

### Trigger
User opens ZeroPay for the first time. No existing account. Intends to use as a merchant.

### Flow Steps

Steps 1 through Role Select are identical to Flow 01. Diverges at Role Select:

**[SCREEN: Role Select]**
**[ACTION: Tap "I'm a merchant — accept ADA payments"]**
**[SYSTEM: Backend: PATCH /api/v1/users/role — role set to "merchant"]**
**[SYSTEM: Navigate to Shop Details (onboarding Step 1 of 3)]**

**[GOTO: Flow 04 — Merchant Onboarding, Step 1]**

---

## 6. Flow 03 — Returning User Sign In

### Trigger
User opens the app. Previously had an account. Firebase session is expired or device was cleared.

### Flow Steps

**[SCREEN: Splash]**
**[SYSTEM: Firebase Auth state listener fires — no active session]**
**[SYSTEM: Navigate to Auth Entry]**

---

**[SCREEN: Auth Entry]**
**[ACTION: Tap "Sign in" (ghost button)]**
**[SYSTEM: Navigate to Phone Auth (or Email Auth if user taps "Use email instead" tab)]**

---

**[SCREEN: Phone Auth]**
**[ACTION: Type registered phone number]**
**[ACTION: Tap "Continue"]**
**[SYSTEM: Firebase sends OTP]**
**[SYSTEM: Navigate to OTP Verify]**

---

**[SCREEN: OTP Verify]**
**[ACTION: Enter OTP]**
**[SYSTEM: Firebase verifies OTP — existing account found]**
**[SYSTEM: Firebase ID token issued]**
**[SYSTEM: Backend: GET /api/v1/users/me called — existing MongoDB User document found]**
**[SYSTEM: MongoDB: User.lastSeen updated]**

**[DECISION: Does user have incomplete onboarding?]**

YES (incomplete merchant onboarding) → **[SYSTEM: Navigate to the last incomplete onboarding step]**
**[GOTO: Flow 04 — Merchant Onboarding, at the appropriate step]**

NO (onboarding complete or user is customer with no onboarding) →

**[DECISION: User role?]**

`customer` → **[SYSTEM: Navigate to Chat List]**
`merchant` or `both` → **[SYSTEM: Navigate to Dashboard]**

---

**[END: User is signed in and on their home screen.]**

### Silent Token Refresh (Background Sub-Flow)

Firebase ID tokens expire after 1 hour. The Firebase Web SDK handles token refresh automatically in the background using the refresh token (which does not expire unless explicitly revoked). This is entirely silent — no user action, no screen change. The refreshed token is used automatically on the next API call. If the refresh fails (network error), the next API call returns 401, which triggers the app to prompt the user to sign in again via a sign-in modal overlay.

---

## 7. Flow 04 — Merchant Onboarding (Post Sign-Up)

### Trigger
User has selected the merchant role (from Flow 02) or is returning to incomplete onboarding (from Flow 03).

### Pre-conditions
User document exists in MongoDB with role `merchant`. Onboarding completion step is stored on the User document.

### Step 1 of 3 — Shop Details

**[SCREEN: Shop Details (Onboarding Step 1)]**
Progress indicator shows "1 of 3." Fields: Shop Name (text input), Category (horizontal chip selector).
**[ACTION: Type shop name, e.g. "Madhavan's Chai Corner"]**
**[ACTION: Tap a category chip, e.g. "Food"]**
**[ACTION: Tap "Continue"]**
**[SYSTEM: Validate — shop name not empty, max 50 chars, category selected]**

**[DECISION: Validation passes?]**

NO → Inline errors on invalid fields. Flow stays on Shop Details.

YES → **[SYSTEM: Backend: POST /api/v1/merchants/create with shopName and category]**
**[SYSTEM: MongoDB: Merchant document created, merchantId generated (e.g. "MC-0042")]**
**[SYSTEM: MongoDB: User.onboardingStep set to "shop_complete"]**
**[SYSTEM: Navigate to Wallet Connect (Onboarding Step 2)]**

---

### Step 2 of 3 — Wallet Connection

**[SCREEN: Wallet Connect (Onboarding)]**
Progress indicator shows "2 of 3." Explanation: "Connect your Cardano wallet to receive payments." Below: list of detected CIP-30 wallet extensions.

**[DECISION: Any wallet extensions detected?]**

NO → "No Cardano wallet found on this browser." Wallet installation guidance shown (links to Eternl, Lace). A "Refresh" button re-runs wallet detection. Flow waits.

YES → List of wallet names and logos displayed.

**[ACTION: Tap a wallet (e.g. "Eternl")]**
**[SYSTEM: BrowserWallet.enable("eternl") called]**
Wallet extension opens its permission dialog.

**[WAIT: User responds to wallet permission dialog]**

**[DECISION: User approved wallet connection?]**

NO (user rejected) → "Wallet connection cancelled." The wallet list is shown again for retry. A "Skip for now" ghost link is shown (allowing progression but the merchant cannot receive payments until wallet is connected — a banner will remind them).

YES → **[SYSTEM: wallet.getUsedAddresses() called — returns array of enterprise addresses]**
**[SYSTEM: wallet.getRewardAddresses() called — returns stake address]**
**[SYSTEM: Address selected: first used address, or change address if no history]**
**[SYSTEM: Backend: POST /api/v1/merchants/wallet with walletAddress and stakeAddress]**
**[SYSTEM: MongoDB: Merchant.paymentAddress and Merchant.stakeAddress updated]**
**[SYSTEM: MongoDB: User.onboardingStep set to "wallet_complete"]**
**[SYSTEM: walletName stored in localStorage as "zeropay_wallet"]**
**[SYSTEM: Navigate to QR Ready (Onboarding Step 3)]**

---

### Step 3 of 3 — QR Code Ready

**[SCREEN: QR Ready (Onboarding)]**
Progress indicator shows "3 of 3." A celebration state: "You're ready to accept ADA!" The QR code is displayed (generated client-side using react-qr-code, encoding "zeropay://pay?m=MC-0042").

**[ACTION: Tap "Download QR"]**
**[SYSTEM: QR SVG rendered to PNG at print resolution]**
**[SYSTEM: Browser file download triggered (filename: "zeropay-MC-0042.png")]**

OR

**[ACTION: Tap "Share QR"]**
**[SYSTEM: Native Web Share API invoked (mobile) or download link shown (desktop)]**

OR (user skips download)

**[ACTION: Tap "Go to my dashboard"]**
**[SYSTEM: MongoDB: User.onboardingStep set to "complete"]**
**[SYSTEM: Navigate to Dashboard]**

**[END: Merchant onboarding complete. Merchant is on Dashboard with fully configured account.]**

### Onboarding Resume Logic

If the user closes the app at any point during onboarding and returns:

Closed after Role Select but before Shop Details → Resumes at Shop Details (Step 1).
Closed after Shop Details but before Wallet Connect → Resumes at Wallet Connect (Step 2). Shop name is already saved.
Closed after Wallet Connect but before QR Ready → Resumes at QR Ready (Step 3).
Completed QR Ready but navigated away before downloading → QR is always accessible from Profile → Merchant Settings. No data loss.

---

## 8. Flow 05 — Wallet Connection

### Trigger
User (merchant or customer) initiates wallet connection from Profile → Wallet Settings, or when the wallet is required for a payment action and none is connected.

### Context A — Initiated from Settings

**[SCREEN: Wallet Settings]**
User sees current wallet status: "No wallet connected" or the current address if one is connected.
**[ACTION: Tap "Connect wallet"]**
**[SYSTEM: Wallet Connection Sheet opens as a modal]**

**[GOTO: Wallet Connection Sheet Flow below]**

### Context B — Initiated Mid-Flow (Customer Tries to Pay Without Wallet)

Customer taps "Pay Now" on a payment request card.
**[SYSTEM: App checks WalletContext — no wallet connected]**
**[SYSTEM: Wallet Connection Sheet opens as a modal over the Chat Room screen]**
**[SYSTEM: After successful connection, sheet closes and payment flow resumes at payment approval]**

### Wallet Connection Sheet Flow

**[SHEET: Wallet Connection]**
Displays list of detected CIP-30 wallet extensions, each with logo, name, "Connect" button.
If no wallets detected: installation guidance shown.

**[ACTION: Tap "Connect" on a specific wallet]**
**[SYSTEM: BrowserWallet.enable(walletName) called]**
**[SYSTEM: Button shows spinner, "Connecting..."]**

**[WAIT: Wallet extension permission dialog resolved by user]**

**[DECISION: Permission granted?]**

NO → Button returns to "Connect" state. Toast: "Connection cancelled." Sheet stays open for retry.

YES → **[SYSTEM: wallet.getUsedAddresses() and wallet.getRewardAddresses() called]**
**[SYSTEM: Backend: POST /api/v1/users/wallet with walletAddress and stakeAddress]**

**[DECISION: User is a merchant?]**

YES → **[SYSTEM: Backend: POST /api/v1/merchants/wallet with walletAddress and stakeAddress]**
**[SYSTEM: MongoDB: Merchant.paymentAddress updated]**

NO → Only the User document is updated.

**[SYSTEM: walletName stored in localStorage as "zeropay_wallet"]**
**[SYSTEM: WalletContext updated with wallet instance and address]**
**[SYSTEM: Sheet shows success state: green checkmark, wallet name, address (truncated)]**

After 1.5 seconds (or user taps "Done"):
**[SYSTEM: Sheet dismisses with slide-down animation]**
**[SYSTEM: Return to the screen that triggered wallet connection]**

**[END: Wallet connected. User continues their previous task.]**

---

## 9. Flow 06 — Customer Scans QR & Opens Chat

### Trigger
Customer wants to pay a merchant. They scan the merchant's static QR code using the ZeroPay app.

### Pre-conditions
Customer is signed in. Customer is on Chat List (Tab 1) or the Scan tab (Tab 2).

### Flow Steps

**[ACTION: Tap the QR scan FAB or navigate to Scan tab]**
**[SYSTEM: Camera permission check]**

**[DECISION: Camera permission granted?]**

NO (first time asking) → OS permission dialog appears.

  **[DECISION: User grants permission?]**

  NO → "Camera access is needed to scan QR codes. Enable it in your device settings." A "Open Settings" button is shown. Flow ends until permission is granted.

  YES → **[SYSTEM: Camera opens]**

YES (already granted) → **[SYSTEM: Camera opens immediately]**

---

**[SCREEN: QR Scanner]**
Full-screen camera view with scan zone overlay. Scanning beam animation.
**[ACTION: Point camera at merchant's ZeroPay QR code]**
**[SYSTEM: QR code decoded — value: "zeropay://pay?m=MC-0042"]**
**[SYSTEM: Validate URI scheme — must be "zeropay://pay"]**

**[DECISION: Valid ZeroPay URI?]**

NO → Toast: "This QR code is not from ZeroPay." Scanner stays open. User rescans.

YES → **[SYSTEM: Extract merchantId from URI — "MC-0042"]**
**[SYSTEM: Haptic feedback on device]**
**[SYSTEM: Scanner closes]**
**[SYSTEM: Backend: GET /api/v1/merchants/MC-0042 called]**

**[DECISION: Merchant found?]**

NO → Toast: "Merchant not found. This QR code may be outdated." Navigate back to Chat List.

YES → **[SYSTEM: Merchant profile loaded (shopName, category, paymentAddress)]**
**[SYSTEM: Generate deterministic roomId: SHA-256(customerId + merchantId)]**
**[SYSTEM: Backend: POST /api/v1/chat/room with merchantId and customerId]**

**[DECISION: Chat room already exists?]**

YES → **[SYSTEM: Existing room returned from backend]**

NO → **[SYSTEM: New chat room created in Firebase at /chatrooms/{roomId}]**
**[SYSTEM: MongoDB: ChatRoom record created (if tracking rooms in MongoDB)]**

**[SYSTEM: Navigate to Chat Room — /chats/{roomId}]**

---

**[SCREEN: Chat Room]**
If new room: empty message list. Header shows merchant shop name and avatar.
If returning: previous messages visible.

**[END: Customer is in the chat room with the merchant. Ready to receive a payment request or send a text message.]**

### Simultaneous Merchant Notification

When a new chat room is created (the first time a specific customer scans a specific merchant's QR), the merchant receives a push notification: "[Customer Name] started a conversation." This is sent by the backend when the chat room is created. If the merchant is online with the chat open, a system message appears in the (previously empty) room: "[Customer Name] joined."

---

## 10. Flow 07 — Merchant Creates Payment Request in Chat

### Trigger
Merchant is in a chat room with a customer and wants to request payment.

### Pre-conditions
Merchant is signed in. Merchant has a connected wallet (paymentAddress exists on Merchant document). The chat room exists.

### Flow Steps

**[SCREEN: Chat Room (Merchant View)]**
**[ACTION: Tap the ₹ button in the chat input bar]**
**[SYSTEM: Invoice Creation Sheet opens (bottom sheet on mobile, centered modal on desktop)]**

---

**[SHEET: Invoice Creation]**
Amount display shows "₹0.00". Keypad visible. ADA equivalent shows "—" until amount is entered.

**[ACTION: Tap keypad digits to enter amount — e.g. 1, 5, 0 → ₹150]**
**[SYSTEM: ADA equivalent updates live after each digit]**
**[SYSTEM: Backend: GET /api/v1/price/ada-inr called (or served from cache)]**
**[SYSTEM: ADA equivalent = ₹150 / 46.29 = 3.24 ADA — shown below amount]**

**[ACTION: Tap the "Description" field (optional)]**
**[ACTION: Type "2x Masala Chai"]**

**[ACTION: Tap "Send Request"]**
**[SYSTEM: Validate — amount ≥ minimum (currently ~₹47 at the locked rate)]**

**[DECISION: Validation passes?]**

NO → Error shown below amount: "Minimum is ₹47 at current ADA rate." Send button remains disabled.

YES → **[SYSTEM: Backend: POST /api/v1/invoices/create]**
Request body: `{ amountPaise: 15000, description: "2x Masala Chai", chatRoomId: "room_abc123" }`
**[SYSTEM: Backend fetches locked ADA/INR rate from Redis cache]**
**[SYSTEM: Backend calculates lovelaceAmount = 3,240,000 lovelace]**
**[SYSTEM: MongoDB: Invoice document created — invoiceId: "INV-20250518-X7K2M1", status: "pending", expiresAt: now + 600s]**
**[SYSTEM: Firebase Admin SDK: writes payment_request message to /chatrooms/room_abc123/messages]**
**[SYSTEM: Invoice Creation Sheet closes]**

---

**[SCREEN: Chat Room (Merchant View)]**
The payment request card appears as a sent message in the chat (right-aligned from the merchant's view).
Card shows: "Payment Request" label, "₹150.00", "3.24 ADA", "2x Masala Chai", expiry timer counting down.

Simultaneously on the customer's device:
**[SYSTEM: Firebase push: customer's chat list listener fires — new message in room_abc123]**
**[SYSTEM: Firebase push: customer's /chatrooms/room_abc123/messages listener fires]**
**[SYSTEM: Customer's chat room (if open) shows the payment request card]**
**[SYSTEM: FCM push notification sent to customer: "Meena's Chai Corner: Payment request for ₹150"]**

**[END: Payment request is in the chat. Merchant waits for customer to pay.]**

---

## 11. Flow 08 — Customer Pays from Chat

### Trigger
Customer sees a payment request card in the chat and decides to pay.

### Pre-conditions
Customer is signed in. Invoice status is `pending`. Invoice has not expired. Customer has a Cardano wallet connected (or connects one during this flow).

### Flow Steps

**[SCREEN: Chat Room (Customer View)]**
Payment request card visible with "Pay Now" button and expiry timer.
**[ACTION: Tap "Pay Now"]**

**[SYSTEM: Check WalletContext — is a wallet connected?]**

**[DECISION: Wallet connected?]**

NO → **[GOTO: Flow 05 — Wallet Connection, Context B]**
After connection: return here.

YES → **[SYSTEM: Backend: GET /api/v1/invoices/{invoiceId} — verify invoice is still pending and not expired]**

**[DECISION: Invoice still valid (pending, not expired)?]**

NO (expired since the button was visible) → Payment request card updates to expired state. Toast: "This payment request has expired. Ask the merchant for a new one." Flow ends.

YES → **[SYSTEM: Navigate to Payment Approval screen — /chats/{roomId}/pay/{invoiceId}]**

---

**[SCREEN: Payment Approval]**
Shows:
- Merchant shop name and avatar
- Price display: "₹150.00 → 3.24 ADA"
- Rate locked notice: "Rate: ₹46.29 per ADA · locked at 10:00 AM"
- Description: "2x Masala Chai"
- "Pay with Eternl" primary button (wallet name from WalletContext)
- "Cancel" ghost button

**[DECISION: Has the rate moved more than 2% since invoice creation?]**

YES → Amber informational banner: "The ADA amount was locked when this request was created. The market rate has moved. You'll pay exactly 3.24 ADA." (Non-blocking — user still proceeds.)

NO → No banner shown.

**[ACTION: Tap "Pay with Eternl"]**
**[SYSTEM: Button enters loading state — "Opening your wallet..."]**
**[SYSTEM: Backend: POST /api/v1/payments/build-tx with invoiceId]**
**[SYSTEM: Backend: fetch invoice from MongoDB, verify still pending]**
**[SYSTEM: Backend: MeshJS builds unsigned transaction — 3,240,000 lovelace to paymentAddress, metadata key 674 with invoiceId]**
**[SYSTEM: Backend returns unsigned CBOR hex string]**
**[SYSTEM: wallet.signTx(cbor, true) called — Eternl extension opens]**

---

**[WALLET EXTENSION: Eternl approval dialog]**
User sees: recipient address (truncated), amount (3.24 ADA), network fee (~0.17 ADA), total (3.41 ADA).
**[ACTION: Tap "Confirm" in Eternl]**

**[DECISION: User confirmed or cancelled in wallet?]**

CANCELLED → Return to Payment Approval screen. Button re-enabled. Toast: "Payment cancelled."

CONFIRMED → **[SYSTEM: Eternl signs transaction]**
**[SYSTEM: wallet.submitTx(signedCbor) called — Eternl broadcasts to Cardano network]**
**[SYSTEM: Cardano network accepts transaction — txHash returned]**

---

**[SYSTEM: Backend: POST /api/v1/payments/submit with txHash and invoiceId]**
**[SYSTEM: MongoDB: Invoice.status updated to "submitted", Invoice.txHash set]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "submitted"]**
**[SYSTEM: Firebase: new message written to /chatrooms/{roomId}/messages — type: "payment_submitted", txHash: "abc123...xyz789"]**
**[SYSTEM: BullMQ: tx-confirmation job enqueued with 20-second delay]**
**[SYSTEM: FCM: push to merchant — "[Customer Name] sent ₹150 · Processing"]**
**[SYSTEM: Backend returns HTTP 202]**

**[SYSTEM: Payment Approval screen closes — navigate back to Chat Room]**

---

**[SCREEN: Chat Room (Customer View)]**
The payment request card has updated (via Firebase live listener) to show:
- Processing spinner
- "Processing payment..."
- "Tx: abc1...x789" (tappable — opens CardanoScan in new tab)
A system message below: "Payment submitted · 10:05 AM"

**[END (for the customer at this moment): Customer's active role in the payment is complete. They wait for confirmation, which arrives via Firebase push (Flow 09) and push notification (Flow 14).]**

---

## 12. Flow 09 — Payment Confirmation Pipeline (Background)

### Trigger
A `tx-confirmation` BullMQ job becomes active (20 seconds after Flow 08 enqueued it).

### Pre-conditions
Invoice is in `submitted` status. txHash is stored on the Invoice document.

### This flow runs entirely on the backend with no user interaction.

---

**[SYSTEM: BullMQ worker wakes up — job: tx-confirmation, payload: { txHash, invoiceId }]**
**[SYSTEM: Blockfrost client: GET /txs/{txHash} — check if tx exists on-chain]**

**[DECISION: Blockfrost response?]**

5xx or timeout → **[SYSTEM: Koios fallback: GET /tx_info with txHash]**

  **[DECISION: Koios response?]**

  Error → **[SYSTEM: Job throws error — BullMQ schedules retry in 20 seconds]**
  **[GOTO: Wait 20 seconds, retry from Blockfrost check]**

  Success → continue with Koios data

404 (tx not found yet — still in mempool or not yet indexed) → **[SYSTEM: Job throws "not found" error — BullMQ schedules retry in 20 seconds]**
**[GOTO: Wait 20 seconds, retry from Blockfrost check]**

200 (tx found) → **[SYSTEM: Extract block_height from response]**
**[SYSTEM: Blockfrost: GET /blocks/latest — get current chain tip block height]**
**[SYSTEM: Calculate confirmations = tipHeight - txBlockHeight]**

---

**[DECISION: Confirmations ≥ 1 (first time found in a block)?]**

YES (and invoice still in "submitted" status) → **[SYSTEM: MongoDB: Invoice.status updated to "confirming", Invoice.blockHeight set, Invoice.confirmations set]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "confirming"]**

**[DECISION: Confirmations ≥ 3?]**

NO (1 or 2 confirmations) → **[SYSTEM: Job throws "insufficient confirmations" error — BullMQ schedules retry in 60 seconds (adaptive frequency)]**
**[GOTO: Wait 60 seconds, retry from Blockfrost check]**

YES (3+ confirmations) → **[SYSTEM: MongoDB: Invoice.status updated to "confirmed", Invoice.confirmations set, Invoice.confirmedAt set]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "confirmed"]**
**[SYSTEM: BullMQ: receipt-generation job enqueued immediately]**
**[SYSTEM: BullMQ: notification-dispatch job enqueued immediately]**

---

### Receipt Generation Sub-Job

**[SYSTEM: BullMQ receipt-generation worker activates]**
**[SYSTEM: MongoDB: Fetch full Invoice, Merchant, and User (customer) documents]**
**[SYSTEM: Construct receipt JSON object — schema version, merchant info, customer info, payment details, blockchain data]**
**[SYSTEM: Pinata API: POST /pinning/pinJSONToIPFS with receipt JSON]**

**[DECISION: Pinata upload succeeded?]**

NO → **[SYSTEM: Job throws error — BullMQ retries up to 3 times with 30-second backoff]**
After 3 failures: **[SYSTEM: MongoDB: Invoice flagged with receiptPending: true, status set to "settled" without CID]**

YES → **[SYSTEM: Pinata returns IPFS CID]**
**[SYSTEM: MongoDB: Invoice.receiptCid set, Invoice.receiptUrl set]**
**[SYSTEM: MongoDB: Invoice.status updated to "settled", Invoice.settledAt set]**
**[SYSTEM: MongoDB: Merchant.totalReceived incremented by amountLovelace, Merchant.totalOrders incremented by 1]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "settled"]**
**[SYSTEM: Firebase Admin SDK: writes "receipt" message to /chatrooms/{roomId}/messages with IPFS receipt URL]**

---

### Notification Dispatch Sub-Job

**[SYSTEM: BullMQ notification-dispatch worker activates]**
**[SYSTEM: MongoDB: Fetch merchant User.fcmToken and customer User.fcmToken]**

**[SYSTEM: FCM: send to merchant token]**
Notification: "₹150 received · MC-0042"
Data: `{ type: "payment_confirmed", invoiceId, route: "/dashboard/invoice/{invoiceId}" }`

**[SYSTEM: FCM: send to customer token]**
Notification: "Payment confirmed · ₹150 to Meena's Chai Corner"
Data: `{ type: "payment_confirmed", invoiceId, route: "/chats/{roomId}" }`

**[DECISION: Either FCM call returns REGISTRATION_TOKEN_NOT_REGISTERED?]**

YES → **[SYSTEM: MongoDB: User.fcmToken set to null for the user with the stale token]**

**[END: Invoice is settled. Both parties have been notified. Receipt exists on IPFS.]**

### On the Merchant's Device (Simultaneously)

As the Firebase paths update, the merchant's open screens react:

If merchant has Dashboard open → TanStack Query cache for dashboard stats is invalidated → stats refetch → today's total updates with number transition animation.

If merchant has the Chat Room open → payment request card transitions from "Processing" to "Confirmed" (checkmark animation plays).

If merchant has the app in background → push notification delivered and shown in notification shade.

### On the Customer's Device (Simultaneously)

If customer has Chat Room open → payment request card transitions from "Processing" to "Confirmed". Receipt link appears below the confirmed card.

If customer has app in background → push notification delivered.

---

## 13. Flow 10 — Counter Checkout (Merchant)

### Trigger
Merchant is at their counter and wants to accept payment from a walk-in customer who may not have the ZeroPay app — only a standard Cardano wallet.

### Pre-conditions
Merchant is signed in with a connected wallet.

### Flow Steps

**[SCREEN: Dashboard]**
**[ACTION: Tap "Counter Checkout" FAB (pill button, bottom-right of screen)]**
**[SYSTEM: Navigate to Counter Checkout — /checkout]**

---

**[SCREEN: Counter Checkout]**
Full-screen mode. All navigation chrome hidden. Amount display shows "₹0.00". Numeric keypad visible.

**[ACTION: Tap keypad digits — e.g. 7, 5 → ₹75]**
**[SYSTEM: Amount display updates to "₹75.00"]**
**[SYSTEM: ADA equivalent updates live: "≈ 1.62 ADA"]**

**[ACTION: (Optional) Tap "Add description" → small text input slides in → type "Vada Pav"]**

**[ACTION: Tap "Generate Bill" (primary button, now active)]**
**[SYSTEM: Backend: POST /api/v1/invoices/create — chatRoomId: null (walk-in, no chat)]**
**[SYSTEM: MongoDB: Invoice created — status: "pending", no customerId]**
**[SYSTEM: Navigate to Counter Checkout QR — /checkout/qr/{invoiceId}]**

---

**[SCREEN: Counter Checkout QR]**
Full-screen. White background (maximum QR contrast). Large QR code center-screen (encodes Cardano payment URI: address + lovelace + invoiceId in metadata). Amount "₹75.00" shown above QR. "≈ 1.62 ADA" shown below QR. Countdown timer: "Expires in 9:59."

Merchant turns device to show QR to customer.
**[ACTION: Customer opens their Cardano wallet app (Eternl, Nami, etc.) and scans the QR]**
**[SYSTEM: Customer's wallet app parses the Cardano payment URI]**
**[SYSTEM: Customer's wallet pre-fills recipient address and 1,620,000 lovelace]**
**[ACTION: Customer confirms in their wallet]**
**[SYSTEM: Transaction submitted to Cardano network by customer's wallet]**
**[SYSTEM: After ~20 seconds, transaction appears on-chain]**
**[GOTO: Flow 09 — Payment Confirmation Pipeline (Background)]**

**[WAIT: Firebase /invoices/{invoiceId}/status listener — waiting for "confirmed"]**

While waiting: the QR screen shows the countdown timer ticking. The screen pulses very subtly (border breathes in/out) to show it is listening. The merchant can also see the "waiting" state without reading the screen.

**[DECISION: Invoice reaches "confirmed" status?]**

YES → **[SYSTEM: Navigate to Counter Checkout Confirmed — /checkout/confirmed/{invoiceId}]**
**[SCREEN: Counter Checkout Confirmed]**
Full-bleed green screen. White checkmark (drawn animation). "₹75.00 received." "From: Anonymous" (no ZeroPay account associated). After 5 seconds: "New Transaction" button appears.
**[ACTION: Tap "New Transaction"]**
**[SYSTEM: Navigate back to Counter Checkout — /checkout (keypad resets)]**

NO (expiry timer reaches 0 before confirmation) → **[GOTO: Flow 11 — Invoice Expiry]**

**[ACTION: Tap the × button (exit counter checkout without generating a bill)]**
**[SYSTEM: Navigate back to Dashboard]**

**[END: Counter checkout cycle complete. Merchant is ready for the next customer.]**

---

## 14. Flow 11 — Invoice Expiry

### Trigger A — Timer-Driven (Job Queue)
The invoice expiry job (BullMQ, runs every 60 seconds) detects an invoice in `pending` status whose `expiresAt` is in the past.

### Trigger B — User-Initiated
Merchant manually cancels a pending invoice from the chat or the dashboard.

### Flow Steps — Trigger A (Automatic)

**[SYSTEM: BullMQ invoice-expiry worker activates (every 60 seconds)]**
**[SYSTEM: MongoDB: query for all invoices where status="pending" AND expiresAt < now()]**
**[SYSTEM: For each expired invoice:]**

**[SYSTEM: MongoDB: Invoice.status updated to "expired"]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "expired"]**
**[SYSTEM: If invoice has a chatRoomId: Firebase Admin SDK writes "system" message to /chatrooms/{roomId}/messages — "Payment request expired · [timestamp]"]**
**[SYSTEM: BullMQ: notification-dispatch job enqueued for expiry notification]**

**[SYSTEM: FCM: send to merchant token — "₹150 request expired · No payment received"]**
**[SYSTEM: FCM: send to customer token (if customer is registered and linked to this invoice) — "₹150 payment request expired · Contact Meena's Chai Corner to pay"]**

### Effect on Open Screens

On the merchant's chat room (if open): the payment request card transitions to expired state. Red left border. X icon. "Expired" text. Expiry timer replaced with "Expired." Disabled button where "Pay Now" was.

On the customer's chat room (if open): identical expired visual state.

On the counter checkout QR screen (if open): the QR screen replaces itself with a "Bill expired" screen. "This bill has expired. Generate a new one?" with a "New Transaction" primary button.

### Flow Steps — Trigger B (Manual Cancellation)

**[SCREEN: Chat Room (Merchant View) — long-press on payment request card]**
OR
**[SCREEN: Dashboard — tap "Cancel" on a pending invoice in the pending invoices panel]**

**[SYSTEM: Confirmation modal: "Cancel this invoice? [Customer Name] will be notified." — "Cancel Invoice" (red) and "Keep" (ghost) buttons]**
**[ACTION: Tap "Cancel Invoice"]**
**[SYSTEM: Backend: PUT /api/v1/invoices/{invoiceId}/expire]**

Flow continues identically to automatic expiry from the MongoDB update step onwards.

**[END: Invoice is expired. Both parties are aware. No funds have moved.]**

---

## 15. Flow 12 — Transaction Failed Recovery

### Trigger
A `tx-confirmation` BullMQ job has exhausted all 60 retry attempts (~20 minutes) without finding the transaction on-chain.

### Flow Steps

**[SYSTEM: BullMQ job moves to "failed" state]**
**[SYSTEM: BullMQ "failed" event listener fires]**
**[SYSTEM: MongoDB: Invoice.status updated to "failed"]**
**[SYSTEM: Firebase: /invoices/{invoiceId}/status updated to "failed"]**
**[SYSTEM: Firebase Admin SDK: writes system message to chat — "Payment could not be confirmed · [timestamp]"]**
**[SYSTEM: BullMQ: notification-dispatch job enqueued for failure notification]**

**[SYSTEM: FCM: send to merchant — "Payment for ₹150 could not be confirmed. Ask your customer to try again."]**
**[SYSTEM: FCM: send to customer — "Payment could not be confirmed. Your ADA was not deducted. Please try again."]**

### Customer's Recovery Path

**[SCREEN: Chat Room (Customer View)]**
The payment request card transitions to a failed state. Red border. X icon. "Payment could not be confirmed." Below: "Your ADA was not deducted." A "Try again" ghost button appears.
**[ACTION: Tap "Try again"]**
**[SYSTEM: New invoice creation sheet opens, pre-filled with same amount and description as the failed invoice]**
**[ACTION: Tap "Send Request"]**
**[SYSTEM: A new Invoice document is created (new invoiceId, fresh expiry)]**
**[SYSTEM: New payment request card appears in chat below the failed one]**

**[GOTO: Flow 08 — Customer Pays from Chat]**

### Why Transactions Fail

The most common causes of a transaction failing to appear on-chain: the Cardano transaction TTL (time to live) expired before the transaction was included in a block (can happen during network congestion). The transaction fee was calculated incorrectly and the transaction was rejected by the mempool. The Cardano node that received the submission lost the transaction before propagating it to peers. In all cases, the customer's UTXO is never spent — a failed Cardano transaction costs the user nothing.

**[END: User understands no funds were moved and has a path to retry.]**

---

## 16. Flow 13 — Receipt Generation & Viewing

### Trigger
Invoice has reached `settled` status. IPFS receipt has been generated by the receipt-generation BullMQ job.

### Viewing the Receipt — Customer

**[SCREEN: Chat Room (Customer View)]**
After settlement, a new `receipt` message appears below the confirmed payment card.
Message content: "Receipt ready · View receipt →" (the arrow is a tappable link).
**[ACTION: Tap "View receipt →"]**
**[SYSTEM: Open Receipt Viewer modal (or external browser for the Pinata gateway URL)]**

**[SCREEN: Receipt Viewer (or browser tab)]**
Shows a structured receipt document:
- ZeroPay header with receipt ID
- Merchant: Meena's Chai Corner (Food)
- Customer: [Display name]
- Amount: ₹150.00 (3.24 ADA)
- Description: 2x Masala Chai
- Transaction: abc123...xyz789 (tappable to open CardanoScan)
- Block height: 9,847,261
- Confirmed: 3 blocks
- Settled at: 18 May 2025, 10:07 AM
- IPFS: bafybe...xyz (the CID)

**[ACTION: Tap the tx hash]**
**[SYSTEM: Open CardanoScan preprod (or mainnet) in a new browser tab with the tx hash pre-filled]**

**[ACTION: Tap "Download receipt"]**
**[SYSTEM: Browser file download — receipt JSON file saved as "receipt-INV-20250518-X7K2M1.json"]**

### Viewing the Receipt — Merchant

**[SCREEN: Dashboard — Transaction History Table]**
Merchant finds the settled invoice in the table.
**[ACTION: Tap the invoice row to expand it]**
The expanded row shows all technical details including "View receipt →" link.
**[ACTION: Tap "View receipt →"]**
**[SYSTEM: Same Receipt Viewer as above]**

**[END: Receipt is viewed and optionally downloaded or shared.]**

---

## 17. Flow 14 — Push Notification Tap-to-Screen

### Trigger
User receives a ZeroPay push notification while the app is in the background or closed.

### Notification Types and Target Screens

**Type: payment_request (customer)**
Sent when a merchant creates an invoice in their shared chat.
Tap action → Open app → Navigate to /chats/{roomId} → Scroll to the new payment request card.

**Type: payment_submitted (merchant)**
Sent when a customer submits a transaction for the merchant's invoice.
Tap action → Open app → Navigate to /chats/{roomId} → Scroll to the invoice card showing "Processing."

**Type: payment_confirmed (merchant)**
Sent when 3+ block confirmations are reached.
Tap action → Open app → Navigate to /dashboard — the dashboard shows the updated total and the new settled transaction in the history.

**Type: payment_confirmed (customer)**
Sent when the payment is fully settled.
Tap action → Open app → Navigate to /chats/{roomId} → Scroll to the confirmed card and the new receipt message.

**Type: invoice_expired (both)**
Sent when an invoice expires without payment.
Tap action (merchant) → Open app → Navigate to /chats/{roomId} → The expired invoice card is visible.
Tap action (customer) → Open app → Navigate to /chats/{roomId} → The expired invoice card is visible.

**Type: payment_failed (both)**
Sent when a submitted transaction cannot be confirmed.
Tap action (both) → Open app → Navigate to /chats/{roomId} → The failed card is visible.

### Deep Link Resolution Logic

When the app opens from a notification tap, the notification's `data.route` field is read. The app's navigation system resolves this route:

If the user is authenticated and the route is valid → navigate directly to the target screen.

If the user is authenticated but the route's entity (roomId, invoiceId) no longer exists (rare data error) → navigate to the home screen (Dashboard or Chat List) and show a toast: "Couldn't find that payment. It may have been deleted."

If the user is not authenticated (session expired) → navigate to Auth Entry. After sign-in completes, navigate to the originally intended route using the stored pending navigation target.

**[END: User is on the most relevant screen for the notification they received.]**

---

## 18. Flow 15 — Merchant Dashboard Drill-Down

### Trigger
Merchant is on the Dashboard and wants to investigate a specific transaction.

### Flow Steps

**[SCREEN: Dashboard]**
Merchant sees the transaction history table. A specific row shows a "settled" transaction with ₹150.00.
**[ACTION: Tap the row]**
**[SYSTEM: Row expands inline (no navigation) — animation: height increases from 56px to ~200px, content fades in]**

Expanded row shows:
- Full invoice ID (INV-20250518-X7K2M1)
- Customer: [Name or "Anonymous"]
- Tx Hash: abc123...xyz789 in DM Mono (tappable)
- Block height: 9,847,261
- Confirmations at settlement: 3
- Settled at: 18 May 2025, 10:07 AM
- ADA/INR rate used: ₹46.29
- Receipt: "View receipt →" link

**[ACTION: Tap tx hash]**
**[SYSTEM: Open CardanoScan in new browser tab at /transaction/{txHash}]**

**[ACTION: Tap "View receipt →"]**
**[GOTO: Flow 13 — Receipt Viewing]**

**[ACTION: Tap the expanded row again]**
**[SYSTEM: Row collapses back to 56px — animation reverses]**

**[END: Merchant has seen all available detail for this transaction.]**

### Dashboard Filtering Flow

**[ACTION: Tap a status chip above the transaction table (e.g. "Pending")]**
**[SYSTEM: Table filters to show only pending invoices]**
**[SYSTEM: Backend: GET /api/v1/invoices/merchant/list?status=pending called (or client-side filter if data is cached)]**
Pending invoices show with expiry timers and a "Cancel" ghost button on each.

**[ACTION: Tap "All" chip]**
**[SYSTEM: Table shows all invoices — filter cleared]**

---

## 19. Flow 16 — Merchant QR Download & Share

### Trigger
Merchant wants their QR code for printing or sharing.

### Flow Steps

**[SCREEN: Profile → Merchant Settings]**
"My QR Code" section shows a preview of the QR code (medium size, 200px).
Below: "Download" (primary) and "Share" (ghost) buttons.

**[ACTION: Tap "Download"]**
**[SYSTEM: QR SVG rendered to Canvas at 1200×1200px (print resolution, ~300 DPI at 10cm)]**
**[SYSTEM: Canvas converted to PNG Blob]**
**[SYSTEM: File download triggered — filename: "zeropay-{merchantId}-qr.png"]**

**[END (download): PNG file is on the merchant's device, ready to send to a printer or share.]**

---

**[ACTION: Tap "Share"]**
**[DECISION: Web Share API available? (available on mobile browsers, not all desktop browsers)]**

YES → **[SYSTEM: navigator.share() called with the PNG file and title "My ZeroPay QR Code"]**
**[SYSTEM: OS native share sheet appears — WhatsApp, Email, AirDrop, etc.]**
**[ACTION: User selects their sharing method]**

NO (desktop or unsupported browser) → **[SYSTEM: A download link appears instead: "Save this image to share it"]**

**[END (share): QR code shared via preferred channel.]**

### Large Format Print Version

**[ACTION: Tap "Print-ready version" (smaller link below the Download button)]**
**[SYSTEM: A full payment card is rendered in a separate browser tab — 85mm × 55mm business card format at 300 DPI, with shop name, QR code, merchantId, and ZeroPay branding]**
**[ACTION: User uses browser's Ctrl+P / Cmd+P to print the tab]**

---

## 20. Flow 17 — Settings & Account Management

### Trigger
User navigates to the Profile tab.

### Profile Tab Sub-Flows

**Sub-Flow A — Change Display Name**
**[SCREEN: Profile]**
**[ACTION: Tap display name row]**
**[SYSTEM: Inline text edit activates — name field becomes editable]**
**[ACTION: Edit name]**
**[ACTION: Tap "Save" (appears when content changes)]**
**[SYSTEM: Backend: PATCH /api/v1/users/me with displayName]**
**[SYSTEM: MongoDB: User.displayName updated]**
**[SYSTEM: Success toast: "Name updated."]**

**Sub-Flow B — Change Merchant Settings (Merchants Only)**
**[ACTION: Tap "Merchant settings" row]**
**[SCREEN: Merchant Settings]**
Editable fields: Shop Name, Category, Invoice Expiry (slider: 5 min to 30 min).
**[ACTION: Adjust any field]**
**[ACTION: Tap "Save changes"]**
**[SYSTEM: Backend: PUT /api/v1/merchants/settings with updated fields]**
**[SYSTEM: MongoDB: Merchant document updated]**
**[SYSTEM: Success toast: "Settings saved."]**

**Sub-Flow C — Change Notification Preferences**
**[ACTION: Tap "Notifications" row]**
**[SCREEN: Notification Settings]**
Toggle list: "Payment received" (merchant), "Payment confirmed" (both), "Invoice expired" (both).
**[ACTION: Toggle any switch]**
**[SYSTEM: Backend: PATCH /api/v1/users/notifications with updated preferences]**
**[SYSTEM: MongoDB: User.notificationPreferences updated]**
Notification workers check these preferences before sending — if a preference is off, the notification is skipped.

**Sub-Flow D — Sign Out**
**[ACTION: Tap "Sign out" (at bottom of Profile screen)]**
**[SYSTEM: Confirmation modal: "Sign out? You'll need to sign in again." — "Sign out" (red) and "Cancel" (ghost)]**
**[ACTION: Tap "Sign out"]**
**[SYSTEM: Firebase Auth signOut() called]**
**[SYSTEM: localStorage cleared (wallet name, any cached data)]**
**[SYSTEM: WalletContext reset — wallet disconnected]**
**[SYSTEM: All TanStack Query caches cleared]**
**[SYSTEM: Navigate to Auth Entry (Splash → Auth Entry)]**

**[END: User is signed out and on the Auth Entry screen.]**

---

## 21. Flow 18 — Wallet Disconnect & Reconnect

### Trigger A — Manual Disconnect
User navigates to Profile → Wallet Settings and explicitly disconnects their wallet.

### Trigger B — Wallet Extension Uninstalled or Revoked
On next app load, the silent reconnection attempt (from localStorage) fails because the extension is gone.

### Flow Steps — Trigger A (Manual)

**[SCREEN: Profile → Wallet Settings]**
Current wallet address shown (truncated). "Disconnect wallet" ghost button (red text).
**[ACTION: Tap "Disconnect wallet"]**
**[SYSTEM: Confirmation modal: "Disconnect wallet? You won't be able to receive payments until you reconnect." — "Disconnect" (red) and "Keep" (ghost)]**
**[ACTION: Tap "Disconnect"]**
**[SYSTEM: WalletContext reset — wallet set to null]**
**[SYSTEM: localStorage "zeropay_wallet" key removed]**
**[SYSTEM: Backend: PATCH /api/v1/users/wallet with walletAddress: null]**
**[SYSTEM: If merchant: PATCH /api/v1/merchants/wallet with paymentAddress: null]**
**[SYSTEM: Merchant.paymentAddress set to null — new invoices cannot be created until reconnected]**
**[SYSTEM: Wallet Settings screen updates — shows "No wallet connected" and "Connect wallet" button]**
**[SYSTEM: A persistent banner appears on the Dashboard: "Connect your wallet to accept payments →"]**

**[GOTO: Flow 05 — Wallet Connection (when user is ready to reconnect)]**

### Flow Steps — Trigger B (Silent Reconnection Failure)

**[SYSTEM: App loads — Splash screen]**
**[SYSTEM: WalletContext reads "zeropay_wallet" from localStorage — value: "eternl"]**
**[SYSTEM: BrowserWallet.enable("eternl") attempted silently]**

**[DECISION: Silent reconnection successful?]**

YES → WalletContext populated normally. User proceeds to their home screen. No visible interruption.

NO (extension not found, user denied, or extension requires re-approval) → **[SYSTEM: localStorage "zeropay_wallet" cleared]**
**[SYSTEM: WalletContext remains null]**
**[SYSTEM: User proceeds to home screen — no blocking error]**
**[SYSTEM: If merchant: persistent banner on Dashboard: "Your wallet was disconnected. Reconnect to accept payments →"]**
**[SYSTEM: If customer: no banner (wallet is only needed when making a payment — prompt appears at that point)]**

**[END: User is informed of the disconnected state. Reconnection path is clear and non-blocking.]**

---

## 22. Flow 19 — Customer Refund After Expiry (Smart Contract)

### Trigger
A customer submitted a payment to the Aiken escrow contract (not a direct wallet-to-wallet transfer), but the invoice expired before the merchant collected. The customer wants their ADA back.

### Context
This flow only applies when the system uses the Aiken escrow contract (not direct transfer mode). The contract enforces that after the invoice's expiry timestamp, only the customer can spend the locked UTXO.

### Pre-conditions
Invoice status is `expired` or `failed`. Customer had submitted a transaction that locked funds in the contract. The UTXO at the contract address exists (verified by the customer's wallet balance or Blockfrost query).

### Flow Steps

**[SCREEN: Chat Room (Customer View)]**
The payment request card shows the expired/failed state. A new action appears: "Reclaim your ADA" ghost button (only visible if the customer submitted a transaction before expiry).
**[ACTION: Tap "Reclaim your ADA"]**

**[SCREEN: Refund Confirmation]**
Shows: "You can reclaim 3.24 ADA." "The payment window has closed." "Refund to: [wallet address, truncated]." "Reclaim ADA" primary button.
**[ACTION: Tap "Reclaim ADA"]**
**[SYSTEM: Backend: POST /api/v1/payments/build-refund-tx with invoiceId]**
**[SYSTEM: Backend: Find the contract UTXO using Blockfrost — search for UTXO at contract address with matching datum invoiceId]**
**[SYSTEM: Backend: MeshJS builds unsigned refund transaction — spend contract UTXO via Refund redeemer, output to customer's wallet address, validity interval set to after invoice expiresAt]**
**[SYSTEM: Backend returns unsigned refund CBOR]**
**[SYSTEM: wallet.signTx(refundCbor, true) called — wallet extension opens]**

**[ACTION: Customer confirms refund in wallet extension]**
**[SYSTEM: wallet.submitTx(signedRefundCbor) — refund tx broadcast]**
**[SYSTEM: Cardano network processes refund (Aiken contract validates: expiresAt has passed, customer signed)]**
**[SYSTEM: ADA returned to customer's wallet]**
**[SYSTEM: MongoDB: Invoice.refundTxHash set, Invoice.refundedAt set]**
**[SYSTEM: Firebase: system message written to chat — "Refund processed · 3.24 ADA returned to your wallet"]**
**[SYSTEM: FCM: notification to customer — "Refund confirmed · 3.24 ADA returned"]**

**[END: Customer's ADA is returned to their wallet. The invoice is closed.]**

---

## 23. Flow 20 — New User Receives Notification Before Onboarding

### Trigger
A merchant sends a payment request to a customer who has never used ZeroPay. The customer is contacted via an out-of-band channel (WhatsApp, SMS) with a deep link.

### Context
This is an edge case but an important one for merchant growth — a merchant wants to request payment from a customer who is not yet a ZeroPay user. The merchant shares a link like `https://zeropay.app/pay/MC-0042` via WhatsApp.

### Flow Steps

**[ACTION: Customer taps the link in WhatsApp]**
**[SYSTEM: Browser opens — https://zeropay.app/pay/MC-0042]**
**[SYSTEM: App attempts to detect if ZeroPay is installed (via universal links/app links)]**

**[DECISION: ZeroPay app installed?]**

YES → **[SYSTEM: App opens and deep link is resolved]**
**[GOTO: Flow 06 — Customer Scans QR & Opens Chat, from the "Merchant found" step]**

NO → **[SYSTEM: Web app loads in browser]**
**[SCREEN: Splash → Auth Entry]**
**[SYSTEM: The merchant's profile page is shown as context: "Meena's Chai Corner wants to accept payment from you."]**
**[SYSTEM: "Sign up to pay" primary button]**

**[ACTION: Tap "Sign up to pay"]**
**[GOTO: Flow 01 — First Launch & Sign Up (Customer)]**

After sign-up completes, the originally intended merchant context is not lost — the merchant's ID was stored in session state before the sign-up flow began. After sign-up:
**[SYSTEM: Navigate to Chat Room with MC-0042]**

**[END: New user is signed up, in the chat room with the merchant, ready for a payment request.]**

---

## 24. Cross-Flow State Dependencies

### State the Invoice Must Be In Before Each Flow Starts

This table summarizes the preconditions on invoice status for each flow. Attempting a flow when the invoice is in the wrong state must be blocked by both the frontend (preventing the UI action) and the backend (rejecting the API call with the appropriate status code).

**Build transaction (Flow 08, Step "build-tx"):** Invoice must be `pending`. Invoice must not be expired (expiresAt > now). If status is anything else → 409 Conflict.

**Submit tx hash (Flow 08, Step "submit"):** Invoice must be `pending` or `submitted`. If `submitted` (double-submit), return the existing invoice data with 200 OK — idempotent. If `confirmed`, `settled`, `expired`, or `failed` → 409 Conflict.

**Build refund transaction (Flow 19):** Invoice must be `expired` or `failed`. Customer must be the one who submitted the original transaction. A contract UTXO for this invoice must exist on-chain.

**Cancel invoice (Flow 11, Trigger B):** Invoice must be `pending`. Cannot cancel a `submitted` invoice — funds are in flight. Cannot cancel a `confirmed`, `settled`, `expired`, or `failed` invoice.

**Generate receipt (internal, Flow 09):** Invoice must be `confirmed`. Receipt generation only runs after the confirmation pipeline succeeds.

### Concurrent Access Handling

Two customers cannot pay the same invoice simultaneously — the invoice is a 1:1 relationship between one merchant and one customer. However, edge cases exist: a merchant accidentally creates two identical invoices, or the same customer double-taps "Pay Now" quickly. The backend handles these:

**Double-submit by same customer:** The submit endpoint checks for existing submissions. If a tx hash already exists on the invoice and the invoice is in `submitted`, `confirming`, `confirmed`, or `settled` status, the endpoint returns 200 with the current invoice state (idempotent). No duplicate processing.

**Two different customers trying to pay the same invoice:** This is architecturally prevented — invoices are created within a chat room that links exactly one merchant and one customer. A walk-in counter checkout invoice has no customer linked — if two people simultaneously scan and pay the same counter checkout QR, the confirmation pipeline settles on the first transaction that reaches 3 confirmations. The second transaction is a payment to the contract address that the contract will refuse to collect (because the datum's lovelace amount has already been claimed). The second customer's ADA is refundable via the Refund path.

---

## 25. Background Process Flow Map

### All Background Processes and Their Schedules

ZeroPay has four background processes running independently of any user action. Each is a BullMQ job.

**Process 1 — tx-confirmation polling:**
Trigger: Enqueued when customer submits a tx hash (Flow 08).
Frequency: Every 20 seconds while in `submitted` status. Every 60 seconds while in `confirming` status.
Duration: Runs until 3+ confirmations found (success) or 60 attempts exhausted (failure, ~20 minutes).
Concurrency: One job per invoice. Multiple invoices have multiple concurrent jobs. BullMQ worker concurrency is set to 10 (10 invoices can be polled simultaneously).

**Process 2 — invoice-expiry check:**
Trigger: Repeatable BullMQ job, scheduled to run every 60 seconds at application startup.
Action: Queries MongoDB for all pending invoices with expiresAt < now. For each found: updates to expired, updates Firebase, dispatches notifications.
Concurrency: 1 (this is a batch job, not per-invoice).

**Process 3 — daily-stats pre-computation:**
Trigger: Repeatable BullMQ job, scheduled to run at 00:01 UTC daily.
Action: For each active merchant, computes the past 7 days' daily revenue totals and writes them to Redis cache keys with 25-hour TTL.
Concurrency: 1 (runs sequentially over all merchants).

**Process 4 — receipt-generation:**
Trigger: Enqueued automatically when tx-confirmation job succeeds (invoice reaches `confirmed` status).
Action: Constructs receipt JSON, uploads to Pinata, updates MongoDB and Firebase.
Concurrency: Same as tx-confirmation — one per invoice, up to 10 concurrent.

### Dependency Chain Between Background Processes

tx-confirmation success → enqueues receipt-generation AND notification-dispatch simultaneously. receipt-generation success → Invoice status updated to `settled` → Firebase updated. notification-dispatch → FCM sends to both parties. These three downstream jobs run concurrently — receipt generation and notification dispatch are independent and do not block each other.

If receipt-generation fails after 3 retries → Invoice is settled without a CID. A daily cleanup job (scheduled, not yet implemented as of v1.0) should check for invoices with receiptPending: true and retry receipt generation for them.

---

## 26. Data Flow: Frontend → Backend → Blockchain

### Payment Request Creation Data Flow

**1. Merchant frontend** → POST /api/v1/invoices/create → sends: Firebase ID token (header), amountPaise, description, chatRoomId.

**2. Backend auth middleware** → verifies Firebase token → attaches User document to request.

**3. Backend route handler** → validates request with Zod schema → calls InvoiceService.create().

**4. InvoiceService** → calls PriceService.getAdaInrRate() → PriceService checks Redis cache → returns { adaInr: 46.29 }. Calculates lovelaceAmount = Math.round((15000 / 100) / 46.29 × 1,000,000) = 3,240,000.

**5. InvoiceService** → creates Invoice document in MongoDB → generates invoiceId.

**6. InvoiceService** → calls ChatService.writePaymentRequest(chatRoomId, invoiceData) → ChatService uses Firebase Admin SDK to write to /chatrooms/{roomId}/messages.

**7. Backend** → returns HTTP 201 with full invoice object to frontend.

**8. Merchant frontend** → receives response → TanStack Query cache for the chat room's invoices is invalidated → chat room re-renders with the payment request card.

**9. Customer frontend** → Firebase SDK's onChildAdded listener (active on /chatrooms/{roomId}/messages) fires → new message received → chat re-renders with the payment request card.

### Transaction Building Data Flow

**1. Customer frontend** → POST /api/v1/payments/build-tx → sends: Firebase ID token (header), invoiceId.

**2. Backend** → validates token, fetches User → calls PaymentService.buildTransaction(invoiceId, userId).

**3. PaymentService** → fetches Invoice from MongoDB → verifies status is "pending" and expiresAt > now.

**4. PaymentService** → calls TxBuilder.buildDirectTransfer(invoice) → MeshJS Transaction builder: sets recipient to invoice.paymentAddress, sets amount to invoice.amountLovelace, adds metadata key 674 with invoiceId → calls transaction.build() → returns unsigned CBOR hex.

**5. Backend** → returns CBOR hex to frontend.

**6. Customer frontend** → calls wallet.signTx(cbor) → wallet extension opens → user approves → wallet returns signed CBOR → calls wallet.submitTx(signedCbor) → Cardano network receives transaction → returns txHash.

**7. Customer frontend** → POST /api/v1/payments/submit → sends: invoiceId, txHash.

**8. Backend** → updates Invoice.status to "submitted", stores txHash → writes to Firebase → enqueues BullMQ job → returns HTTP 202.

---

## 27. Data Flow: Blockchain → Backend → Frontend

### Confirmation Detection Data Flow

**1. BullMQ worker** (tx-confirmation) → calls BlockfrostClient.getTransaction(txHash).

**2. Blockfrost API** → returns transaction data including block_height (e.g. 9,847,261).

**3. BullMQ worker** → calls BlockfrostClient.getLatestBlock() → returns current tip block height (e.g. 9,847,264).

**4. BullMQ worker** → confirmations = 9,847,264 − 9,847,261 = 3 → threshold met.

**5. BullMQ worker** → calls InvoiceService.updateStatus(invoiceId, "confirmed", { blockHeight, confirmations, confirmedAt }).

**6. InvoiceService** → MongoDB write: Invoice.status = "confirmed", confirmations = 3, confirmedAt = now.

**7. InvoiceService** → Firebase Admin SDK write: /invoices/{invoiceId}/status = "confirmed".

**8. Merchant frontend** → Firebase onValue listener on /invoices/{invoiceId}/status fires → receives "confirmed" → TanStack Query cache for dashboard stats invalidated → dashboard stats refetch → today's total updates.

**9. Customer frontend** → Firebase onValue listener on /invoices/{invoiceId}/status fires → receives "confirmed" → payment request card in chat room re-renders → checkmark animation plays.

**10. BullMQ worker** → enqueues receipt-generation and notification-dispatch jobs.

**11. Receipt-generation job** → uploads to Pinata → CID received → InvoiceService.updateReceipt(invoiceId, cid, receiptUrl) → MongoDB Invoice updated → Invoice.status = "settled" → Firebase /invoices/{invoiceId}/status = "settled" → Firebase Admin SDK writes receipt message to chat.

**12. Both frontends** → Firebase listeners fire one more time on "settled" status → receipt message appears in chat on both devices.

---

## 28. Real-Time Update Flow (Firebase)

### Listener Registration Points

The frontend registers Firebase listeners at specific points in the user's journey. Listeners are registered when their relevant screen mounts and deregistered (cleaned up) when the screen unmounts. This prevents memory leaks and unnecessary Firebase bandwidth consumption.

**Chat List Screen mounts:**
Register: onChildAdded and onChildChanged on /chatrooms for rooms where currentUserId is in participants. This fires when any chat room the user belongs to receives a new message (updating the last message preview and unread count in the list).

**Chat Room Screen mounts:**
Register: onChildAdded on /chatrooms/{roomId}/messages — for real-time message delivery. Register: onValue on /chatrooms/{roomId}/messages — for initial load (last 50 messages using limitToLast).

**For each payment_request message in the chat:**
Register: onValue on /invoices/{invoiceId}/status — for real-time status updates to the payment card. This listener is registered by the PaymentRequestCard component when it mounts. Deregistered when the card unmounts (user navigates away) or when the invoice reaches a terminal state (settled, expired, failed).

**Dashboard Screen mounts (merchant):**
Register: onValue on /invoices/{invoiceId}/status for all invoices that are currently in "submitted" or "confirming" status (fetched from MongoDB on dashboard load). This allows the dashboard transaction table rows to update their status badges in real time.

**Counter Checkout QR Screen mounts:**
Register: onValue on /invoices/{invoiceId}/status — for the generated invoice's status, watching for "confirmed" to trigger the confirmation animation.

### Firebase Listener Lifecycle Management

All Firebase listener registrations return an "unsubscribe" function. This function is stored in a ref and called in the useEffect cleanup function (React). The cleanup fires when: the component unmounts, the invoiceId changes (a new payment request is displayed), or the connection is intentionally dropped (user signs out). Failing to clean up listeners is the most common source of Firebase memory leaks and excessive reads — this must be enforced in code review.

---

## 29. Error Recovery Flow Catalogue

This section maps every documented error scenario to its exact recovery flow. Each entry specifies: what went wrong, what the user sees, what the system does automatically, and what the user can do.

### Error: Render Backend Cold Start (50-second delay)

What happened: First API call after an idle period. Render is waking up the server.
What the user sees: The app shows a full-screen "Waking up... just a moment" state on any screen that requires an API call. A subtle animated indicator (not a spinner — a gentle breathing animation on the ZeroPay logo).
What the system does: The API client retries the failed request automatically every 5 seconds for up to 60 seconds. When the server responds, the request completes and the app continues normally.
What the user can do: Wait. Or tap "Try now" to immediately retry.
Prevention: UptimeRobot keeps the server awake under normal conditions. If this error occurs, it means UptimeRobot has failed to ping the server in the last 15 minutes — investigate UptimeRobot's status.

### Error: MongoDB Connection Lost Mid-Request

What happened: MongoDB Atlas connection dropped during an API call (rare, brief network issue).
What the user sees: A toast: "Something went wrong. Please try again." No data loss.
What the system does: Mongoose automatically reconnects. The failed request is not retried automatically (the user must retry their action).
What the user can do: Tap to retry the action. The retry will succeed once Mongoose reconnects (typically within 5-10 seconds).

### Error: Firebase Listener Disconnected (Network Lost)

What happened: Device lost internet connection while the chat room was open.
What the user sees: A non-blocking amber banner at the top of the chat: "You're offline. Reconnecting..." The existing messages remain visible (Firebase caches them). New messages are queued.
What the system does: Firebase SDK automatically attempts reconnection every few seconds. When reconnected, the banner disappears and any missed messages are delivered.
What the user can do: Wait for reconnection. They can still read existing messages while offline.

### Error: Wallet Extension Crashes After Signing But Before submitTx

What happened: The browser wallet extension returned a signed CBOR but then crashed before `submitTx` was called. The transaction was never broadcast.
What the user sees: The Payment Approval screen returns with a toast: "There was a problem submitting your payment. Your ADA was not sent. Try again."
What the system does: Nothing automatically. The invoice remains in `pending` status.
What the user can do: Tap "Pay with [wallet]" again. The new signing and submission attempt creates the same transaction (because the lovelace amount and recipient are unchanged). A new txHash is generated and submitted to the backend.
Note: There is no way for the app to know if the user's wallet crashed or if they intentionally cancelled. The experience is the same in both cases — a safe "try again" path.

### Error: User Submits Old txHash (Replayed Request)

What happened: The customer's frontend submitted a tx hash that has already been registered (network retry, or user manually retried the submit endpoint).
What the user sees: Nothing unusual — the API returns the current invoice state with the existing txHash already in it.
What the system does: The submit endpoint is idempotent for the same txHash on the same invoice. It returns HTTP 200 with the current invoice state. No duplicate job is enqueued.
What the user can do: Nothing required — the payment is already being tracked.

### Error: Pinata IPFS Upload Fails (All Retries Exhausted)

What happened: Pinata's API was unavailable for more than 90 seconds after the payment was confirmed.
What the user sees: The invoice is marked as settled (payment confirmed, merchant stats updated). The receipt message in chat shows "Generating your receipt... this may take a moment." No receipt link yet.
What the system does: A retryPinata flag is set on the Invoice document. A cleanup job (scheduled daily) retries pinning for all invoices with this flag. Once successful, the receipt is retroactively added to the chat.
What the user can do: Wait. The receipt will appear within 24 hours. The payment is fully settled regardless of receipt status.

---

## 30. Flow Edge Cases & Corner Case Handling

### Edge Case 01: Merchant Changes Wallet Address While an Invoice Is Pending

Scenario: Merchant creates an invoice at 10:00 AM pointing to wallet address A. At 10:05 AM, merchant changes their wallet to address B in settings. Customer pays at 10:08 AM.

Expected behavior: The payment goes to address A (the address snapshotted into the invoice at creation time). The merchant receives ADA at address A, not B. The invoice settles correctly.

Why this is correct: The `paymentAddress` field on the Invoice document is an immutable snapshot. The Merchant document's `paymentAddress` update does not retroactively change any in-flight invoices.

User experience: The merchant sees the correct amount in their settled invoice history. If they check their wallet balance, the ADA is at address A. The merchant must have access to wallet A to spend those funds — typically this is fine (they changed wallets but still have the old wallet).

---

### Edge Case 02: Customer Sends Wrong Amount Directly to Merchant Address (Bypassing App)

Scenario: A tech-savvy customer decides to copy the merchant's payment address from the chat and send ADA directly from their external wallet — bypassing the ZeroPay app entirely. They send the wrong amount (more or less than the invoice amount).

Expected behavior: The ZeroPay system never sees this transaction unless it happens to match the invoiceId in the metadata. The invoice in ZeroPay remains in `pending` status and eventually expires. The merchant receives the ADA in their wallet (outside the ZeroPay context). The invoice is not settled.

User experience: Merchant sees the invoice expire in ZeroPay. If they also check their wallet balance separately, they will see the incoming ADA there but with no ZeroPay context.

Resolution: The merchant manually notes the payment outside ZeroPay. The ZeroPay invoice is cancelled. This is an edge case that the design cannot fully prevent — users who bypass the app are outside the system's control.

Note: When using the Aiken escrow contract (rather than direct transfers), this edge case is different — a payment sent directly to the merchant's address does not interact with the contract at all, and the contract UTXO remains locked. The customer's direct payment goes to the merchant successfully, but the contract funds remain locked until the merchant collects (which they cannot do because the app generated a transaction that sent to the contract address, not the direct address).

---

### Edge Case 03: Two Simultaneous Confirmations of the Same Invoice

Scenario: Due to a network glitch, two separate BullMQ workers both process the same tx-confirmation job at the same moment and both attempt to update the Invoice to "confirmed" simultaneously.

Expected behavior: One worker "wins" — its MongoDB update succeeds. The second worker's update either also succeeds (updating identical data, no harm) or hits a race condition where the first worker has already moved the status to "settled" before the second tries to set it to "confirmed."

Prevention: The MongoDB update uses a query condition: `{ invoiceId, status: "confirming" }` — it only updates if the status is still "confirming." If the first worker already moved it to "confirmed" or "settled," the second worker's update matches 0 documents and does nothing. This is an optimistic lock pattern — no database-level locking needed.

Duplicate receipt generation: If both workers enqueue receipt-generation jobs, the second job will find the Invoice already in "settled" status and the receiptCid already set — it skips the Pinata upload and exits cleanly.

---

### Edge Case 04: Customer Navigates Away During Wallet Signing

Scenario: Customer taps "Pay Now," the wallet extension opens, and then the customer switches to another browser tab or app before approving or rejecting in the wallet.

Expected behavior: When the customer returns, one of two things has happened: the wallet extension automatically dismissed (most extensions do this after a timeout), or the wallet extension is still showing the approval dialog.

If the wallet extension dismissed: the customer is back on the Payment Approval screen with the button re-enabled. The invoice is still pending. They can try again.

If the wallet extension is still open: the customer approves, the transaction submits, and the flow continues normally.

In neither case is the user stranded. The invoice expiry timer is still running, so if the customer takes too long, the invoice expires and a clear expired state is shown.

---

### Edge Case 05: App Updated While a Payment Is In-Flight

Scenario: The merchant deploys a new version of the web app (via Vercel) while a customer's payment is being confirmed (invoice is in "confirming" status).

Expected behavior: The BullMQ confirmation job running on the backend is unaffected by frontend deployments. The job continues to poll Blockfrost and will successfully settle the invoice. When the settled status is written to Firebase, the customer's browser (now loading the new app version after the Vercel deploy) receives the Firebase push and renders the confirmation. If the customer has the chat room open, the payment card updates normally.

No data loss: the invoice status is in MongoDB and Firebase — neither is affected by a frontend deployment.

---

### Edge Case 06: Cardano Network Congestion (High Block Time)

Scenario: The Cardano network is experiencing unusual congestion. Block times have increased from the normal ~20 seconds to ~60 seconds. Transactions are taking 5-10 minutes to get into a block.

Expected behavior: The invoice expiry window (default 10 minutes) is still running. If the network is slow enough, a transaction that was legitimately submitted might not reach 3 confirmations before the invoice expires in the ZeroPay system.

Invoice side: The invoice status moves from `submitted` to `confirming` to `confirmed` regardless of the expiry time. The expiry only affects `pending` invoices — once a tx hash has been submitted (invoice is `submitted` or beyond), the expiry timer has no effect on the confirmation pipeline.

User communication: While in `submitted` or `confirming` status, the chat shows "Processing payment — Cardano network is slower than usual." This message is triggered when the first confirmation has not appeared within 3 minutes of submission (detected by the polling job after 9 failed attempts).

**[END OF APP FLOW DOCUMENT]**

---

*ZeroPay — App Flow Document*
*Team Null Void · Cardano Hackathon Asia IBW 2025 → Production*
*Every flow described here has a corresponding test case. No flow is considered implemented until its test case passes on the Cardano preprod network.*