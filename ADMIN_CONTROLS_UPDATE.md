# ReferKaro 1.4.0 — Admin controls

Base same hai; sirf ye cheezein add hui hain (business rules, rewards, payments ka logic nahi badla).

## Admin ▸ Bonus & Targets
- **Target Tracker** (naya): aaj ke targets kis ke pure hue / claim baaki / hone wale (1-2 baaki) / pending / unverified referrals. Filters + summary cards.
- **Reward do / Revoke**: kisi bhi user ka target reward manually do ya wapas lo (reason zaroori). Revoke karne par purani entry delete nahi hoti, "revoked" mark hoti hai; wahi target dobara claim nahi ho sakta. Agar revoke se balance negative ho jaye to wallet auto-freeze ho jata hai.
- **Auto-credit** ON/OFF: target pura hote hi reward khud wallet me (har 30 sec me check). ON karte hi pending completed rewards bhi credit hote hain. Dobara credit nahi hota.
- **Weekly / Monthly targets**: "Add Target" me period chuno (daily / weekly [Mon-Sun IST] / monthly). Count wahi rule: us period me register hue verified direct referrals.
- **Per-user override**: Users ▸ "Targets" button. Format `3:50, 10:200:weekly`. Khali = override hatao. Baaki users global targets hi dekhte hain.
- **Audit Log** (naya sub-tab): freeze/hold, reward give/revoke, target changes, block/delete/verify, password reset, withdrawal actions. Last 1000 save, 300 dikhte hain. Backup me bhi jata hai.

## Freeze / Hold
- **Wallet Freeze** (Users ▸ Freeze Wallet, reason zaroori): withdrawal aur "Unlock with wallet" band; kamayi aur login chalte rahte hain. User ko wallet page par "Wallet on hold" dikhta hai.
- **Withdrawal Hold** (Withdrawals ▸ Hold, reason zaroori): request "On Hold" ho jati hai (paisa wallet se kata hi rehta hai). Release = Processing; Reject = paisa wapas.

## Tests
`npm test` me naya `admin-controls.test.js` jud gaya hai. Saare tests pass.
`icons/` folder bhi add kiya (zip me missing tha, PWA test fail ho raha tha).

## Dhyan rakhne wali baatein
- Weekly + daily targets ek hi referral ko dono me count karte hain, isliye rewards stack honge.
- Audit log aur tracker isi `app_state` JSON row me hain; log 1000 entries par cap hai.
- Deploy se pehle Supabase row ka backup lo.
