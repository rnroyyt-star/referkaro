# Referral Wallet Recharge Control

- Admin ▸ Settings ▸ "Referral Wallet Unlock": ON/OFF switch + minimum verified referrals (default 3, editable).
- User ▸ Refer page: new card showing required / verified / pending-verification / payment-baaki counts and unlock status message.
- "Unlock with wallet" button appears only when user has permission (switch ON and verified >= minimum, or admin manual allow).
- Server enforces all rules (switch, minimum, existing checks) in `referral/wallet-unlock` and `referral/status`.
- Admin ▸ Referrals: per-referrer Verified / Pending / Total list, with "Allow unlock manually" / "Remove manual allow".
- Admin panel: 13 tabs reduced to 10 (Overview, Payments, Withdrawals, Users, Referrals, Settings, Rewards & Content, Bonus & Targets, Tickets, Demo). Bonuses / Daily Targets / Daily Task Links are sub-tabs under "Bonus & Targets".
- Tests extended (pending count, switch OFF, below-minimum block, manual allow). `npm test` passes.

## Professional admin panel (v3)
- New sidebar dashboard layout (dark sidebar, grouped: Main / Operations / Users & Growth / Configuration) with live badges for pending payments, withdrawals and open tickets.
- Sticky page header with title, description, search and Export CSV; fully responsive (sidebar becomes a top scroll-nav on mobile).
- Dashboard: 8 KPI cards, pending payments with one-click Verify/Reject, latest users.
- Users: compact stat boxes and wrapped action buttons. Referrals: KPI header + per-referrer unlock status.
- Business logic untouched; `npm test` passes.
