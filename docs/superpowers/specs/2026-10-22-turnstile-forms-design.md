# Cloudflare Turnstile on public forms

**Date:** 2026-10-22
**Branch:** `turnstile-forms` (from `main`)
**Status:** awaiting review

## Context

The site has three public forms. They feed Klaviyo and, for enquiries, Resend. They
currently attract enough automated traffic that bogus profiles reach Klaviyo, and
Klaviyo's own bot scoring then suppresses genuine subscribers caught alongside them.

`main` already carries a layer of cheap, local defences in
`tools/helpers/botProtection.ts`: a honeypot field, a 1.5s minimum time-on-screen
gate, a 5-per-minute per-IP rate limit, email format validation, and a
disposable-domain blocklist. These stop unsophisticated bots without a network call.

They do not stop anything that renders the page, waits, and submits plausibly. That
is the gap Turnstile closes.

## Goals

- Block automated submissions on all three public forms before they reach Klaviyo or
  Resend.
- Keep the existing local defences working as a floor, including when Cloudflare is
  unreachable.
- Do not degrade the experience for genuine customers — no visible checkbox in the
  common case.
- Do not reintroduce the Klaviyo suppression problem the browser-direct newsletter
  path was built to avoid.
- Be disableable in production without a redeploy.

## Non-goals

- Cloudflare WAF, Bot Fight Mode, or proxying DNS through Cloudflare. The domains are
  served by Vercel and are not proxied through Cloudflare; this spec changes nothing
  about that.
- Turnstile pre-clearance. It requires a Cloudflare-proxied origin, so it would have
  no effect here and is left disabled on the widget.
- `PasscodeModal`. It gates draft/preview access, not public submission, and is out of
  scope.
- The product page's add-to-cart form. Not a submission surface.

## Current state

| Form | Renders via | Submit path |
| --- | --- | --- |
| `FormNewsletter` | shared `<Form>` | **browser → Klaviyo directly**; falls back to `/api/form` |
| `FormSidePanel` | shared `<Form>` | `/api/form` |
| `ContactSidebar` | raw `<form>` | `/api/form` |

Two details drive the design:

1. **The shared `<Form>` component is the natural injection point.** It already renders
   the honeypot (`FieldBotCheck`) and already injects `_elapsedMs` into submitted
   values. Adding the widget and token there covers two of the three forms with no
   change to either.

2. **`FormNewsletter` deliberately bypasses the server.** It subscribes from the
   browser so Klaviyo sees the subscriber's real session rather than a datacentre IP —
   server-side signups were being auto-suppressed. `/api/form` is only the fallback
   when the browser path is unconfigured or blocked (ad-blocker, offline, Klaviyo
   unreachable). Verifying only inside `/api/form` would therefore leave the
   newsletter's primary path — likely the highest-volume form — ungated.

## Design

### Client

Render the Turnstile widget inside `components/Form/index.tsx`, beside
`FieldBotCheck`. On solve, hold the token in a ref and inject it into the submitted
values as `_turnstileToken`, exactly as `_elapsedMs` is injected today. Reset the
widget after each submission; tokens are single-use and expire after roughly five
minutes.

`ContactSidebar` uses a raw `<form>` and is wired explicitly with the same hook.

If the Turnstile script fails to load or the widget errors — most commonly because an
ad-blocker blocks `challenges.cloudflare.com` — the client sets `_turnstileUnavailable`
on the submission instead of a token, so the server can distinguish "this customer
could not be challenged" from "this submission arrived with nothing". The submit
button is never blocked waiting on the widget.

Widget mode is **Managed**: invisible or non-interactive for nearly all genuine
visitors, escalating only when Cloudflare's signals warrant it.

### Server

Add `tools/helpers/turnstile.ts` exposing a single verification function that POSTs to
`https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret, the
token, and the client IP, and returns a discriminated result:

```
{ outcome: 'pass' }
{ outcome: 'fail', codes: string[] }      // Cloudflare rejected the token
{ outcome: 'unavailable', reason: string } // could not reach or parse Cloudflare
```

The three-way result matters: `fail` and `unavailable` are different events and get
opposite treatment.

`/api/form` calls this inside its existing bot-protection block, after the rate limit
and honeypot checks (cheap and local first, network call last).

### The newsletter path and the single-use token problem

Turnstile tokens are single-use — `siteverify` rejects a token it has already seen,
with `timeout-or-duplicate`. A naive implementation breaks the newsletter fallback:

```
submit → token T
  → verify T                      ✓ passes, T is now spent
  → browser-direct Klaviyo subscribe
  → if that fails, POST /api/form with T
  → /api/form verifies T again    ✗ rejected, already used
