# Requested user controls and penalty payment update

## Included changes
- Admin can edit a user's email and mobile number. Email is normalized to lowercase and both fields are checked for duplicates.
- Admin can freeze/unfreeze wallet actions and set/release a specific wallet hold amount. Withdrawals and referral-wallet unlocks respect the freeze/held amount on the server.
- Admin can apply a penalty with an amount and either select an existing saved QR slot or upload a new PNG/JPG/WEBP QR image (up to 500 KB). The UPI ID is stored with the penalty.
- A user with an active penalty can log in, view only the penalty/payment screen, open the UPI app, and submit a UTR. Other authenticated POST actions are rejected by the server until admin verification.
- Admin can verify a submitted UTR to unlock the account, or reject the UTR and leave the account locked for a corrected submission.
- Login email lookup now normalizes existing stored email values to lowercase and safely handles malformed legacy password fields.
- The ZIP did not contain the `icons/` files referenced by the PWA manifest; the four referenced assets are included so PWA endpoint checks pass.

## Storage / migration
No new SQL table or Supabase schema migration is required. The new per-user fields (`walletFrozen`, `walletHoldAmount`, and `penalty`) are stored in the existing user records inside the configured `app_state` JSON document. Back up the existing `public.app_state` row before deployment. The QR image selected for a penalty is stored with that user record; keep images below the 500 KB limit.

## Apply this patch
Extract this patch over the existing project folder, allowing the listed files to overwrite their matching paths. Do not replace the rest of the project. Keep all existing Hostinger/Supabase environment variables and secrets unchanged.

## Tests run
`npm test` passes: syntax/inline checks, smoke tests, feature tests, penalty/contact/wallet integration tests, referral unlock tests, daily reward tests, and PWA endpoint checks.

The repository still stores application state as one JSON document in one Supabase row. This update preserves that architecture and is safe for the existing single-instance deployment model; it does not enable multi-instance horizontal scaling. True horizontal scaling requires a separate database normalization/transaction-locking migration and coordinated deployment, which is intentionally not mixed into this narrowly scoped patch.
