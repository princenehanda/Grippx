# Grippx Website

Source code for grippx.co — a static site covering the brand's marketing pages,
blog, and the National Flag-backed product catalogue with Paystack checkout
and WhatsApp order handoff.

## Product Synchronization

Product data comes from the National Flag reseller API and is published as a
static file (`data/products.json`) that `catalogue.html` reads client-side —
there is no live backend or database.

### Pipeline

1. **Fetch** — `scripts/sync-nationalflag.js` (Node.js) pulls the raw supplier
   feed. Credentials are read from environment variables (`NF_EMAIL`,
   `NF_PASSWORD`), provided as GitHub Actions Secrets — **never hardcode
   these in any file that gets committed or served publicly.**
2. **Normalize** — `scripts/build_products.py` (Python) applies the 30%
   retail markup, strips internal supplier/wholesale tier data, and writes
   the public `data/products.json`.
3. **Publish** — GitHub Pages serves the updated `data/products.json`
   automatically once it's committed; no manual upload step is needed.

### Automation

`.github/workflows/sync-products.yml` runs steps 1–2 on a 6-hour schedule.
Confirm this workflow file is deployed at the **repo root** under
`.github/workflows/` — GitHub Actions won't detect it anywhere else.

### Running the Sync Manually

```bash
export NF_EMAIL="..."
export NF_PASSWORD="..."
node scripts/sync-nationalflag.js
python3 scripts/build_products.py
```

## Deployment

Commit the refreshed `data/products.json` (and any updated HTML/CSS) to the
`main` branch — GitHub Pages redeploys automatically. There is no separate
server to upload files to.

## Security Notes

- Supplier credentials and wholesale/tier pricing must never appear in any
  file under a publicly served path (`js/`, `assets/`, etc.). They belong in
  environment variables / GitHub Secrets only.
- If a script under `js/` or `scratch/` is ever found with hardcoded
  credentials, rotate the National Flag password immediately and remove the
  file — don't just stop referencing it.
