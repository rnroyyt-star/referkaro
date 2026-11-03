# ReferKaro update — 2026-11-03

## Payment / UTR
- QR/UTR payment records now save a server-generated submission timestamp (`ts` and `submittedAt`).
- The payment record stores a snapshot of the QR account holder name (`payeeName` / `qrPayee`) so later QR edits do not change the submitted payment's displayed name.
- User transaction history, pending-payment status, and receipt display the submission date and time in India Standard Time.
- Admin payment records display user identity, UTR, QR account-holder name, amount, and submission date/time.
- Existing payment records retain their original `ts`; legacy records without a name continue to show their stored QR ID/slot label where a name snapshot does not exist.

## Questions and answers
- The embedded GK question bank has been converted from Devanagari Hindi to Roman-script Hinglish. Options and answer indexes are retained.
- The existing `content.json` questions were already in Roman-script Hinglish and were left structurally unchanged.

## PWA asset fix
- Added the missing `icons/` directory and copied the app's existing 192/512 and maskable icons into the exact paths served by the server and referenced by the manifest.

## Verification
- `npm test` passes: server syntax, inline script syntax, smoke tests, feature smoke tests, and PWA asset endpoint tests.
