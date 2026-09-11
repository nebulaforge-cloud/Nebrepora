# Security policy

Nebrepora is a static, client-only site: no backend, no accounts, no cookies. Page views are counted with Cloudflare Web Analytics (cookie-free, no personal data). The only data it stores is the shortlist of pinned ids, kept in the visitor's own `localStorage`.

## Reporting a vulnerability

Please report privately through [GitHub security advisories](https://github.com/nebulaforge-cloud/Nebrepora/security/advisories/new) rather than opening a public issue. We aim to acknowledge reports within 3 business days.

Please do not run automated scanners or load tests against production.

## Hardening in place

- Strict Content-Security-Policy with no inline scripts or styles (`render.yaml`); the only off-site origins allowed are Cloudflare's analytics beacon and its reporting endpoint
- HSTS, `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `nosniff`, restrictive `Permissions-Policy`, COOP
- All dynamic text is HTML-escaped; only `http(s)` URLs are rendered into links
- `localStorage` input is validated against the shipped catalog before use
- Only `public/` is deployed
