# Security Specification for Firestore Rules

## 1. Data Invariants
- Every Bilty document in `/krl/{biltyId}` and `/ktc/{biltyId}` must conform to the `biltyRecord` schema in `firebase-blueprint.json` with exact allowed keys (no shadow fields), valid `id` matching the path `{biltyId}` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), bounded string lengths, and immutable `id` and `createdAt` on update.
- Every Company Profile document at `/settings/company_profile` must conform to the `companyProfile` schema with strict allowed keys and bounded string lengths.
- All reads and writes require authentication restricted strictly to the verified workspace owner (`sk937636@gmail.com` with `email_verified == true`), the registered company operator account UID (`eNDb9XEdfbV6yINWTwfZPEK0gbY2` for `krishnaroadlines38@gmail.com`), or explicit verified admin documents in `/admins/{uid}` (without `get()`/`exists()` inside `allow list`).
- Global default-deny catch-all (`match /{document=**} { allow read, write: if false; }`) protects all unmapped paths.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated List**: `LIST /krl` with `auth = null`.
2. **Unauthenticated Write**: `CREATE /krl/bilty_1` with `auth = null`.
3. **Email Spoofing (Unverified)**: `LIST /krl` with `email = "sk937636@gmail.com"` and `email_verified = false`.
4. **Non-Owner Authenticated Read**: `GET /krl/bilty_1` or `LIST /ktc` with `email = "attacker@example.com"`, `email_verified = true`.
5. **Shadow Field Injection**: `CREATE /krl/bilty_1` with valid fields plus `"isAdmin": true` or `"ghost": "x"`.
6. **ID Poisoning (Path Traversal / Oversized ID)**: `CREATE /krl/bad$id` or 200-char document ID.
7. **ID Mismatch**: `CREATE /krl/bilty_1` where `data.id = "bilty_2"`.
8. **String Exhaustion (Denial of Wallet)**: `CREATE /krl/bilty_1` with `remarks` of 10,000 characters (`> 512`).
9. **Value Poisoning (Type Mismatch)**: `UPDATE /krl/bilty_1` setting `freight: "9999"` (string instead of number) or `isShared: "yes"`.
10. **Immutable Field Tampering**: `UPDATE /krl/bilty_1` changing `createdAt` or `id`.
11. **Privilege Escalation**: `CREATE /admins/{uid}` by client user.
12. **Company Profile Shadow/Oversize Write**: `UPDATE /settings/company_profile` with `companyName` > 256 chars or extra field `role: "admin"`.
