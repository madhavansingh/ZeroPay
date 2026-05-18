# ZeroPay — Backend Schema Document

### Version 1.0 · Team Null Void · Cardano Hackathon Asia IBW 2025 → Production
### Document Owner: Madhavan Singh Parihar
### Depends On: PRD v1.0 · TRD v1.0 · App Flow v1.0 · UI/UX v1.0
### Status: Living Document — Updated as Schema Evolves

---

## Table of Contents

1. [Document Purpose & How to Read](#1-document-purpose--how-to-read)
2. [Foundational Rules — Non-Negotiable Across All Schemas](#2-foundational-rules--non-negotiable-across-all-schemas)
3. [MongoDB — Database & Collection Overview](#3-mongodb--database--collection-overview)
4. [MongoDB — User Collection](#4-mongodb--user-collection)
5. [MongoDB — Merchant Collection](#5-mongodb--merchant-collection)
6. [MongoDB — Invoice Collection](#6-mongodb--invoice-collection)
7. [MongoDB — Transaction Collection](#7-mongodb--transaction-collection)
8. [MongoDB — Index Definitions & Rationale](#8-mongodb--index-definitions--rationale)
9. [MongoDB — Validation Rules & Constraints](#9-mongodb--validation-rules--constraints)
10. [MongoDB — Pre-Save Hooks & Computed Fields](#10-mongodb--pre-save-hooks--computed-fields)
11. [Invoice Status State Machine — Canonical Reference](#11-invoice-status-state-machine--canonical-reference)
12. [Firebase Realtime Database — Top-Level Structure](#12-firebase-realtime-database--top-level-structure)
13. [Firebase — Presence Node Schema](#13-firebase--presence-node-schema)
14. [Firebase — ChatRoom Node Schema](#14-firebase--chatroom-node-schema)
15. [Firebase — Messages Node Schema](#15-firebase--messages-node-schema)
16. [Firebase — Message Type Payload Specifications](#16-firebase--message-type-payload-specifications)
17. [Firebase — Invoice Status Node Schema](#17-firebase--invoice-status-node-schema)
18. [Firebase — Security Rules Specification](#18-firebase--security-rules-specification)
19. [Firebase — Listener Registration Map](#19-firebase--listener-registration-map)
20. [Redis — Client Architecture & Naming Conventions](#20-redis--client-architecture--naming-conventions)
21. [Redis — Cache Key Registry](#21-redis--cache-key-registry)
22. [Redis — Rate Limit Key Registry](#22-redis--rate-limit-key-registry)
23. [Redis — Stored Value Shape Specifications](#23-redis--stored-value-shape-specifications)
24. [BullMQ — Queue Registry & Configuration](#24-bullmq--queue-registry--configuration)
25. [BullMQ — Job Payload Specifications](#25-bullmq--job-payload-specifications)
26. [BullMQ — Job Lifecycle & Failure Handling](#26-bullmq--job-lifecycle--failure-handling)
27. [API — Standard Envelope Contract](#27-api--standard-envelope-contract)
28. [API — Request Body Schemas by Endpoint](#28-api--request-body-schemas-by-endpoint)
29. [API — Response Body Schemas by Endpoint](#29-api--response-body-schemas-by-endpoint)
30. [API — Error Code Registry](#30-api--error-code-registry)
31. [Shared TypeScript Types — Canonical Definitions](#31-shared-typescript-types--canonical-definitions)
32. [Cardano Transaction Metadata Schema — On-Chain](#32-cardano-transaction-metadata-schema--on-chain)
33. [Aiken Smart Contract — Datum Schema](#33-aiken-smart-contract--datum-schema)
34. [Aiken Smart Contract — Redeemer Schema](#34-aiken-smart-contract--redeemer-schema)
35. [IPFS Receipt Document — Full Schema](#35-ipfs-receipt-document--full-schema)
36. [Cross-Collection Relationship Map](#36-cross-collection-relationship-map)
37. [Data Write Sequence — Who Writes What, When](#37-data-write-sequence--who-writes-what-when)
38. [Data Integrity Rules — Enforced at Every Layer](#38-data-integrity-rules--enforced-at-every-layer)
39. [Schema Evolution & Migration Strategy](#39-schema-evolution--migration-strategy)

---

## 1. Document Purpose & How to Read

### What This Document Is

The Backend Schema Document is the single authoritative reference for every data structure in ZeroPay. It defines every field in every MongoDB collection, every path in the Firebase Realtime Database, every key pattern in Redis, every job payload shape in BullMQ, every API request and response contract, every on-chain metadata structure, every Aiken datum and redeemer type, and the complete IPFS receipt document schema.

This document answers the question that neither the PRD, TRD, nor App Flow Document fully answers: what, precisely, does the data look like at rest? When a developer opens a MongoDB document in Compass, or reads a Firebase node in the Firebase Console, or inspects a Redis key in Upstash's dashboard, this document tells them what they are looking at and why every field exists.

### Who Uses This Document and How

Backend engineers use it as the ground truth when building Mongoose models, Zod validation schemas, BullMQ worker payloads, and Firebase write operations. If this document and the code ever disagree, the document describes the intended state and the code is the bug, unless a formal amendment is recorded in the Open Decisions Log.

Frontend engineers use it to understand the exact shape of API responses so that their TypeScript types can be defined precisely. The shared-types package must be derived from this document, not invented independently.

QA engineers use it to build test cases that verify data integrity at the storage layer — not just at the API surface — because payment bugs often manifest as silent data corruption rather than visible errors.

### Notation Conventions

Throughout this document, field descriptions follow a consistent prose pattern. The field name is stated first. The storage type follows. Whether the field is required or optional is always stated explicitly. If the field has constraints, they are listed. If the field has a default value, that value is stated. If the field is indexed, the index type and the query pattern it serves are explained. If the field is immutable after creation, that is stated. If the field is a denormalized copy of data from another collection, the source is identified and the rationale for denormalization is given.

A field described as holding a paise value always stores an integer where one rupee equals one hundred units. A field described as holding a lovelace value always stores an integer where one ADA equals one million units. No floating-point monetary values exist anywhere in this schema. This is the single most important constraint in the entire document.

---

## 2. Foundational Rules — Non-Negotiable Across All Schemas

### Rule One — Integer Money Forever

Every field that represents an Indian Rupee amount stores the value in paise, which is the amount in rupees multiplied by one hundred. A payment of one hundred and fifty rupees is stored as fifteen thousand. Every field that represents an ADA amount stores the value in lovelace, which is the amount in ADA multiplied by one million. A payment of three point two four ADA is stored as three million two hundred and forty thousand. These representations never change. No conversion happens at the storage layer. Division happens only at the presentation layer, only in frontend formatting functions, never in service logic or job queue workers.

### Rule Two — UTC Timestamps Everywhere

Every timestamp stored anywhere in this system — MongoDB Date fields, Firebase server timestamps, Redis cache metadata, BullMQ job creation times, IPFS receipt generation timestamps — uses Coordinated Universal Time. No local time zones are stored. The frontend is entirely responsible for converting UTC to the user's local timezone for display purposes. If a field needs to store a POSIX timestamp in milliseconds rather than a Date object, that is noted explicitly, but the baseline time reference remains UTC.

### Rule Three — String Enums Over Numeric Codes

Every enumerable field uses a human-readable string value, never a numeric code. Invoice status is stored as the string "pending," not as the integer zero. Merchant category is stored as the string "food," not as the integer two. This rule makes documents self-documenting when viewed in the database console, prevents off-by-one errors when enum positions shift during development, and makes logs immediately readable without a codebook.

### Rule Four — ObjectID References Between MongoDB Collections

Every cross-collection reference within MongoDB uses a MongoDB ObjectID, not a string copy of any identifier. When the Invoice collection references the Merchant document it belongs to, it stores the MongoDB ObjectID of that Merchant document, typed as a Schema reference. This enables Mongoose's populate functionality when join-like queries are needed. The human-readable identifier, such as the merchantId string in the format MC-0042, exists as a separate field for application-layer use and QR code encoding, but it is never used as a database foreign key.

### Rule Five — Snapshot Fields Are Never Updated After Creation

Certain fields on Invoice documents capture the state of a related entity at the moment of invoice creation and are intentionally never updated thereafter, regardless of changes to the source entity. The payment address field on an Invoice is the most critical example. When a merchant changes their wallet address, every invoice created before that change continues to point to the old address. This is correct behavior. It prevents a merchant from changing their address mid-flight and rerouting a customer's payment that is already being processed. Any field marked as a snapshot in this document must have a Mongoose pre-save hook that prevents updates after the document is created.

### Rule Six — Firebase Is a Mirror, MongoDB Is the Source of Truth

The Firebase Realtime Database contains no data that exists only in Firebase. Every piece of data in Firebase is either a real-time mirror of a MongoDB field, a chat message that was created by the Firebase Admin SDK on the backend, or a derived aggregate that serves the frontend's real-time update needs. If Firebase goes down, MongoDB contains everything needed to reconstruct the application state. If MongoDB and Firebase are ever found to disagree on the status of an invoice, MongoDB is correct. Firebase is a read-optimized real-time delivery mechanism, not a source of truth.

---

## 3. MongoDB — Database & Collection Overview

### Database Name

The single MongoDB Atlas database used by ZeroPay is named zeropay. All four collections exist within this database. No multi-database architecture is used in Version 1.0. The database name is not configurable at runtime — it is hardcoded in the Mongoose connection URI.

### Collections and Their Roles

The users collection is the identity backbone of the entire system. Every person who signs in through Firebase Authentication has a corresponding document here. This collection is read on every authenticated API request through the authentication middleware, making it the most frequently read collection in the system. It is rarely written to — typically only on first sign-in, when a wallet is connected, when a display name is changed, or when an FCM token rotates.

The merchants collection is the profile extension layer for users who have completed merchant onboarding. Not every document in the users collection has a corresponding document in the merchants collection. The relationship is one-to-one where it exists — one User document to one Merchant document. The merchants collection is read when a QR code is scanned, when an invoice is created, and when the merchant dashboard loads. It is written to when onboarding completes, when settings are changed, and when the job queue updates the denormalized aggregate statistics after a payment settles.

The invoices collection is the operational core of the payment system. It is the highest-write collection, receiving between five and seven write operations over the lifetime of each invoice document. It is also the most queried collection, serving the merchant dashboard's transaction history, the invoice creation endpoint, the transaction building endpoint, the confirmation polling pipeline, and the expiry job. Index design for this collection is the most critical performance decision in the entire schema.

The transactions collection records the on-chain blockchain footprint of each payment. It is a one-to-one companion to invoices — one Invoice document maps to at most one Transaction document. It is separate from invoices to maintain a clean separation between business state and blockchain state, and to allow the confirmation pipeline to perform atomic deduplication checks using the unique index on the transaction hash field.

### Collection Write Volume Classification

The users collection is low-write and high-read. The merchants collection is very-low-write and medium-read. The invoices collection is high-write and high-read. The transactions collection is medium-write and low-read. These classifications inform connection pool sizing and index strategy. The invoices collection's write patterns justify careful index design, whereas the users collection's read patterns justify caching the user document in Redis after authentication.

---

## 4. MongoDB — User Collection

### Collection Name and Purpose

The collection is named users. Every document represents one person who has authenticated with ZeroPay. A single person is one document regardless of whether they are a customer, a merchant, or both — the role field on the document controls which application features they can access.

### The firebaseUid Field

This is a string field that stores the unique identifier assigned to this user by Firebase Authentication. It is required, immutable, unique across the entire collection, and indexed. It is the primary bridge between Firebase Auth and MongoDB. Every authenticated API request arrives with a Firebase ID token; the authentication middleware decodes that token, extracts the Firebase UID from the decoded payload, and uses this field to look up the user's MongoDB document. It is set once on document creation and can never be modified. Its format is a variable-length alphanumeric string generated by Firebase — it is not a UUID and does not follow a predictable pattern.

### The role Field

This is a string field constrained to one of three values: customer, merchant, or both. It defaults to customer when a new document is created. It is required. It is not indexed because role-based filtering is always performed in the context of a known user document, never as a standalone query. The value of this field is read on every authenticated API request — not from the Firebase token, but directly from the MongoDB document. This design choice means that role changes take effect on the next API call rather than waiting up to one hour for a Firebase token to refresh. A user becomes a merchant by completing the merchant onboarding flow, at which point this field is updated to merchant or both. It is never changed back to customer once merchant is set, though users with the both role can operate in either capacity.

### The phone Field

This is an optional string field. It stores the user's phone number in E.164 international format — the plus sign followed by the country code followed by the subscriber number, with no spaces or punctuation. The Indian format for a number in the 9876543210 range would be stored as plus-91-9876543210 as a continuous string with the plus prefix. It is populated when the user signs up via phone OTP authentication. It has a sparse unique index, meaning the index only covers documents where this field exists, so multiple documents without a phone field do not conflict with each other. The maximum length is fifteen characters, matching the maximum E.164 length.

### The email Field

This is an optional string field. It stores the user's email address in lowercase, trimmed of leading and trailing whitespace. It is populated when the user signs up via email and password authentication. It has a sparse unique index with the same rationale as the phone field. Normalization to lowercase happens before storage, in the Mongoose pre-save hook, so that case variations of the same email address are treated as duplicates.

### The displayName Field

This is a required string field with a default value of ZeroPay User. It stores the user's chosen display name as it appears in the chat interface, on receipts, and in push notification payloads. Maximum length is sixty characters. Minimum length is one character. Leading and trailing whitespace is stripped before storage. This field is user-editable from the Profile settings screen. It is used in the chat room list, in the chat room header, in the notification dispatch worker when composing push notification bodies, and in the IPFS receipt document under the customer object.

### The walletAddress Field

This is an optional string field. It stores the Cardano bech32 enterprise address that the user has connected as their primary payment address. It begins with addr1 on mainnet or addr-test1 on the preprod network. It has a sparse unique index because each Cardano enterprise address should belong to at most one ZeroPay user — this index prevents two accounts from claiming the same wallet. It is set when the user completes the wallet connection flow and is cleared to null when the user explicitly disconnects their wallet. For merchants, this field feeds into the Merchant document's payment address, but the two fields are maintained independently.

### The stakeAddress Field

This is an optional string field. It stores the Cardano bech32 stake address, also called the reward address, associated with the user's HD wallet. It begins with stake1 on mainnet or stake-test1 on preprod. A stake address represents an entire HD wallet account and can be used to query all enterprise addresses derived from that account via the Blockfrost accounts API. It is used in the confirmation pipeline to detect transactions that arrive at any derived address from the user's wallet, handling the case where Cardano HD wallets rotate addresses with each transaction for privacy. It is optional because some wallet connections do not return a stake address, and it is never required for core payment functionality.

### The fcmToken Field

This is an optional string field. It stores the current Firebase Cloud Messaging registration token for this user's device. This token is what the notification dispatch job queue worker uses to address push notifications to a specific device. It is overwritten on every session start — when the user opens the app, the frontend reads the current FCM token from the Firebase Messaging SDK and sends it to the backend, which overwrites whatever value was previously stored. The field is not indexed because it is only ever accessed in the context of a user document that has already been fetched by user ID. When FCM returns a REGISTRATION-TOKEN-NOT-REGISTERED error for a token, the notification worker immediately sets this field to null on the corresponding user document.

### The notificationPreferences Embedded Object

This is an embedded object field, always present on every document, with three boolean subfields. The paymentReceived subfield controls whether merchants receive push notifications when a customer submits a payment transaction. The paymentConfirmed subfield controls whether both merchants and customers receive push notifications when a payment reaches the required number of block confirmations. The invoiceExpired subfield controls whether both parties receive push notifications when an invoice expires without payment. All three default to true. The notification dispatch worker checks these preferences before sending each notification type. If a preference is false, the corresponding notification is skipped for that user without error.

### The did Field

This is an optional string field reserved for the Atala PRISM Decentralized Identifier. Its format is the DID URI scheme followed by the PRISM method followed by the method-specific identifier. This field exists in the schema but is not populated by any Version 1.0 feature. It is included so that the schema does not require a migration when the DID-based merchant verification feature ships in Version 2.0. It has a sparse index to support future queries by DID.

### The isVerified Field

This is a required boolean field that defaults to false. It represents whether this user has completed a formal verification process, such as the Atala PRISM DID-based merchant KYC flow planned for Version 2.0. No Version 1.0 feature sets this to true. It exists so that the schema is ready for the verification feature without requiring a migration.

### The onboardingStep Field

This is a required string field constrained to the values new, role-selected, shop-complete, wallet-complete, and complete. It defaults to new when a document is created. It serves as the bookmark for resumable merchant onboarding — when a merchant abandons the onboarding flow and returns to the app, the application reads this field to determine which onboarding screen to show next. The value is updated at the completion of each onboarding step. A value of new means the user has created an account but not yet chosen their role. Role-selected means they have chosen merchant but not yet filled in their shop details. Shop-complete means the Merchant document has been created but the wallet has not been connected. Wallet-complete means the wallet is connected but the QR code ready screen has not been reached or completed. Complete means the full onboarding flow has been finished at least once. Customer-only users move directly from new to complete upon role selection, skipping the intermediate merchant onboarding steps.

### The lastSeen Field

This is a required Date field that defaults to the current timestamp at document creation. It is updated to the current timestamp on every authenticated API request, in the authentication middleware's upsert operation. It is used by the Firebase presence system indirectly — the Firebase presence is managed client-side using Firebase's onDisconnect hooks, but the lastSeen field in MongoDB provides a server-side record that is more reliable for audit purposes and for determining which merchants have been inactive long enough to skip the daily stats pre-computation job.

### The Automatic Timestamp Fields

Two additional Date fields, createdAt and updatedAt, are added automatically by Mongoose's timestamps option. They are always present, always accurate, and always in UTC. createdAt is set once at document creation and never changed. updatedAt is updated on every write operation by Mongoose automatically. These fields are not manually managed anywhere in the codebase.

---

## 5. MongoDB — Merchant Collection

### Collection Name and Purpose

The collection is named merchants. Each document represents the merchant profile of a user who has completed the merchant onboarding flow. The relationship between the users and merchants collections is one-to-one where it exists — every Merchant document has exactly one corresponding User document, but not every User document has a corresponding Merchant document.

### The userId Field

This is a required ObjectID field that stores a reference to the users collection. It establishes the link between the Merchant document and the base identity document of the same person. It is unique across the collection — one person can be a merchant only once. It is immutable after creation. It is indexed to support the query pattern of looking up a merchant by their user identity, which happens in the authentication middleware when the authenticated user's role is merchant or both.

### The merchantId Field

This is a required string field that stores the human-readable merchant identifier in the format MC followed by a zero-padded four-digit number, such as MC-0042. It is required, unique, and indexed. It is the identifier embedded in QR codes and shared with customers. It is generated during onboarding by finding the count of existing merchant documents and incrementing it to generate the next sequential number. The sequential generation approach is acceptable because merchant sign-ups are a low-frequency event — the collision risk of two simultaneous merchant registrations generating the same ID is handled by the unique index, which would cause the second registration to retry. This identifier is permanent and never changes, because it is already printed on physical QR codes in the real world.

### The shopName Field

This is a required string field. It stores the name of the merchant's business as entered during onboarding. Maximum length is fifty characters. It is trimmed of whitespace before storage. It appears in the payment request card in the chat interface, in the merchant dashboard header, in push notification titles sent to customers, and in the IPFS receipt document under the merchant object. Merchants can change their shop name from the Merchant Settings screen, and the change takes effect immediately for all new invoices and notifications, but it does not retroactively alter the shop name recorded in already-generated IPFS receipts, because those are immutable.

### The category Field

This is a required string field constrained to the values food, retail, services, vendor, and other. It is selected by the merchant during onboarding from the category chip selector. It is included in the IPFS receipt document and is displayed in the chat room header when a customer opens a conversation with the merchant. It is not used for any filtering or routing logic in Version 1.0, but it exists for analytics and potential Version 2.0 features like category-based merchant discovery.

### The paymentAddress Field

This is an optional string field. It stores the Cardano bech32 enterprise address where this merchant receives ADA payments. It is set when the merchant completes the wallet connection step of onboarding. It is optional because merchants can technically exist without a connected wallet — in which case they cannot create invoices until they connect one. It is indexed because the confirmation polling pipeline needs to look up which invoice is associated with an incoming transaction at a given address. This field represents the merchant's current payment address for new invoices. Changing it does not affect the paymentAddress field on invoices that have already been created, because the invoice field is a snapshot.

### The stakeAddress Field

This is an optional string field. It stores the Cardano stake address associated with the merchant's connected wallet. Its purpose parallels the stakeAddress field on the User collection. It is used by the confirmation pipeline to query all enterprise addresses associated with the merchant's HD wallet account, ensuring payments to any derived address are detected.

### The invoiceExpiry Field

This is a required integer field that stores the merchant's preferred default invoice expiry duration in seconds. It defaults to six hundred, which is ten minutes. The valid range is enforced at the schema level as a minimum of three hundred (five minutes) and a maximum of one thousand eight hundred (thirty minutes). When a merchant creates an invoice without specifying a custom expiry, this value is used. Merchants can adjust it from the Merchant Settings screen. Changing it does not retroactively affect pending invoices, which already have their expiry timestamp baked in.

### The totalReceived Field

This is a required integer field that defaults to zero. It stores the cumulative total of all lovelace received by this merchant across all settled invoices. It is a denormalized aggregate, meaning it is maintained by the receipt generation job queue worker rather than computed live from the invoices collection. After each invoice reaches the settled status, the worker increments this field by the invoice's lovelace amount using a MongoDB atomic increment operation. It is used by the merchant dashboard's overview panel to display the all-time ADA received metric without running a collection-wide aggregation. Because it is an aggregate, it is eventually consistent — there is a brief window between an invoice settling and this field being updated, during which the dashboard's all-time total may not include the most recent payment.

### The totalOrders Field

This is a required integer field that defaults to zero. It stores the count of all invoices that have reached the settled status for this merchant. Like totalReceived, it is denormalized and maintained by the receipt generation worker using an atomic increment after each settlement. It powers the dashboard's completed orders count widget.

### The isActive Field

This is a required boolean field that defaults to true. It represents whether this merchant account is currently active. In Version 1.0, no feature sets this to false — it exists to support future account suspension functionality without requiring a schema migration. Before creating an invoice, the invoice creation endpoint verifies that the merchant's isActive field is true and rejects the request with an appropriate error if it is not.

### The Automatic Timestamp Fields

createdAt and updatedAt are managed automatically by Mongoose, identical in behavior to the User collection's timestamp fields.

---

## 6. MongoDB — Invoice Collection

### Collection Name and Purpose

The collection is named invoices. This is the most complex and most written-to collection in the entire system. Each document represents the complete lifecycle of one payment request, from the moment a merchant creates it to the moment it reaches a terminal state of settled, expired, or failed. An invoice document receives a minimum of five write operations over its lifetime in the happy path, and the collection must be designed to handle all of these efficiently under concurrent load.

### The invoiceId Field

This is a required string field. It stores the application-layer unique identifier for this invoice in the format INV followed by a hyphen, followed by an eight-digit date string in YYYYMMDD format, followed by a hyphen, followed by a six-character alphanumeric nanoid. A representative example is INV-20250518-X7K2M1. It is unique across the collection. It is indexed with a unique index. It is the identifier embedded in Cardano transaction metadata, stored in the IPFS receipt document, and displayed to merchants in the dashboard's expanded transaction row. It is generated by the backend invoice creation service at the moment the invoice document is created.

### The merchantId Field

This is a required ObjectID field that references the merchants collection. It identifies which merchant created this invoice and owns the payment. It is part of the primary compound index on the collection, combined with the status and createdAt fields, to support the merchant dashboard's transaction history query. It is set at creation and is immutable.

### The merchantMongoId Field

This is the same as merchantId in purpose but is named clearly to distinguish from the human-readable merchantId string on the Merchant document. Throughout this document, when merchantId is mentioned in the context of the Invoice collection, it refers to this ObjectID. When the human-readable MC-0042 format identifier is needed — for example, when writing Cardano metadata or the IPFS receipt — the invoice creation service first fetches it from the Merchant document during invoice creation and stores it in a separate string field described below.

### The merchantStringId Field

This is a required string field that stores the human-readable merchant identifier such as MC-0042 at the time of invoice creation. It is a snapshot — it is copied from the Merchant document at creation time and never updated. It exists so that the confirmation pipeline and receipt generation worker can access the merchant's readable identifier without a second MongoDB lookup to the merchants collection. This denormalization is deliberate and justified by the read performance benefit across the confirmation pipeline's polling cycle.

### The customerId Field

This is an optional ObjectID field that references the users collection. It identifies the customer who is expected to pay this invoice. It is set when the invoice is created within a chat room context, because the chat room links a specific customer to a specific merchant. It is null for counter checkout invoices, which are walk-in transactions where the customer is anonymous and may not have a ZeroPay account. When this field is populated, the notification dispatch worker uses it to fetch the customer's FCM token and send payment status notifications to them.

### The chatRoomId Field

This is an optional string field. It stores the Firebase chat room identifier for the room in which this invoice was created. It follows the format room- followed by a SHA-256 hex digest. It is null for counter checkout invoices. When populated, it is used by the invoice creation service to write the payment-request message to the correct Firebase chat room path, and by the confirmation pipeline to write status update messages to the correct chat room as the invoice progresses through its state machine.

### The amountPaise Field

This is a required integer field. It stores the invoice amount in Indian Rupee paise — the amount in rupees multiplied by one hundred. A one-hundred-and-fifty-rupee invoice is stored as fifteen thousand. It is set at creation and is immutable. Minimum value is one hundred paise, which is one rupee. Maximum value is one billion paise, which is ten million rupees. The Mongoose schema enforces these bounds with a min and max validator.

### The amountLovelace Field

This is a required integer field. It stores the invoice amount in Cardano lovelace — the amount in ADA multiplied by one million. It is calculated at invoice creation time by dividing the paise amount by one hundred to get rupees, dividing by the current ADA/INR rate to get ADA, multiplying by one million to get lovelace, and rounding to the nearest integer using JavaScript's Math.round function. The result is stored here and never changed. Minimum enforced value is one million lovelace, which is one ADA, matching Cardano's minimum UTXO requirement. The Mongoose schema enforces this minimum with a validator. This is the canonical amount used in all blockchain operations — transaction building, escrow contract datum encoding, and on-chain verification.

### The adaInrRate Field

This is a required floating-point number field. It stores the ADA/INR exchange rate that was used to calculate the amountLovelace from the amountPaise. It is fetched from the Redis price cache at invoice creation time. It is stored as a regular JavaScript Number, which is a double-precision float — the only instance of a floating-point number at the storage layer, justified by the fact that exchange rates are inherently decimal. It is immutable after creation. It is displayed to customers on the payment approval screen as the rate used for this invoice and is included in the IPFS receipt for auditability.

### The adaUsdRate Field

This is a required floating-point number field. It stores the ADA/USD exchange rate at the time of invoice creation, fetched simultaneously with the ADA/INR rate from the CoinGecko response. It is not used in any payment calculations for Version 1.0 but is stored for future analytics — for example, to report total revenue in USD alongside INR — and for the high-value invoice confirmation threshold, which requires six block confirmations for invoices above the equivalent of five hundred USD.

### The paymentAddress Field

This is a required string field. It stores the Cardano bech32 enterprise address where the customer should send payment. It is copied from the Merchant document's paymentAddress field at invoice creation time. It is a snapshot field — immutable after creation. If the merchant changes their wallet address after this invoice was created, this field retains the old address, ensuring the customer's payment goes to the address the merchant had at the time of the request. This field is used by the transaction builder to set the recipient address in the unsigned transaction CBOR, and by the confirmation pipeline to verify that the incoming transaction actually went to the correct address.

### The description Field

This is an optional string field. It stores the free-text description entered by the merchant when creating the invoice, such as "2x Masala Chai." Maximum length is one hundred and forty characters, matching the Cardano transaction metadata limit of sixty-four bytes per value (UTF-8 text at approximately two bytes per character in the worst case for Indian scripts). If the description exceeds sixty-four bytes in UTF-8 encoding, it is truncated for the on-chain metadata but stored in full in MongoDB.

### The items Field

This is an optional array of embedded sub-documents. Each sub-document in the array represents one line item in the invoice. Each sub-document has three fields: name is a required string with a maximum length of sixty characters; qty is a required positive integer representing the quantity; and priceINR is a required positive integer representing the unit price of this item in paise. The total of all items' qty multiplied by priceINR must equal the invoice's amountPaise, and this is validated by a Mongoose pre-save hook before any new invoice document is written. If no items are provided, the array is empty and the invoice uses only the description field for context.

### The status Field

This is a required string field constrained to seven values: pending, submitted, confirming, confirmed, settled, expired, and failed. It defaults to pending. It is the most important field on the most important collection. The complete rules governing its transitions are defined in Section 11 of this document. It is part of the primary compound index on the collection. Every status transition — without exception — is written simultaneously to this MongoDB field and to the corresponding Firebase path at invoices slash invoiceId slash status, so that the frontend can receive the update in real time without polling.

### The txHash Field

This is an optional string field. It stores the Cardano transaction hash returned by the Cardano network after the customer's wallet broadcasts the signed transaction. It is sixty-four hexadecimal characters in length. It has a sparse unique index, meaning the index only covers documents where this field is present, preventing the same transaction hash from being registered against multiple invoices. It is null until the customer submits a payment. Setting this field is always accompanied by a status transition from pending to submitted, and these two writes happen atomically in a single Mongoose findByIdAndUpdate call.

### The blockHeight Field

This is an optional integer field. It stores the Cardano block height at which the transaction was first included in a block. It is set by the confirmation polling worker when the transaction is first detected on-chain, at the same moment the status transitions from submitted to confirming. It is used to calculate the number of confirmations on subsequent polls by subtracting this value from the current chain tip's block height. It is included in the IPFS receipt document and displayed in the merchant dashboard's expanded transaction row.

### The confirmations Field

This is an optional integer field. It stores the number of block confirmations the transaction had at the time of the most recent polling check. It is updated on each polling cycle by the confirmation worker. Its value is always the result of subtracting the blockHeight from the current chain tip height. It is used by the frontend to display a live confirmation counter in the payment processing state, though in practice most users will not see it count past one or two before the status transitions to confirmed.

### The confirmedAt Field

This is an optional Date field. It stores the UTC timestamp at which the invoice was first detected as having three or more block confirmations. It is set by the confirmation polling worker at the moment it transitions the status from confirming to confirmed. It is not the transaction's on-chain timestamp — Cardano blocks have their own slot timestamps which are not stored here. It is the application-layer timestamp of when ZeroPay's polling job detected finality.

### The settledAt Field

This is an optional Date field. It stores the UTC timestamp at which the invoice reached the settled status — meaning the IPFS receipt was generated, the merchant's aggregate stats were incremented, and both parties were notified. It is set by the receipt generation worker as the final step of the post-confirmation pipeline.

### The receiptCid Field

This is an optional string field. It stores the IPFS Content Identifier returned by Pinata after the receipt JSON document is successfully pinned. It follows the CIDv1 format and is approximately fifty-nine characters in the Base32 encoding. It is null until the receipt generation worker successfully uploads the receipt. It is stored on the invoice document so that the merchant dashboard and chat receipt link can construct the Pinata gateway URL for the receipt.

### The receiptUrl Field

This is an optional string field. It stores the full public URL to the receipt on the Pinata IPFS gateway, constructed by concatenating the Pinata gateway base URL with the CID. It is set at the same time as receiptCid and is a convenience field that avoids the frontend having to know the Pinata gateway URL structure.

### The receiptPending Field

This is an optional boolean field that defaults to undefined, meaning it is absent from documents that do not need it. It is set to true when the invoice reaches the confirmed status but the receipt generation worker fails all three of its retry attempts. It signals that the invoice is settled from a payment perspective but the IPFS receipt was not generated. A scheduled cleanup job is intended to check for documents with this flag and retry the Pinata upload. Because this is an exceptional condition, the field's absence from normal documents is preferable to a false value on every document.

### The refundTxHash Field

This is an optional string field. It stores the Cardano transaction hash of the refund transaction submitted by the customer after an invoice expires. It is only relevant for invoices that used the Aiken escrow contract rather than direct transfers. It is null in direct transfer mode and in all invoices that did not involve a customer locking funds in the contract. It is set by the backend when the customer triggers the refund flow.

### The refundedAt Field

This is an optional Date field. It stores the UTC timestamp at which the refund was processed. It is set alongside the refundTxHash field.

### The expiresAt Field

This is a required Date field. It stores the UTC timestamp at which this invoice will expire if it has not been paid. It is calculated at invoice creation time by adding the merchant's invoiceExpiry setting (in seconds) to the current timestamp. This field has a MongoDB TTL index configured with expireAfterSeconds set to zero, which causes MongoDB to automatically delete documents where this field is in the past. However, the TTL deletion is not relied upon for business logic — it is a housekeeping mechanism that removes very old expired documents from the collection. The invoice expiry state machine is driven by the BullMQ invoice-expiry job, which runs every sixty seconds and transitions the status field to expired. Document deletion by TTL happens asynchronously and may occur significantly after the business logic has already expired the invoice.

### The Automatic Timestamp Fields

createdAt and updatedAt are managed automatically by Mongoose.

---

## 7. MongoDB — Transaction Collection

### Collection Name and Purpose

The collection is named transactions. Each document represents one Cardano blockchain transaction that was submitted as payment for an invoice. It is a one-to-one companion to the invoice it pays, separated into its own collection to cleanly isolate blockchain state from business state and to enable atomic deduplication of transaction hash submissions using the unique index.

### The invoiceId Field

This is a required ObjectID field that references the invoices collection. It identifies which invoice this transaction is paying. It is indexed to support the lookup of a transaction by invoice identifier, which the receipt generation worker uses to fetch transaction details without a second query to the invoices collection.

### The txHash Field

This is a required string field that stores the sixty-four-character hexadecimal Cardano transaction hash. It has a unique index that acts as the deduplication guard for the entire payment submission pipeline. If the same transaction hash is submitted twice — for example because the customer's frontend retried the submission request — the second insert attempt fails with a MongoDB duplicate key error, which the submit endpoint catches and handles by returning the current invoice state to the client rather than throwing an error.

### The status Field

This is a required string field constrained to submitted, confirming, confirmed, and failed. It mirrors the invoice's status field for blockchain-specific states, providing a clean record of the transaction's on-chain lifecycle independent of the invoice's business lifecycle.

### The blockHeight Field

This is an optional integer field that stores the block height at which this transaction was included in a Cardano block. It is set when the confirmation polling worker first detects the transaction on-chain.

### The confirmations Field

This is an optional integer field that stores the most recently checked confirmation count.

### The submittedAt Field

This is a required Date field that stores the UTC timestamp at which the transaction hash was first registered in the system.

### The confirmedAt Field

This is an optional Date field that stores the UTC timestamp at which the transaction reached three or more block confirmations.

### The amountLovelaceVerified Field

This is an optional integer field. After the transaction is confirmed on-chain, the confirmation worker queries Blockfrost for the full transaction details and verifies that the amount sent to the invoice's payment address matches the invoice's amountLovelace field. The actual verified amount from Blockfrost is stored here. If this value differs from the invoice's amountLovelace, the confirmation worker flags the discrepancy and does not settle the invoice.

### The verificationResult Field

This is an optional string field constrained to amount-matched, amount-mismatch, and address-mismatch. It stores the result of the on-chain verification check performed by the confirmation worker.

---

## 8. MongoDB — Index Definitions & Rationale

### Users Collection Indexes

The unique index on firebaseUid is the most critical index in the entire system. The authentication middleware executes a findOne query on this field on every API request. Without this index, every API call would perform a full collection scan, making the system non-functional under any real load. This index must be created before any user document is inserted.

The sparse unique index on walletAddress exists because multiple wallet connection flows can be initiated concurrently in edge cases, and the unique constraint prevents two user documents from claiming the same Cardano address. The sparse nature means users without a connected wallet do not conflict with each other.

The sparse unique index on stakeAddress follows the same rationale as the wallet address index.

The sparse unique index on email prevents two accounts from using the same email address while allowing documents where email is absent to coexist without conflict.

The sparse unique index on phone follows the same rationale as the email index.

### Merchants Collection Indexes

The unique index on merchantId is required because merchantId values appear in QR codes printed on physical materials in the real world. A duplicate merchantId would cause two merchants' QR codes to resolve to the same chat room, which would be a catastrophic data integrity failure.

The unique index on userId ensures the one-to-one relationship between User and Merchant documents is enforced at the database level, not just at the application layer.

The index on paymentAddress supports the confirmation pipeline's address lookup pattern: given a Cardano address where a payment arrived, find the merchant who owns it and then look up their pending or submitted invoices.

### Invoices Collection Indexes

The unique index on invoiceId supports point lookups by the application-layer identifier. This is used by the transaction building endpoint, the submit endpoint, the receipt generation worker, and the dashboard's expanded row view.

The compound index on merchantId ascending, status ascending, and createdAt descending is the primary query serving the merchant dashboard's transaction history table. A merchant viewing their dashboard is filtered to their own merchant ID, optionally filtered by status, and ordered by most recent. This compound index allows MongoDB to satisfy all three conditions without a collection scan, regardless of how many total invoices exist in the collection.

The compound index on paymentAddress ascending and status ascending supports the confirmation pipeline's query pattern. When a transaction to a known Cardano address is detected, the pipeline needs to find the invoice for that address that is currently in submitted or confirming status. Without this index, the pipeline would scan the entire collection on each polling cycle.

The sparse unique index on txHash supports the deduplication check in the submit endpoint and provides fast point lookups when the confirmation worker needs to retrieve an invoice by its transaction hash.

The TTL index on expiresAt with expireAfterSeconds of zero is a housekeeping index, not a business logic index. It causes MongoDB to eventually delete documents where expiresAt has passed. The expiry state machine in BullMQ handles the business logic; this index handles storage cleanup.

### Transactions Collection Indexes

The unique index on txHash is the deduplication guard for the entire payment submission flow. It is the single most important index in this collection.

The index on invoiceId supports the receipt generation worker's lookup of a transaction by its associated invoice.

---

## 9. MongoDB — Validation Rules & Constraints

### Monetary Amount Validation

Every field storing an amount in paise or lovelace is validated by a Mongoose custom validator function that rejects non-integer values and negative values. The validator checks that the value passed through JavaScript's Number.isInteger function and returns true. If a floating-point value somehow reaches the storage layer — for example, if a calculation introduced a decimal due to a rounding error — the validator catches it before the write completes and throws a validation error. This validation is the final line of defense against floating-point monetary corruption.

### Cardano Address Validation

Every field storing a Cardano bech32 address is validated by a custom validator that checks the address against the network configuration. In preprod mode, valid enterprise addresses begin with addr-test1 and valid stake addresses begin with stake-test1. In mainnet mode, valid enterprise addresses begin with addr1 and valid stake addresses begin with stake1. An address from the wrong network is rejected immediately. This prevents a merchant who accidentally pastes their mainnet wallet address when the system is configured for preprod from creating broken invoices.

### Enum Field Validation

Every enum field uses Mongoose's built-in enum validator. Any attempt to set an enum field to a value outside the defined set causes a Mongoose validation error before any write reaches MongoDB. This includes the status field on invoices and transactions, the role field on users, the category field on merchants, and the onboardingStep field on users.

### Invoice Amount Bounds

The amountPaise field has a minimum value of one hundred enforced by the Mongoose min validator. The amountLovelace field has a minimum value of one million enforced by the same mechanism. Attempting to create an invoice below these minimums is rejected before any database interaction begins.

### Items Array Total Validation

When an invoice includes a items array, a Mongoose pre-save hook runs before each write and calculates the sum of qty multiplied by priceINR for each item in the array. If this sum does not equal the document's amountPaise field, the hook throws a validation error and prevents the write. This ensures the line items always add up to the invoice total, preventing inconsistent receipts.

### Merchant invoiceExpiry Bounds

The invoiceExpiry field on the Merchant document has a minimum of three hundred seconds and a maximum of one thousand eight hundred seconds, enforced by Mongoose min and max validators.

---

## 10. MongoDB — Pre-Save Hooks & Computed Fields

### The Snapshot Immutability Hook

A pre-save hook on the Invoice model checks whether the document already exists in the database (by checking whether it is new or not). If the document already exists and any snapshot field — specifically paymentAddress, amountPaise, amountLovelace, adaInrRate, or merchantId — has been modified, the hook throws an error and prevents the update. This enforces the invariant that snapshot fields are set once at creation and never changed, even if someone accidentally calls a save operation on an existing invoice after modifying these fields.

### The Status Transition Validation Hook

A pre-save hook on the Invoice model validates that any status change follows the allowed transition graph defined in Section 11. If the transition is invalid — for example, if someone attempts to set a settled invoice back to pending — the hook throws a validation error. This is the application-layer enforcement of the state machine; the Firebase and MongoDB writes are atomic with each other only at the application layer, not at the database layer, so this validation is critical.

### The merchantStringId Autofill Hook

A pre-save hook on the Invoice model checks whether the merchantStringId field is absent on a new document. If it is, the hook queries the Merchant collection by the merchantId ObjectID and copies the human-readable merchantId string onto the invoice document. This prevents the invoice creation service from having to manually remember to copy this field.

---

## 11. Invoice Status State Machine — Canonical Reference

### The Seven States

The invoice status field can hold exactly seven values. No other values are valid. No document should ever have a status value outside this set. The Mongoose enum validator enforces this at the database write layer, and the pre-save hook enforces that transitions follow the allowed graph.

Pending is the initial state assigned at invoice creation. The invoice has been created, the payment request has been sent to Firebase if a chat room was specified, and the expiry timer is running. The invoice remains pending until one of two things happens: the customer submits a transaction hash, which moves it to submitted, or the expiry timestamp passes without any transaction, which moves it to expired.

Submitted means the customer has submitted a signed Cardano transaction and the backend has received the transaction hash. The hash is stored on the document and on the Transaction record. A BullMQ confirmation polling job has been enqueued. The payment has left the customer's wallet in the sense that the transaction is broadcast, but it may still be rejected by the mempool or drop from network propagation. The invoice transitions from submitted to confirming when the transaction is first detected on-chain, or to failed when the polling window of approximately twenty minutes is exhausted.

Confirming means the transaction has been included in at least one Cardano block. The block height has been recorded on the invoice. The confirmation polling job is still running, but at a reduced frequency of once every sixty seconds instead of once every twenty seconds. The invoice transitions from confirming to confirmed when the confirmation count reaches three.

Confirmed means the transaction has at least three block confirmations, which ZeroPay defines as financial finality. For high-value invoices above the five-hundred-USD threshold, six confirmations are required before this transition occurs. The confirmed state is transient — upon detection, the backend immediately enqueues the receipt generation and notification dispatch jobs and the invoice is expected to transition to settled within minutes.

Settled is the terminal success state. The IPFS receipt has been generated and its CID stored on the invoice document. The merchant's totalReceived and totalOrders fields have been incremented. Both parties have received push notifications. The receipt message has been written to the Firebase chat room. A settled invoice document is never modified again.

Expired means the invoice's expiresAt timestamp passed while the invoice was in the pending state. No transaction was ever submitted. If a customer had seen the payment request card before it expired, the card now shows the expired visual state. If the merchant created the invoice in a chat room, a system message has been written to the chat. Both parties have received expiry push notifications if they had FCM tokens. An expired invoice is never modified again, except in the refund flow for escrow contract invoices.

Failed means a transaction was submitted and a hash was registered, but the confirmation polling job exhausted all sixty retry attempts — approximately twenty minutes — without detecting the transaction on-chain. This can happen if the transaction's time-to-live expired in the mempool, if it was rejected by node validation, or if a brief chain reorganization affected the transaction. In all these cases, the customer's UTXO was never spent and their ADA is safe. Both parties have received failure push notifications. A failed invoice is never modified again, except in the refund flow for escrow contract invoices.

### The Allowed Transition Graph

Pending can transition to submitted when the customer submits a transaction hash. Pending can transition to expired when the expiry job detects the timestamp has passed, or when the merchant manually cancels the invoice. No other transitions out of pending are permitted.

Submitted can transition to confirming when the polling worker first detects the transaction in a Cardano block. Submitted can transition to failed when the polling worker exhausts all retry attempts. No other transitions out of submitted are permitted. Submitted cannot transition back to pending, cannot transition to expired, and cannot transition directly to settled.

Confirming can transition to confirmed when the polling worker detects three or more block confirmations. Confirming can transition to failed in the event of a chain rollback that removes the transaction from the chain — this is extremely rare but must be handled. No other transitions out of confirming are permitted.

Confirmed can only transition to settled when the post-confirmation pipeline completes. Confirmed cannot transition to any other state.

Settled is a terminal state. No transitions out of settled are possible.

Expired is a terminal state. No transitions out of expired are possible, except the refund flow marks the refundTxHash and refundedAt fields without changing the status.

Failed is a terminal state. No transitions out of failed are possible, except the refund flow adds the refund fields without changing the status.

### Concurrent Transition Safety

The MongoDB update operations that change the invoice status use a query filter that includes the expected current status. For example, the operation that transitions from confirming to confirmed only updates documents where the status is currently confirming. If two worker processes simultaneously try to transition the same invoice, one will find the document and succeed, and the other will find that the document no longer matches the confirming status filter and will match zero documents. No error is thrown; the second worker simply detects that zero documents were updated and exits cleanly. This is an optimistic locking pattern that prevents race conditions without database-level locks.

---

## 12. Firebase Realtime Database — Top-Level Structure

### Database Region and Initialization

The Firebase Realtime Database is provisioned in the ap-south-1 Mumbai region to minimize latency for Indian users. The backend accesses it exclusively through the Firebase Admin SDK, which is initialized using the service account JSON stored as an environment variable. The frontend accesses it through the Firebase Web SDK v9's modular API. The Admin SDK bypasses all security rules — every write from the backend is authoritative. The Web SDK is subject to security rules on every read and write.

### The Flat Structure Principle

The database follows a deliberately flat structure with no more than four levels of nesting. Deep nesting in Firebase Realtime Database causes every read of a parent node to download all descendants, making deeply nested structures expensive. The four top-level keys in the database are presence, chatrooms, and invoices. Each is accessed independently, and no feature reads from more than one top-level key in a single Firebase operation.

### Top-Level Key Overview

The presence key contains one node per user, keyed by the user's Firebase UID. Each node contains the user's online status and last-seen timestamp, maintained by the Firebase client SDK's connection state listeners and onDisconnect handlers. It is written by the frontend and read by the frontend; the backend never writes to the presence path.

The chatrooms key contains one node per chat room, keyed by the deterministic room identifier. Each room node contains room metadata and a messages sub-key containing the room's message history. The backend writes to chatrooms via the Admin SDK when a payment event occurs. The frontend reads from chatrooms using listener registrations.

The invoices key contains a flat list of invoice status nodes, each keyed by invoiceId. Each node contains a single value: the current status string of that invoice. The backend writes to this path every time an invoice status changes. The frontend registers onValue listeners on specific invoiceId paths to receive real-time status updates for displayed payment cards.

---

## 13. Firebase — Presence Node Schema

### Path Pattern

The path to a user's presence node is presence followed by a forward slash and the user's Firebase UID. The UID is the same string value stored in the firebaseUid field on the User document in MongoDB.

### Fields Within the Presence Node

The online field is a boolean. It is set to true when the user's Firebase connection is active and set to false via an onDisconnect handler when the connection is lost. Firebase guarantees that onDisconnect operations execute even if the client disconnects uncleanly.

The lastSeen field is a server timestamp value generated by Firebase's serverTimestamp function. It is updated whenever the online field changes. The frontend uses the lastSeen value to determine whether to show the green online status dot next to a user's avatar in the chat room list and chat room header — a user is considered online if their lastSeen timestamp is within the last five minutes, even if their online field is currently false due to a network hiccup.

---

## 14. Firebase — ChatRoom Node Schema

### Path Pattern

The path to a chat room's metadata node is chatrooms followed by a forward slash and the room identifier. The room identifier follows the format room- followed by the first sixteen characters of the SHA-256 hex digest computed from the concatenation of the customer's Firebase UID and the merchant's merchantId ObjectID string, separated by a colon character.

### Room Identifier Derivation

The two inputs to the room ID hash are always sorted lexicographically before concatenation, ensuring the same two users always generate the same room ID regardless of which party initiates the room creation. The sorting step is critical — without it, the same merchant-customer pair could create two separate rooms depending on who scanned whose QR code first.

### Fields Within the ChatRoom Node

The merchantId field is a string storing the human-readable merchant identifier such as MC-0042. It is stored here so that the chat room list can display the merchant's identity without a backend API call — the frontend reads this directly from Firebase.

The customerId field is a string storing the customer's Firebase UID. It parallels the merchantId field for the customer's identity.

The participants field is an object where each key is a Firebase UID and each value is the boolean true. This structure is optimized for Firebase's security rules, which check whether a specific UID is a key in this object using the rules data.child function. The set of keys in this object is always exactly two values: the merchant's Firebase UID and the customer's Firebase UID.

The lastMessage field is an embedded object with two subfields: the preview string, which is the first fifty characters of the most recent message content, and the timestamp number, which is the Firebase server timestamp of the most recent message. Both are updated by the backend whenever a message is written to the room.

The lastUpdated field is a Firebase server timestamp. It is updated on every message write and is used by the frontend to sort the chat room list by recency.

The unreadCounts field is an object where each key is a Firebase UID and each value is an integer representing the number of unread messages for that user. The backend increments the count for the recipient of each new message and the frontend resets the count to zero when the user opens the room.

---

## 15. Firebase — Messages Node Schema

### Path Pattern

The path to the messages sub-collection of a chat room is chatrooms, followed by the room identifier, followed by messages. Individual message nodes sit at chatrooms, room identifier, messages, and then the Firebase push key.

### The Push Key

Every message is stored under an automatically generated Firebase push key. Firebase push keys are lexicographically sortable by creation time, which means messages stored under push keys are naturally ordered chronologically when retrieved with the Firebase orderByKey query. The push key format is a twenty-character string beginning with a time-based component and ending with a random component for uniqueness.

### Fields Common to All Message Types

Every message node has a senderId field, a type field, and a timestamp field. The senderId is the Firebase UID of the user or system entity that created the message. For messages created by the backend Admin SDK — such as payment request messages and system status messages — the senderId is a special constant such as system to distinguish them from user-sent messages. The type field is a string constrained to the values text, payment-request, payment-submitted, receipt, refund, and system. The timestamp field is a Firebase server timestamp number representing the creation time in milliseconds since the Unix epoch.

### Fields Varying by Message Type

Each message type carries a different set of additional fields alongside the three common fields. The complete specifications for each type's payload are defined in Section 16 of this document.

### Message Pagination and Ordering

The frontend loads the fifty most recent messages on initial chat room load using Firebase's limitToLast query modifier. Older messages are loaded as the user scrolls up, using the endBefore modifier with the push key of the oldest currently displayed message. This cursor-based pagination approach avoids page numbers and handles the continuous arrival of new messages gracefully.

---

## 16. Firebase — Message Type Payload Specifications

### The text Message Payload

A text message has the three common fields plus one additional field. The content field is a string containing the message text typed by the user. Maximum display length in the UI is unlimited, but the Firebase security rules reject text messages longer than two thousand characters to prevent abuse. The content is stored exactly as typed, with no server-side modification or sanitization, because Firebase security rules handle the maximum length check.

### The payment-request Message Payload

A payment-request message is written exclusively by the backend Admin SDK, never by a client. It contains the three common fields plus a payload embedded object. The payload object contains the following fields: invoiceId is the application-layer invoice identifier string. amountPaise is the invoice amount as an integer in paise. amountLovelace is the invoice amount as an integer in lovelace. adaInrRate is the exchange rate used as a floating-point number. description is the optional description string. items is an array of item sub-objects, each with name, qty, and priceINR fields. expiresAt is the expiry timestamp as a milliseconds-since-epoch integer. This payload is included directly in the message so that the frontend can render the full payment request card without making an API call to the backend — the entire invoice's display information is embedded in the Firebase message.

### The payment-submitted Message Payload

A payment-submitted message is written by the backend after the customer's transaction hash is registered. Its payload object contains the invoiceId string and the txHash string — the sixty-four-character hexadecimal transaction hash. The frontend uses these to display the processing state of the payment card, including the truncated tx hash and the tappable link to the Cardano explorer.

### The receipt Message Payload

A receipt message is written by the receipt generation BullMQ worker after an invoice settles. Its payload object contains the invoiceId string, the receiptCid string, and the receiptUrl string — the full public Pinata gateway URL. The frontend uses these to display the receipt link in the chat.

### The refund Message Payload

A refund message is written by the backend after the customer successfully claims a refund from the Aiken escrow contract. Its payload contains the invoiceId string, the refundTxHash string, and the amountLovelace integer representing the amount returned to the customer.

### The system Message Payload

A system message is written by the backend to communicate automated state changes that do not fit any other category — for example, when an invoice expires, when a new customer joins a room for the first time, or when a payment failure is detected. Its payload contains a text field with the human-readable system announcement string, such as "Payment request expired." System messages are rendered centered in the chat with a distinct visual style, not aligned as a bubble.

---

## 17. Firebase — Invoice Status Node Schema

### Path Pattern

The path to an invoice's status node is invoices followed by the invoiceId. The value at this path is a primitive string — not an object. It holds exactly the status string that the Invoice document in MongoDB holds for the same invoice.

### Why This Node Exists

This node is the real-time bridge between the backend job queue and the frontend. When the BullMQ confirmation polling worker transitions an invoice's status in MongoDB, it immediately writes the new status string to this Firebase path using the Admin SDK. The frontend registers a Firebase onValue listener on this specific path when a payment request card is displayed. When the value changes — as it will, from pending to submitted to confirming to confirmed to settled — Firebase pushes the update to all connected clients listening to this path within milliseconds. The frontend's payment card re-renders with the new status without any polling, any API call, or any page refresh.

### Listener Cleanup

The frontend unregisters the onValue listener for a given invoice's status path when either the payment card is no longer rendered or when the status reaches a terminal value of settled, expired, or failed. Failure to unregister listeners is the most common source of Firebase bandwidth consumption leaks. Every listener registration must be paired with a cleanup call.

---

## 18. Firebase — Security Rules Specification

### The Foundational Rule

No unauthenticated access is permitted to any path in the database. Every read and write attempted by an unauthenticated client is rejected. This is enforced by checking whether the request's auth variable is non-null as the outermost condition in the rules hierarchy.

### Presence Rules

A user may read any other user's presence node only if they share at least one chat room. In practice, the rules check whether the requesting user's UID appears in the participants map of any chat room that also contains the target user's UID. A user may write only to their own presence node — the path must end with their own Firebase UID.

### ChatRoom Metadata Rules

A user may read a chatroom node only if their UID is a key in that room's participants map. A user may write to the lastMessage or unreadCounts fields of a chatroom only from within a defined set of message dispatch operations. No direct writes to the participants, merchantId, or customerId fields are permitted from client-side code — these can only be set by the Admin SDK when the backend creates the room.

### Messages Rules

A user may read messages from a chatroom only if their UID is in the participants map of that room. A user may create new messages in a chatroom only under strict conditions: the message type must be text, the senderId must match the authenticated user's UID, and the content must be under two thousand characters. Any attempt to write a message with a type of payment-request, payment-submitted, receipt, refund, or system is rejected for regular users — only the Admin SDK service account, which bypasses rules, can write these message types.

### Invoice Status Rules

A user may read an invoice's status node only if their UID matches either the customer or merchant associated with that invoice. Because Firebase rules cannot directly join across database paths to MongoDB, this check is implemented by reading the chatroom node associated with the invoice and verifying the requesting user's presence in the participants map. A user may never write to any invoice status path — only the Admin SDK can write here.

---

## 19. Firebase — Listener Registration Map

### When Listeners Are Registered and Why

The frontend registers Firebase listeners at specific lifecycle points and must deregister them at the corresponding cleanup points. This section documents every listener in the system so that developers know exactly when Firebase connections are active.

The chat list screen registers a listener on the chatrooms collection filtered to rooms where the current user's UID is a key in the participants map. This listener uses Firebase's orderByChild and equalTo query to filter efficiently. It fires on initial load and on every subsequent update to any room the user is part of, enabling the unread count badge and last message preview to update in real time.

The chat room screen registers two listeners when it mounts. The first is a limitToLast query on the room's messages sub-collection, which delivers the fifty most recent messages on mount. The second is a childAdded listener that fires for every new message appended to the room after the initial load. Both listeners are deregistered when the chat room screen unmounts.

The payment request card component registers an onValue listener on the specific invoice's status path at invoices slash invoiceId. This listener fires immediately with the current status on registration and fires again on every subsequent status change. It is deregistered when the card unmounts or when the status reaches settled, expired, or failed.

The dashboard screen registers onValue listeners on the status paths of all invoices currently in submitted or confirming status, as fetched from MongoDB on dashboard load. This allows the status badges in the transaction table to update in real time while the merchant watches.

The counter checkout QR screen registers a single onValue listener on the invoice status path for the invoice generated when the merchant tapped Generate Bill. This listener watches for the confirmed status and triggers the full-screen green confirmation animation when it arrives.

---

## 20. Redis — Client Architecture & Naming Conventions

### Two Separate Clients for Two Separate Purposes

The application uses two independent Redis client instances, each initialized separately and used for mutually exclusive purposes. They are never interchangeable.

The first client, referred to as the cache client, uses the Upstash Redis HTTP client library. It communicates with Upstash over HTTPS using the REST API. It does not maintain a persistent TCP connection. It is stateless between requests and works correctly in environments where persistent TCP connections are unavailable or expensive. It handles all caching operations: the price oracle cache, the merchant profile cache, and the daily stats cache.

The second client, referred to as the queue client, uses the ioredis library configured to connect to Upstash via the rediss TLS connection string. It maintains a persistent TCP connection. BullMQ requires this persistent connection for its Lua scripting, pub-sub messaging, and blocking pop operations. It handles only the BullMQ job queue backing store. It does not cache anything.

### Key Naming Convention

All Redis keys follow the pattern of service colon entity colon identifier. The service segment names the application component responsible for the key, such as price, merchant, stats, or ratelimit. The entity segment names the type of data, such as ada-inr, profile, daily, auth, or invoice. The identifier segment is the specific value that distinguishes this key from others of the same entity type, such as a merchantId, a user ID, or an IP address. This three-segment hierarchy makes the key space self-documenting and enables prefix-based pattern operations for bulk invalidation.

---

## 21. Redis — Cache Key Registry

### The price:ada-inr Key

This key stores the primary ADA/INR exchange rate fetched from CoinGecko. Its value is a JSON string containing adaInr as a floating-point number and adaUsd as a floating-point number and fetchedAt as an ISO 8601 UTC timestamp string. Time-to-live is sixty seconds. When the cache client reads this key and it does not exist, it fetches fresh data from CoinGecko, stores the result at this key with a sixty-second TTL, and returns the data. This key is the reason the system makes at most one CoinGecko API call per minute regardless of invoice creation volume.

### The price:ada-inr:last-known Key

This key stores the most recent successfully fetched ADA/INR rate with no TTL — it persists indefinitely. It is overwritten every time the price:ada-inr key is refreshed. When CoinGecko is unreachable and the price:ada-inr key has expired, the oracle falls back to this key and returns the last known rate with a stale:true flag and a staleBySeconds value. This key guarantees that the price oracle always has something to return, even during CoinGecko outages.

### The merchant:profile:{merchantId} Keys

These keys cache the full merchant profile object for a given human-readable merchantId such as MC-0042. The value is a JSON string containing shopName, category, paymentAddress, and merchantId. Time-to-live is five minutes. This key is populated when a customer scans a merchant's QR code and the backend resolves the merchant profile. Without this cache, every QR scan would hit MongoDB. With it, the MongoDB query only runs once per five minutes per merchant, regardless of how many customers scan their QR in that window.

### The stats:daily:{merchantId}:{date} Keys

These keys cache a merchant's pre-computed daily revenue totals for a specific date. The date format is YYYY-MM-DD in UTC. The value is a JSON string containing totalPaise as an integer representing the day's total revenue in paise, settledCount as an integer representing the number of settled invoices, and computedAt as an ISO 8601 UTC timestamp. Time-to-live is twenty-five hours, slightly more than a full day, ensuring the cache is never empty between the nightly scheduled computation runs. The daily stats scheduler computes these values at midnight UTC for each active merchant and writes them to these keys. The dashboard chart endpoint reads from these keys rather than running a MongoDB aggregation.

---

## 22. Redis — Rate Limit Key Registry

### The ratelimit:auth:{ip} Keys

These keys count authentication-related requests from a specific IP address within a one-minute sliding window. The value is an integer counter. The key is set with a sixty-second TTL when first created, and the counter is incremented atomically on each request. If the counter exceeds ten, the request is rejected with HTTP 429. The IP address in the key is the X-Forwarded-For header value, which Render populates with the client's real IP address.

### The ratelimit:invoice:{userId} Keys

These keys count invoice creation requests from a specific authenticated user within a one-hour sliding window. The value is an integer counter. The key is set with a three-thousand-six-hundred-second TTL when first created. If the counter exceeds thirty, the request is rejected with HTTP 429. The userId in the key is the MongoDB ObjectID of the authenticated user document.

### The ratelimit:payment:{userId} Keys

These keys count payment submission requests from a specific authenticated user within a ten-minute sliding window. The value is an integer counter. The key is set with a six-hundred-second TTL. If the counter exceeds ten, the request is rejected with HTTP 429.

### The ratelimit:wallet:{userId} Keys

These keys count wallet registration requests from a specific authenticated user within a one-minute sliding window. The value is an integer counter. If the counter exceeds five, the request is rejected with HTTP 429.

---

## 23. Redis — Stored Value Shape Specifications

### Price Cache Value Shape

The JSON object stored at the price cache keys has two numeric fields and one string field. The adaInr field is a floating-point number representing how many Indian Rupees one ADA is worth at the time of fetch. The adaUsd field is a floating-point number representing how many US Dollars one ADA is worth. The fetchedAt field is an ISO 8601 UTC timestamp string representing the exact moment when the CoinGecko API response was received and cached.

### Merchant Profile Cache Value Shape

The JSON object stored at the merchant profile cache keys has four fields. The merchantId field is the human-readable MC-XXXX string. The shopName field is the merchant's display name string. The category field is one of the five category enum strings. The paymentAddress field is the Cardano bech32 enterprise address.

### Daily Stats Cache Value Shape

The JSON object stored at the daily stats keys has three fields. The totalPaise field is an integer representing the sum of all settled invoices' amountPaise values for that merchant on that date. The settledCount field is an integer representing the number of invoices settled on that date. The computedAt field is an ISO 8601 UTC timestamp of when the scheduler computed these values.

---

## 24. BullMQ — Queue Registry & Configuration

### Queue: tx-confirmation

This queue contains one job per submitted invoice that needs confirmation polling. Jobs are added by the payment submission endpoint handler immediately after updating the invoice status to submitted in MongoDB. Each job carries a twenty-second delay before its first execution, matching Cardano's approximate block time. The queue is configured with a maximum of sixty attempts per job, a fixed twenty-second backoff between attempts while the invoice is in submitted status, and a fixed sixty-second backoff between attempts once the invoice is in confirming status. Worker concurrency is set to ten — meaning up to ten invoices can be polled simultaneously. Completed jobs are retained for the most recent one hundred completions. Failed jobs are retained for the most recent five hundred failures, enabling post-incident investigation.

### Queue: receipt-generation

This queue contains one job per invoice that has just reached the confirmed status. Jobs are enqueued by the confirmation polling worker immediately upon detecting three-or-more confirmations. The queue is configured with a maximum of three attempts per job and a thirty-second exponential backoff between attempts. Worker concurrency is set to ten, matching the confirmation queue. This queue's failure does not block invoice settlement — the invoice transitions to settled even if the receipt cannot be generated, with the receiptPending flag set on the invoice document.

### Queue: notification-dispatch

This queue handles push notification delivery for payment events. Jobs are enqueued by both the confirmation polling worker on confirmation detection and the invoice expiry worker on expiry detection. The queue is configured with a maximum of three attempts per job, an immediate first retry, and a five-second backoff on the second retry. Worker concurrency is ten. Notification failures do not affect invoice status in any way.

### Queue: invoice-expiry

This queue contains a single repeatable job that runs on a sixty-second interval, established at application startup. Unlike the other queues, there is no per-invoice job — there is one batch job that queries MongoDB for all expired pending invoices in a single pass. Worker concurrency is one because this is a batch operation. The job should be idempotent — running it twice within the same sixty-second window should have no effect beyond the first run, because the MongoDB update uses the query condition status equals pending AND expiresAt is less than the current time.

### Queue: daily-stats

This queue contains a repeatable job that runs once at midnight UTC each day. It iterates over all active merchant documents and for each one, computes the past seven days' daily revenue totals from the MongoDB invoices collection, then writes the results to the Redis stats cache keys with twenty-five-hour TTLs. Worker concurrency is one because this job is not time-sensitive and running it sequentially over all merchants is acceptable given its once-daily schedule.

---

## 25. BullMQ — Job Payload Specifications

### tx-confirmation Job Payload

The payload for a tx-confirmation job contains two fields. The invoiceId field is the MongoDB ObjectID string of the invoice being polled. The txHash field is the sixty-four-character hexadecimal Cardano transaction hash to look up on Blockfrost or Koios. Both fields are required. The worker uses the invoiceId to fetch the current invoice state from MongoDB before each poll to verify that the invoice is still in a pollable status — if another process has already settled or failed the invoice, the worker exits cleanly without making blockchain API calls.

### receipt-generation Job Payload

The payload contains one field. The invoiceId field is the MongoDB ObjectID string of the invoice for which to generate a receipt. The worker fetches the full invoice document and its associated merchant and user documents from MongoDB to construct the receipt JSON.

### notification-dispatch Job Payload

The payload contains three fields. The invoiceId field is the MongoDB ObjectID string of the relevant invoice. The notificationType field is a string specifying which notification template to use — valid values are payment-submitted, payment-confirmed, invoice-expired, and payment-failed. The recipients field is an array of strings, each being a Firebase UID — the worker uses these UIDs to look up FCM tokens from the users collection.

### invoice-expiry Job Payload

The repeatable invoice-expiry job has no custom payload. BullMQ provides the job's own identifier and creation timestamp in the job metadata, but the worker logic does not depend on any payload values — it queries MongoDB directly for all expired invoices.

---

## 26. BullMQ — Job Lifecycle & Failure Handling

### The Failed Job Event

When a tx-confirmation job exhausts all sixty retry attempts, BullMQ emits a failed event. The tx-confirmation worker registers a listener on this event that executes the invoice failure pipeline: updating the invoice status to failed in MongoDB, writing the failed status to the Firebase invoice status path, writing a system message to the Firebase chat room if the invoice had a chat room ID, and enqueuing a notification-dispatch job for failure notifications. This listener is registered when the worker is initialized at application startup.

### Receipt Failure Handling

When a receipt-generation job fails all three attempts, the worker's error handler sets the receiptPending field to true on the invoice document. The invoice's status remains settled — the payment is final regardless of receipt generation success. The daily-stats scheduler includes a secondary task that queries for invoices with receiptPending set to true and re-enqueues receipt-generation jobs for them, providing an eventual consistency recovery path.

### The removeOnComplete and removeOnFail Configuration

Completed jobs are removed from the BullMQ Redis storage after the one hundred most recent completions, to prevent unlimited Redis memory growth. Failed jobs are retained for the five hundred most recent failures to enable debugging. These numbers are tuned for the Upstash Redis free tier's ten-thousand-command-per-day limit — retaining too many job records would consume commands on every worker heartbeat.

---

## 27. API — Standard Envelope Contract

### Success Response Envelope

Every successful API response has the same outer structure regardless of which endpoint produced it. The outermost object has two fields. The success field is always the boolean true. The data field contains the endpoint-specific result — it may be an object, an array, or a primitive value depending on the endpoint. HTTP status codes are used semantically: 200 for successful reads and updates, 201 for successful creates, and 202 for accepted-but-processing responses such as the payment submission endpoint.

### Error Response Envelope

Every error response has a consistent structure. The success field is always the boolean false. The error field is a human-readable string describing what went wrong, suitable for display to the user or logging. The code field is a machine-readable error identifier in SCREAMING-SNAKE-CASE, from the registry defined in Section 30. The optional details field may contain structured additional information useful to developers — for example, for validation errors it contains an array of objects describing which field failed and why.

### Authentication Header

Every protected endpoint expects the Firebase ID token in the Authorization header using the Bearer scheme. The header value is the word Bearer followed by a space followed by the Firebase ID token string. Requests that are missing this header, have a malformed header, or carry an expired or invalid token receive HTTP 401 with the error code AUTH-INVALID-TOKEN.

---

## 28. API — Request Body Schemas by Endpoint

### POST /api/v1/users/register

This endpoint is called automatically after Firebase authentication succeeds. The request body is empty — no fields are required. All user identity information is derived from the Firebase ID token. The backend creates the User document using the firebaseUid from the decoded token.

### PATCH /api/v1/users/role

The request body has one required field. The role field is a string constrained to the values customer, merchant, and both.

### PATCH /api/v1/users/me

The request body has one optional field. The displayName field is a string with a minimum length of one character and a maximum of sixty characters.

### POST /api/v1/users/wallet

The request body has two required fields. The walletAddress field is a Cardano bech32 enterprise address string. The stakeAddress field is a Cardano bech32 stake address string.

### PATCH /api/v1/users/wallet

The request body has two fields, both of which may be null. Setting walletAddress to null disconnects the user's wallet. This endpoint is used when the user explicitly disconnects from the Wallet Settings screen.

### POST /api/v1/users/fcm-token

The request body has one required field. The fcmToken field is the Firebase Cloud Messaging registration token string for the current device.

### PATCH /api/v1/users/notifications

The request body is an object with up to three optional boolean fields matching the notificationPreferences sub-document schema: paymentReceived, paymentConfirmed, and invoiceExpired.

### POST /api/v1/merchants/create

The request body has two required fields. The shopName field is a string with a maximum length of fifty characters. The category field is a string constrained to the five category enum values.

### POST /api/v1/merchants/wallet

The request body has two required fields. The walletAddress field is a Cardano bech32 enterprise address string. The stakeAddress field is a Cardano bech32 stake address string.

### PUT /api/v1/merchants/settings

The request body has three optional fields, at least one of which must be present. The shopName field is a string with a maximum length of fifty characters. The category field is a category enum string. The invoiceExpiry field is an integer between three hundred and one thousand eight hundred.

### POST /api/v1/invoices/create

The request body has two required fields and two optional fields. The amountPaise field is a required positive integer representing the invoice amount in paise. The chatRoomId field is an optional string representing the Firebase room identifier — when present, a payment-request message is written to that room. The description field is an optional string with a maximum length of one hundred and forty characters. The items field is an optional array of item objects, each requiring name as a string, qty as a positive integer, and priceINR as a positive integer in paise.

### PUT /api/v1/invoices/{invoiceId}/expire

This endpoint has no request body. The invoiceId is provided in the URL path. The backend validates that the invoice is in pending status and that the requesting user is the merchant who created it before transitioning the status to expired.

### POST /api/v1/payments/build-tx

The request body has one required field. The invoiceId field is the application-layer invoice identifier string. The backend validates the invoice status is pending and the expiry has not passed, then returns the unsigned transaction CBOR.

### POST /api/v1/payments/submit

The request body has two required fields. The invoiceId field is the invoice identifier string. The txHash field is the sixty-four-character hexadecimal transaction hash returned by the Cardano network after the wallet broadcast the transaction.

### POST /api/v1/payments/build-refund-tx

The request body has one required field. The invoiceId field is the invoice identifier for which to build a refund transaction. The invoice must be in expired or failed status and must have an associated contract UTXO on-chain.

### POST /api/v1/chat/room

The request body has one required field. The merchantId field is the human-readable MC-XXXX merchant identifier. The backend derives the room ID deterministically from the authenticated customer's UID and the merchant's MongoDB ObjectID, creates the room in Firebase if it does not already exist, and returns the room identifier.

---

## 29. API — Response Body Schemas by Endpoint

### User Object Response Shape

The user response object contains the MongoDB document ID as id, the firebaseUid string, the role string, the optional phone string, the optional email string, the displayName string, the optional walletAddress string, the optional stakeAddress string, the notificationPreferences object with its three boolean fields, the isVerified boolean, the onboardingStep string, the lastSeen ISO 8601 timestamp string, the createdAt ISO 8601 timestamp string, and the updatedAt ISO 8601 timestamp string.

### Merchant Object Response Shape

The merchant response object contains the MongoDB document ID as id, the userId ObjectID string, the merchantId human-readable string, the shopName string, the category string, the optional paymentAddress string, the optional stakeAddress string, the invoiceExpiry integer, the totalReceived lovelace integer, the totalOrders integer, the isActive boolean, the createdAt timestamp string, and the updatedAt timestamp string.

### Invoice Object Response Shape

The invoice response object contains the MongoDB document ID as id, the invoiceId string, the merchantId ObjectID string, the merchantStringId human-readable string, the optional customerId ObjectID string, the optional chatRoomId string, the amountPaise integer, the amountLovelace integer, the adaInrRate floating-point number, the adaUsdRate floating-point number, the paymentAddress string, the optional description string, the items array, the status string, the optional txHash string, the optional blockHeight integer, the optional confirmations integer, the optional confirmedAt timestamp string, the optional settledAt timestamp string, the optional receiptCid string, the optional receiptUrl string, the expiresAt ISO 8601 timestamp string, the createdAt timestamp string, and the updatedAt timestamp string.

### Build Transaction Response Shape

The build-tx endpoint returns a single field inside the data envelope. The unsignedCbor field is a hexadecimal string containing the unsigned Cardano transaction in CBOR encoding. The frontend passes this value directly to the wallet extension's signTx method.

### Submit Transaction Response Shape

The submit endpoint returns HTTP 202 with the current invoice object inside the data envelope. The status will be submitted at the time of the response.

### Price Oracle Response Shape

The price endpoint returns an object with four fields. The adaInr field is a floating-point number. The adaUsd field is a floating-point number. The fetchedAt field is an ISO 8601 timestamp string of when the data was cached. The stale field is a boolean — true if the response is serving from the last-known fallback cache because CoinGecko was unreachable.

### Health Check Response Shape

The health endpoint returns an object with five fields, each representing the status of a dependency. The database field, the redis field, the firebase field, the blockfrost field, and the overall field each hold a string of either healthy or degraded. The overall field is healthy only if all individual dependency fields are healthy.

---

## 30. API — Error Code Registry

### Authentication Errors

AUTH-MISSING-TOKEN is returned when the Authorization header is absent or does not follow the Bearer scheme format.

AUTH-INVALID-TOKEN is returned when the Firebase ID token signature verification fails, the token is expired, or the token has been revoked.

AUTH-INSUFFICIENT-ROLE is returned when the authenticated user does not have the role required by the endpoint — for example, when a customer-role user attempts to create an invoice, which requires the merchant role.

### Validation Errors

VALIDATION-ERROR is the general validation error returned when the Zod schema rejects the request body. The details field in the error envelope contains an array of objects, each with a path array identifying the failing field and a message string describing the constraint that was violated.

INVALID-CARDANO-ADDRESS is returned when a Cardano address field fails bech32 format validation or network mismatch detection.

INVALID-AMOUNT is returned when a monetary amount field fails the integer, minimum, or maximum constraints.

### Invoice Errors

INVOICE-NOT-FOUND is returned when the invoiceId provided does not match any document in the invoices collection.

INVOICE-WRONG-STATUS is returned when an operation is attempted on an invoice whose current status does not permit that operation. The details field contains the invoice's current status and the list of statuses that would have been acceptable.

INVOICE-EXPIRED is returned specifically when a customer attempts to build or submit a payment for an invoice whose status is expired or whose expiresAt timestamp is in the past.

INVOICE-ALREADY-PAID is returned when a customer attempts to build a transaction for an invoice that is already in submitted, confirming, confirmed, or settled status.

### Merchant Errors

MERCHANT-NOT-FOUND is returned when the merchantId provided in a QR scan resolution or chat room creation request does not match any document in the merchants collection.

MERCHANT-NO-WALLET is returned when a merchant attempts to create an invoice but their paymentAddress field is null — meaning they have not connected a wallet.

MERCHANT-INACTIVE is returned when a merchant attempts to create an invoice but their isActive field is false.

### Payment Errors

PAYMENT-BUILD-FAILED is returned when the MeshJS transaction builder fails to construct a valid unsigned transaction — for example, because the invoice's lovelace amount is below the network minimum UTXO.

PAYMENT-DOUBLE-SUBMIT is returned when a txHash is submitted for an invoice that already has a different txHash registered. This would indicate either a race condition or a deliberate duplicate submission attempt.

REFUND-NO-CONTRACT-UTXO is returned when the customer attempts to initiate a refund but the backend cannot find the expected UTXO at the Aiken contract address using the invoice's datum.

### System Errors

INTERNAL-ERROR is the generic catch-all for unhandled server exceptions. It is accompanied by HTTP 500. The message in the error envelope is a generic user-facing string, and the actual exception is logged to Sentry with full context.

RATE-LIMITED is returned when any rate limit is exceeded. The details field contains the limit type, the limit count, and the window duration in seconds.

SERVICE-UNAVAILABLE is returned when a critical dependency such as MongoDB is unreachable and the request cannot be completed.

---

## 31. Shared TypeScript Types — Canonical Definitions

### What Lives in shared-types

The shared-types package contains TypeScript interface and type definitions that are used by both the backend and the frontend applications. Every type defined here is derived directly from this schema document. No type is invented independently in either the frontend or the backend — both must reference this package.

The InvoiceStatus type is a union of seven string literals: pending, submitted, confirming, confirmed, settled, expired, and failed. This type is used in the Mongoose schema's enum validator, in the Zod request body schemas, in the BullMQ worker payloads, and in the React component props that render payment cards.

The MerchantCategory type is a union of five string literals: food, retail, services, vendor, and other.

The UserRole type is a union of three string literals: customer, merchant, and both.

The OnboardingStep type is a union of five string literals matching the onboardingStep field's allowed values.

The NotificationType type is a union of four string literals: payment-submitted, payment-confirmed, invoice-expired, and payment-failed.

The MessageType type is a union of six string literals: text, payment-request, payment-submitted, receipt, refund, and system.

The ApiResponse generic type wraps any data type in the standard envelope shape, with a success boolean and a data field of the generic parameter type.

The ApiError type describes the error envelope shape with success as a literal false, an error string, a code string from the error code registry, and an optional details value.

---

## 32. Cardano Transaction Metadata Schema — On-Chain

### The Metadata Key 674

Cardano transaction metadata is stored under integer keys. Key 674 is the community-standard key for general application metadata in Cardano transactions. All ZeroPay payment transactions use this key for their metadata object.

### The Payment Transaction Metadata Object

The metadata object under key 674 in a payment transaction contains four required fields. The app field is a string with the value zeropay, identifying the application that created this transaction. The schema field is a string with the value 1 in Version 1.0, serving as a version marker for future parsing compatibility. The invoiceId field is a string containing the invoice identifier in the INV-YYYYMMDD-XXXXXX format. The merchantId field is a string containing the human-readable merchant identifier in the MC-XXXX format.

### The Receipt Registration Transaction Metadata Object

When the receipt generation worker pins a receipt to IPFS, the backend submits a secondary Cardano metadata transaction to create a permanent on-chain link between the invoice and its IPFS receipt. The metadata object under key 674 in this transaction contains four fields. The app field is the string zeropay. The type field is the string zeropay-receipt, distinguishing this from a payment transaction. The invoiceId field is the invoice identifier string. The receiptCid field is the IPFS CIDv1 content identifier string.

### Byte Length Constraints

Cardano enforces a maximum of sixty-four bytes per metadata value. The invoiceId value in the format INV-20250518-X7K2M1 is twenty-two characters, which in UTF-8 encoding is twenty-two bytes — well within the limit. The merchantId in the format MC-0042 is seven characters and seven bytes. The IPFS CIDv1 in Base32 encoding is approximately fifty-nine characters. All values in the metadata schema are validated against their UTF-8 byte lengths before transaction building, and any value approaching the limit is either truncated or split across multiple numbered keys.

---

## 33. Aiken Smart Contract — Datum Schema

### Purpose of the Datum

When a customer locks funds in the Aiken escrow contract, they construct a transaction that sends ADA to the contract's script address and attaches a datum to the output. The datum encodes the parameters that the contract validator will use to decide whether any future transaction attempting to spend these funds is legitimate. The datum is permanent and immutable once the funding transaction is on-chain.

### The Five Datum Fields

The invoice-id field is a ByteArray — the invoice identifier string encoded as UTF-8 bytes. It identifies which ZeroPay invoice these funds are escrowed for. The contract uses this field only for identity — it does not enforce business logic based on it.

The merchant-pkh field is a twenty-eight-byte Blake2b-224 hash of the merchant's verification key. It is derived from the merchant's Cardano enterprise address by extracting the payment credential hash. The collect spending path checks that any transaction claiming these funds is signed by the key whose hash matches this value.

The customer-pkh field is a twenty-eight-byte Blake2b-224 hash of the customer's verification key. It is derived from the customer's enterprise address at the time the escrow deposit transaction is built. The refund spending path checks that any transaction reclaiming these funds after expiry is signed by the key whose hash matches this value.

The lovelace-amount field is an integer representing the minimum amount of lovelace that the merchant must direct to their own address when collecting. It matches the invoice's amountLovelace field. The collect path verifies that at least this amount goes to an address controlled by the merchant's payment credential.

The expires-at field is an integer representing the invoice expiry time as a POSIX timestamp in milliseconds since the Unix epoch. The collect path verifies that the spending transaction's validity interval upper bound is before this timestamp, preventing collection after expiry. The refund path verifies that the spending transaction's validity interval lower bound is after this timestamp, preventing premature refunds.

---

## 34. Aiken Smart Contract — Redeemer Schema

### Purpose of the Redeemer

The redeemer is a value provided by the spending transaction that signals which execution path the contract validator should follow. In Aiken's type system, the redeemer is a sum type — a tagged union with named constructors.

### The Collect Redeemer

The Collect constructor takes no arguments. Its presence in the spending transaction signals to the validator that this is a merchant collection attempt. The validator then checks the merchant-pkh, the lovelace-amount, and the expires-at fields in the datum against the properties of the spending transaction.

### The Refund Redeemer

The Refund constructor also takes no arguments. Its presence signals a customer refund attempt after expiry. The validator checks the customer-pkh and the expires-at fields against the spending transaction.

### Why No Data in the Redeemers

All the information the validator needs to make its decision is already in the datum. The redeemers only need to signal which spending path is being attempted — no additional data is needed. Keeping the redeemers data-free minimizes the transaction size and keeps the contract logic simple and auditable.

---

## 35. IPFS Receipt Document — Full Schema

### Purpose and Immutability

The receipt document is the permanent, tamper-proof record of a completed payment. It is pinned to IPFS by the Pinata API. Its IPFS Content Identifier is derived from the hash of its content, making any modification detectable — altering the document would produce a different CID, and the original CID stored in MongoDB and in the on-chain metadata would no longer resolve to the modified document.

### Top-Level Fields

The schemaVersion field is a string, set to 1.0 in Version 1.0. It exists so that future systems parsing historical receipts can identify which version of the schema the document follows.

The receiptId field is a string containing the invoiceId value. It is redundant with the blockchain sub-object's invoiceId field, but it is placed at the top level for quick human identification when the document is viewed directly.

The generatedAt field is a string containing an ISO 8601 UTC timestamp of when the receipt generation worker uploaded this document to Pinata.

The cardanoPayVersion field is a string containing the application version number, such as 1.0.0. It is read from the application's package.json at startup.

The network field is a string — either preprod or mainnet — indicating which Cardano network this payment settled on.

### The merchant Sub-Object

The merchant sub-object contains four fields. The id field is the human-readable merchantId string such as MC-0042. The shopName field is the merchant's business name at the time of settlement. The category field is the merchant's category string. The paymentAddress field is the Cardano bech32 enterprise address where the payment was received — this is the snapshot address from the invoice document, not the merchant's current address.

### The customer Sub-Object

The customer sub-object contains two fields. The displayName field is the customer's display name if they were a registered ZeroPay user when the payment was made. If the invoice was a counter checkout with an anonymous walk-in customer, this field holds the string Anonymous. The walletAddress field is the Cardano enterprise address from which the customer sent the payment, also optional for anonymous counter checkout payments.

### The payment Sub-Object

The payment sub-object contains six fields. The amountPaise field is the invoice amount as an integer in paise. The amountLovelace field is the invoice amount as an integer in lovelace. The adaInrRate field is the exchange rate locked at invoice creation as a floating-point number. The description field is the optional invoice description string. The items field is the array of line item sub-objects, identical in shape to the items array on the Invoice document. The lockedAt field is an ISO 8601 timestamp of when the invoice was created and the rate was locked.

### The blockchain Sub-Object

The blockchain sub-object contains five fields. The txHash field is the sixty-four-character hexadecimal Cardano transaction hash. The blockHeight field is the integer block height at which the transaction was included in a Cardano block. The confirmationsAtSettlement field is the integer number of confirmations the transaction had when the job queue declared it settled. The settledAt field is an ISO 8601 UTC timestamp of when the invoice reached the settled status. The invoiceId field is the application-layer invoice identifier string.

### The ipfs Sub-Object

The ipfs sub-object contains one field. The selfCid field is set to the string pending in the initial document that is uploaded to Pinata, because the CID cannot be known before the upload. After the upload, the CID returned by Pinata is stored in MongoDB's Invoice document and in Firebase. The receipt document on IPFS itself retains the pending placeholder — this is intentional and acceptable, because any consumer of the receipt can compute the self-CID by hashing the document content.

---

## 36. Cross-Collection Relationship Map

### The Users-to-Merchants Relationship

One User document may have zero or one corresponding Merchant document. The Merchant document holds the userId field as an ObjectID reference to the User collection. This is a parent-child relationship where User is the parent. Deleting a User document should cascade to delete the corresponding Merchant document, though no automated cascade is implemented in Version 1.0 — user deletion is not a product feature and would require manual database operations if needed.

### The Merchants-to-Invoices Relationship

One Merchant document has zero or many corresponding Invoice documents. The Invoice document holds the merchantId field as an ObjectID reference to the Merchant collection. The totalReceived and totalOrders fields on the Merchant document are denormalized aggregates of the amountLovelace and count of Invoice documents with status settled. These fields are maintained by the job queue, not by a database trigger or aggregation pipeline.

### The Users-to-Invoices Relationship (Customer Side)

One User document may be referenced as the customer in zero or many Invoice documents. The Invoice document holds the optional customerId field as an ObjectID reference to the User collection. Counter checkout invoices have no customer reference.

### The Invoices-to-Transactions Relationship

One Invoice document has zero or one corresponding Transaction document. The Transaction document holds the invoiceId field as an ObjectID reference to the Invoice collection. This relationship is one-to-one: an invoice can only have one successful transaction paying it. The unique index on the Transaction collection's txHash field enforces this constraint at the database level.

### The Firebase-to-MongoDB Relationship

The Firebase chatrooms node contains chat rooms that are logically linked to pairs of MongoDB User and Merchant documents, but no Firebase node holds a MongoDB ObjectID as a stored reference. The relationship is maintained at the application layer: the room identifier is derived from the customer's Firebase UID and the merchant's MongoDB ObjectID string using a deterministic hash. Firebase invoice status nodes are keyed by the invoiceId field from MongoDB. The backend Admin SDK is responsible for keeping these connections consistent.

---

## 37. Data Write Sequence — Who Writes What, When

### Invoice Creation Write Sequence

When a merchant crea