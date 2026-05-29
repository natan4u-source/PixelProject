# Ebooks (digital products)

## Catalogue

| Slug (MD/PDF) | Title | Price |
|---------------|-------|-------|
| `customer-support-chatgpt-prompts` | Customer Support ChatGPT Prompt Pack | ₹2,999 |
| `pixel-war-playbook` | How to Win the Pixel War | ₹2,999 |
| `instagram-viral-stunt-site` | Instagram Growth for Viral Stunt Sites | ₹2,999 |
| `india-digital-product-starter` | India Digital Product Starter | ₹2,999 |
| `kamal-cockroach-copy-toolkit` | Kamal vs Cockroach Copy Toolkit | ₹2,999 |

Prices are defined in `src/lib/business.ts` (`EBOOKS`).

## Export all PDFs

From project root:

```bash
node scripts/md-to-pdf-html.mjs --all
```

Or one file:

```bash
node scripts/md-to-pdf-html.mjs pixel-war-playbook
```

Requires Google Chrome or Microsoft Edge on Windows. Output: `content/ebooks/<slug>.pdf` (and temporary `<slug>-print.html`).

## Storage

Keep PDFs **out of `public/`** until paid download is implemented. Deliver via email or secure link after Cashfree payment.

## Sales pages

- Shop: `/ebooks`
- Example: `/ebooks/customer-support-prompts` — Cashfree checkout + instant PDF download
