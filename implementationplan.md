Implementation Plan — Sprint 7: Production Aggregations, Role Switching & Checkout Polish
This document details the architecture and implementation design for Sprint 7 of the ZeroPay ecosystem, focusing on production optimizations, seamless role-switching for merchants, checkout flow optimizations, and advanced error observability.

🌟 Sprint 7 Objectives & Benefits
Performant Backend Ledger: Add database compound indexes to optimize merchant query lookups, and upgrade the health-check route to report live database/cache connection statuses.
** observabilities**: Add active-processing queue loggers and secure the registration sequence for Sentry Express error handlers.
Seamless Role Switching: Equip users who have both merchant and customer privileges with an instant toggle controller in the profile page, instantly re-drawing navigation targets.
Counter Checkout Live Transitions: Subscribe the generated checkout QR page to the invoice's status in real-time, instantly rendering a success screen on completion.
Direct Scanning Path: Call the chat room setup routine directly from the scanning page for static QR codes, removing intermediate redirects.
Polished Sharing & Animations: Refine receipt sharing options, add pulsing skeletons for dashboard loading states, and animate chart rendering.
🔒 User Review Required
IMPORTANT

Sentry Registration Order: In Express, Sentry's expressErrorHandler must be registered before custom catch-all error handling middleware to capture errors reliably. We will re-arrange this order in server.ts.

🛠️ Proposed Changes
1. Backend Performance & Observability
[MODIFY] 
Invoice.ts
Add compound index for recent transaction feed sorting: invoiceSchema.index({ merchantId: 1, createdAt: -1 });
Add compound index for 7-day aggregation window: invoiceSchema.index({ merchantId: 1, status: 1, settledAt: -1 });
[MODIFY] 
server.ts
Mount Sentry.expressErrorHandler() prior to notFound and errorHandler middlewares.
Update /health endpoint to perform live connection checks:
MongoDB: mongoose.connection.readyState === 1
Redis: bullMqRedis.status === 'ready' and a quick async bullMqRedis.ping() === 'PONG'.
[MODIFY] 
bullboard.ts
Import dailyStatsQueue and register it inside the Bull Board queue list.
[MODIFY] 
Workers (confirmation, receipt, notification, expiry, dailyStats)
Add structured event listeners on workers to log queue status transitions:
worker.on('active', (job) => { ... })
worker.on('completed', (job) => { ... })
2. Frontend UX, Role Switching, and Transitions
[MODIFY] 
authStore.ts
Define activeRoleView: 'merchant' | 'customer' (defaulting to 'merchant') in state.
Expose setActiveRoleView: (view: 'merchant' | 'customer') => void in the Zustand store.
[MODIFY] 
BottomNav.tsx
Retrieve activeRoleView to decide whether to render merchant or customer navigation items, enabling immediate UI changes upon role toggle.
[MODIFY] 
ProfilePage.tsx
If the user's role is 'both', display an interactive active mode selector (Merchant Mode vs. Customer Mode) using the setActiveRoleView action.
[MODIFY] 
DashboardPage.tsx
Build an elegant, full-page pulsing skeleton representation when isLoading is true, keeping the layout stable before charts load.
[MODIFY] 
RevenueChart.tsx
Add a keyframe animation utility in the CSS configuration to animate the growth of weekly revenue bars on mount.
[MODIFY] 
CounterCheckoutPage.tsx
Subscribe to /invoices/${invoiceId} in Firebase RTDB.
If the status transitions to settled, render a fullscreen payment completion interface showing the exact ADA settled, invoice ID, and a "Complete" button.
[MODIFY] 
ScanQRPage.tsx
Direct scanning refinement: if a decoded QR does not begin with INV- and does not contain /receipt/, immediately invoke createChatRoom and transition straight to the room page, showing a clean overlay during setup.
[MODIFY] 
ReceiptPage.tsx
Add a "Share Receipt" action button. Uses native navigator.share on compatible clients with fallback to copy-to-clipboard.
🧪 Verification Plan
Automated Checks
Type checking: Execute npm run type-check to confirm zero static type errors.
Build verifications: Compile both backend (npm run build:backend) and web app (npm run build:web) to verify bundle outputs.
Manual Verification
Test role toggling on a account with 'both' privileges.
Scan static QR code and verify seamless transition to the merchant's chatroom without redirection loops.
Verify counter checkout transitions dynamically to a receipt card as soon as the client signs a transaction.