```

Every user whose browser path is blocked — precisely the ad-blocker users who need the
fallback — would silently fail.

So: a new `POST /api/verify-turnstile` accepts a token, verifies it once, and on
success returns a short-lived **signed marker**. `FormNewsletter` calls this before
subscribing from the browser, and passes the marker rather than the raw token if it
later falls back to `/api/form`.

The marker is `base64url(payload).hmacSHA256(payload)` where payload carries an
expiry (5 minutes) and a random nonce, signed with `TURNSTILE_SECRET_KEY`. `/api/form`
accepts **either** a fresh `_turnstileToken` **or** a valid unexpired
`_turnstileMarker`, never neither.

Spent nonces are held in an in-memory set with periodic pruning, mirroring the
existing `pruneRateLimitBuckets` pattern, so a marker cannot be replayed within its
window.

> **Known limitation, inherited:** on serverless the in-memory set is per-instance, so
> replay prevention and the existing IP rate limit are both best-effort rather than
> global. This matches the behaviour already shipped for rate limiting and is not made
> worse by this change. Moving either to shared storage is out of scope here.

### Failure modes

| Event | Treatment | Why |
| --- | --- | --- |
| Token and marker both absent | **Reject** (400) | No JS, or a direct POST to the endpoint. Not a real customer. |
| Widget failed to load; client sent `_turnstileUnavailable` | **Allow**, log at warn level | Ad-blockers and privacy extensions sometimes block `challenges.cloudflare.com`. Rejecting here would silently block genuine, privacy-conscious customers. The flag is client-supplied and therefore forgeable — but forging it only returns an attacker to the honeypot, timing and rate-limit floor that already exists today, so it is no worse than the pre-Turnstile position. Monitor the rate: a sharp rise means either an extension update or an attacker discovering the flag. |
| Cloudflare returns a failure | **Reject**, respond as success to the client | Telling a bot which signal caught it helps it tune. Matches existing honeypot behaviour. |
| Cloudflare unreachable, times out, or returns a malformed body | **Allow**, log at error level | The submission carries a real token; we could not reach the verifier. Blocking genuine enquiries over someone else's outage is the worse failure. Honeypot, timing and rate limiting still apply. |
| `TURNSTILE_ENFORCE` is `false` | **Allow**, log at warn level | Kill switch. |
| Secret key missing from the environment | **Allow**, log at error level | A misconfigured deploy must not take the forms down. |

Timeout on the siteverify call: 5 seconds. Beyond that it is treated as `unavailable`.

### Kill switch

`TURNSTILE_ENFORCE` defaults to enabled. Setting it to `false` in Vercel disables
enforcement without a redeploy. The widget still renders and tokens are still
collected and logged, so the switch changes only whether a failed verification blocks
a submission.

## Configuration

| Variable | Scope | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | client | `0x4AAAAAAFhOR7qgSQ9yxEMt` |
| `TURNSTILE_SECRET_KEY` | server | from the Cloudflare dashboard — never committed |
| `TURNSTILE_ENFORCE` | server | `true` in production; `false` disables enforcement |

The widget is registered for `bradylegler.com`, `www.bradylegler.com` and
`staging.bradylegler.com`.

For local development, Cloudflare's documented test keys are used rather than adding
`localhost` to the widget:

| Key | Behaviour |
| --- | --- |
| `1x00000000000000000000AA` | sitekey, always passes |
| `2x00000000000000000000AB` | sitekey, always fails |
| `1x0000000000000000000000000000000AA` | secret, always passes |
| `3x0000000000000000000000000000000AA` | secret, returns `timeout-or-duplicate` |

The last is used deliberately to exercise the duplicate-token path.

## Files

**New**

- `tools/helpers/turnstile.ts` — siteverify call, three-way result, marker sign/verify
- `app/api/verify-turnstile/route.ts` — verify-once endpoint returning a marker
- `components/Field/FieldTurnstile/` — widget wrapper and script loading

**Changed**

- `components/Form/index.tsx` — render the widget, inject `_turnstileToken`
- `components/ContactSidebar/ContactSidebar.tsx` — same, wired explicitly
- `components/Form/FormNewsletter/index.tsx` — verify before the browser-direct
  subscribe, carry the marker into the fallback
- `app/api/form/route.ts` — accept token or marker inside the existing bot block
- `.env.template` — document the three new variables

## Testing

Unit, against `tools/helpers/turnstile.ts`:

- pass, fail, and unavailable each map to the correct outcome
- a timeout maps to `unavailable`, not `fail`
- marker round-trips; an expired marker is rejected; a tampered marker is rejected;
  a replayed nonce is rejected

Route-level, against `/api/form`:

- no token and no marker → 400
- valid token → proceeds to Klaviyo
- valid marker → proceeds to Klaviyo
- Cloudflare failure → responds success, nothing reaches Klaviyo
- Cloudflare unavailable → proceeds, error logged
- `_turnstileUnavailable` set → proceeds, warning logged, local checks still enforced
- `TURNSTILE_ENFORCE=false` → proceeds regardless
- the existing honeypot, timing and rate-limit tests continue to pass

Manual, on staging before production:

- all three forms submit successfully with a real widget
- newsletter fallback: block the browser-direct path and confirm the submission still
  succeeds via the marker — this is the path the duplicate-token secret exists to prove
- block `challenges.cloudflare.com` in the browser and confirm all three forms still
  submit, with the warning logged
- a direct `curl` POST with no token is rejected

## Rollout

1. Merge `turnstile-forms` into `main` behind `TURNSTILE_ENFORCE=false`.
2. Set the keys in Vercel. Confirm widgets render and tokens are collected in
   production with enforcement still off.
3. Flip `TURNSTILE_ENFORCE=true`. Watch Klaviyo signup volume and the form error rate.
4. Merge `main` down into `staging`, resolving the `/api/form` divergence there.

Step 4 matters: `staging` is 28 commits ahead with the ring customizer and has **no**
bot protection on `/api/form` at all. This merge is what finally gives it both.

## Risks

- **Genuine customers blocked.** Mitigated by Managed mode, the fail-open-on-outage
  rule, and the kill switch. Watch signup volume after step 3.
- **Newsletter fallback regression.** The single-use token issue is the likeliest way
  to break real users, and it fails silently. Covered explicitly by a test using the
  duplicate-token secret.
- **Turnstile does not resolve Klaviyo suppression on its own.** It reduces the bogus
  volume that contributes to it, but Klaviyo applies its own scoring. If suppression
  persists after rollout, that is a separate investigation.
