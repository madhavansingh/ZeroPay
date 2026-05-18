# Slide 5 — Product Limitations *(Optional)*
## Are there any limitations compared to requirements?

- **Cold Start Latency:** Render free tier sleeps after 15 minutes of inactivity, causing a ~50-second wake-up delay for the first request. Mitigated with UptimeRobot pinging the server every 14 minutes — not a user-facing issue in normal operation.

- **Blockchain Read Rate Limit:** Blockfrost free tier caps at 50,000 API requests/day. Adaptive polling (20-second intervals in `submitted`, 60-second in `confirming`) keeps usage well within limits for up to ~500 concurrent invoices/day. Koios free fallback is available at all times.

- **No Fiat On/Off Ramp:** Version 1.0 does not include INR ↔ ADA conversion. Users must acquire ADA independently. This is a conscious v1 scope decision — integrating a fiat ramp (MoonPay, Ramp Network) is planned for v2.0.

- **Mobile Wallet Dependency:** On mobile, users need WalletConnect-compatible wallets. Browser extension wallets (CIP-30) do not work in mobile browsers. In-app non-custodial wallet generation (MeshJS key gen + device secure keystore) is a v2.0 feature.

- **Database Storage Cap:** MongoDB Atlas M0 free tier is limited to 512 MB, supporting approximately 500,000 invoice documents. Sufficient for hackathon and early-stage production; migration to M10 paid tier is the scaling trigger.
