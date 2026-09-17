# How Users Pay on My Exam Companion (Paystack Integration)

**My Exam Companion** ([myexamcompanion.pages.dev](https://myexamcompanion.pages.dev)) uses **Paystack** to power a virtual wallet system that lets students purchase exam content — including our new **Post-UTME** practice questions for UNIBEN and UNILAG (2010–2026).

---

## User Flow: Step-by-Step

### Step 1 — Create an account / Log in
Users must sign in before they can access the wallet or purchase any content.

👉 **Login:** [myexamcompanion.pages.dev/modules/auth/login.html](https://myexamcompanion.pages.dev/modules/auth/login.html)
👉 **Sign Up:** [myexamcompanion.pages.dev/modules/auth/sign_up.html](https://myexamcompanion.pages.dev/modules/auth/sign_up.html)

> Only authenticated users can access the Top-Up page. Unauthenticated users are redirected to login.

---

### Step 2 — Top Up Wallet
After logging in, the user goes to their **Wallet Dashboard** to add funds.

👉 **Wallet Dashboard:** [myexamcompanion.pages.dev/wallet-dashboard](https://myexamcompanion.pages.dev/wallet-dashboard)

- The user clicks **"Top Up"** and enters an amount.
- They are taken to the **Paystack Inline Checkout**.

> ⚠️ **Only Bank Transfer is accepted** at this time. Other payment methods (card, USSD) are not enabled.

👉 **Amount Entry:** [myexamcompanion.pages.dev/amount-entry](https://myexamcompanion.pages.dev/amount-entry)
👉 **Paystack Checkout:** [myexamcompanion.pages.dev/paystack-inline-checkout](https://myexamcompanion.pages.dev/paystack-inline-checkout)

- Once Paystack confirms payment via **webhook**, the user's virtual wallet is credited instantly.

---

### Step 3 — Purchase Post-UTME Exam Access
With a funded wallet, the user can browse and unlock Post-UTME practice questions.

👉 **Exam Hub:** [myexamcompanion.pages.dev/modules/exam_hub/student/home.html](https://myexamcompanion.pages.dev/modules/exam_hub/student/home.html)

- Covers **UNIBEN** and **UNILAG** Post-UTME (2010–2026) across multiple subjects.
- Questions are unlocked per subject/year using wallet balance.

---

## Summary

| Step | Action | URL |
|------|--------|-----|
| 1 | Login / Sign Up | [/modules/auth/login.html](https://myexamcompanion.pages.dev/modules/auth/login.html) |
| 2 | Top Up Wallet (Bank Transfer only) | [/wallet-dashboard](https://myexamcompanion.pages.dev/wallet-dashboard) |
| 3 | Buy Post-UTME Access | [/modules/exam_hub/student/home.html](https://myexamcompanion.pages.dev/modules/exam_hub/student/home.html) |

---

*Built with Paystack Inline Checkout + Webhook verification for secure, idempotent wallet crediting.*
