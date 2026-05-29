# India Digital Product Starter
## Cashfree, Render, and payment-gateway compliance for small launches

**By Ninetyone Software Solutions**  
**Version 1.0 — May 2026**

---

## Page 1 — What this guide covers

You are selling **digital goods** in India (ebooks, access, pixels on a website). This ebook explains:

- Why gateways ask for **5+ products** on a catalogue page
- **Cashfree** checkout basics
- **Render** hosting for Next.js
- Common **rejection reasons** and fixes

This is operational guidance, not legal advice. Confirm tax/GST with your CA.

---

## Page 2 — Digital product = different rules than COD

Payment gateways classify you by **what the customer receives**:

| Type | Typical gateway view |
|------|----------------------|
| Physical goods | Shipping, COD options |
| Digital / service | No shipping; instant fulfilment |
| Donation / gamble | Often blocked |

**kamalvscockroach.com** model: customer pays → pixel or ebook access → **no courier**. Your site must say that clearly on Terms, Refund, and Products pages.

**Remove** misleading pages: fake COD, fake shipping timelines, or “cancellation” flows that contradict instant digital delivery.

---

## Page 3 — The “5 products” catalogue trick (compliant)

Many Indian aggregators want a **product listing URL** with **multiple SKUs** before live payments.

**Compliant approach for a pixel site:**
- List **6+ distinct pixel products** (e.g. Team Kamal Single Pixel, Team Cockroach Bulk 10, etc.)
- Each row: name, **₹ price**, short description, **digital delivery**
- Link “Buy” to the real purchase flow on home page

**For ebooks:**
- Add each ebook as its own product row (₹299, PDF download described)
- Do not claim physical shipping

**Bad approach:** Five fake ₹1 items that are not buyable — reviewers test links.

---

## Page 4 — Cashfree integration checklist

**Environment variables (production):**
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_ENV=production` (sandbox for testing only)

**Webhook:**
- HTTPS URL on your domain
- Verify signature on every event
- Idempotent fulfilment (don’t grant twice)

**Customer sees:**
- Order id from Cashfree on receipt
- Support can trace **gateway order id** + **payment id**

**Never:** Commit secrets to GitHub; set them in Render dashboard only.

---

## Page 5 — Render deployment (Next.js)

1. Connect GitHub repo to Render **Web Service**
2. Build: `npm install && npm run build`
3. Start: `npm start` (or framework default)
4. Set **all** env vars before first deploy
5. Custom domain + HTTPS (required for webhooks)

**After deploy:**
- Hit `/products`, `/terms`, `/privacy`, `/refund`, `/contact`
- Test one **₹1 sandbox** payment before going live

**Disk:** If you store purchases in JSON files, use Render **persistent disk** or migrate to DB before scale.

---

## Page 6 — Pages gateways and customers expect

| Page | Purpose |
|------|---------|
| `/products` | SKU list (5+) |
| `/terms` | Service description, no gambling |
| `/privacy` | Data use, payment processor named |
| `/refund` | Digital goods policy |
| `/contact` | Email, company name |

**Footer** on every page: links to all of the above.

**Company identity:** Legal business name + support email on Contact — not personal phone in footer if you want privacy.

---

## Page 7 — Refund policy wording (digital)

Safe pattern:

- Sales are **final** once digital good is delivered (pixel placed / PDF sent)
- Failed payment / double charge: contact with **order id** within 7 days
- Refunds processed back to original method via Cashfree when approved
- No refund for “wrong team” if canvas clearly showed choice

Match **actual behaviour** in admin tools.

---

## Page 8 — Common gateway rejection reasons

1. **Site incomplete** — placeholder lorem, broken links  
2. **Too few products** — only one item on `/products`  
3. **Mismatch** — homepage price ≠ products page  
4. **Prohibited category** — gambling, adult, crypto without licence  
5. **No refund/contact** — missing policies  
6. **Razorpay named but Cashfree used** — update all copy  
7. **Test site on HTTP** — use HTTPS custom domain  

**Fix order:** Content → products page → policies → HTTPS → reapply.

---

## Page 9 — Security minimum before marketing spend

- Admin on **non-guessable path** + strong secret (not in URL query)
- Rate limit login and payment APIs
- Webhook: verify amount matches order
- Atomic file writes for purchase JSON
- No public admin link in footer

**Ops:** Rotate secrets if repo was ever public with `.env` committed.

---

## Page 10 — Launch day runbook

**T-7 days:** Sandbox payments, fix receipt email copy  
**T-3 days:** `/products` live with 6+ SKUs, Instagram assets ready  
**T-1 day:** Render env production, webhook test log clean  
**Launch:** Post + monitor Cashfree dashboard for failures  
**T+1:** Reply support within 4 hours with order id template  

**Support reply template:**
```
Thanks — please share Cashfree order id ______ and screenshot.
We’ll verify and respond within 24 hours.
```

---

**End of ebook**
