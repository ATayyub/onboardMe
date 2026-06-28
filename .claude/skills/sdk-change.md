# Skill: SDK Change

Work through this checklist every time `public/sdk.js` is modified.

---

## Hard rules (ADR-002)

- The SDK file lives at `public/sdk.js` only. **Never** create a JS file under `app/` for SDK code.
- The modal must use `dialog.showModal()`, **not** `dialog.show()`. `showModal()` gives the native backdrop and focus trapping.
- All DOM elements the SDK creates must be children of the `<dialog>` element — no floated divs, no appended-to-body overlays.
- The SDK must have **zero external dependencies**. No npm packages, no imports.

---

## Steps

### 1. Check the current SDK before editing

```bash
wc -l public/sdk.js       # should be ~120 lines; flag if it grows significantly
```

Understand what `OnboardMe.init()` and `OnboardMe.showFlow()` currently do before changing anything.

### 2. Make the change in `public/sdk.js`

Keep the public API surface minimal:
- `OnboardMe.init(flowId, options)` — auto-init on load
- `OnboardMe.showFlow(flowId, options)` — manual trigger

Do not add functions that aren't needed for the feature.

### 3. Check that all styles are scoped inside `dialog`

Search for any CSS that could bleed into the host page:

```bash
grep -n "document.body\|document.head\|innerHTML\s*=" public/sdk.js
```

Any manipulation of `<head>` or `<body>` directly (outside the dialog) is a red flag.

### 4. Verify `showModal()` is used

```bash
grep "showModal\|\.show()" public/sdk.js
```

Must see `showModal()`. Must NOT see `.show()` without `Modal`.

### 5. Smoke test with test.html locally

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000/test.html` in the browser.

- [ ] SDK loads without console errors
- [ ] Modal appears on button click (or auto-init)
- [ ] Steps render with correct title and description
- [ ] Next / Prev / Done buttons work
- [ ] Modal closes on Done or Dismiss

### 6. Verify events fire (cross-origin simulation)

In `test.html`, the SDK calls `http://localhost:3000/api/sdk/[flowId]/events`.
Open DevTools → Network and confirm:
- [ ] POST to `/api/sdk/[flowId]/events` fires on flow_started
- [ ] POST fires again on step_viewed (each step)
- [ ] POST fires on flow_completed
- [ ] All responses are HTTP 200

### 7. Verify CORS headers are present

In DevTools Network, click a `/api/sdk/*` response and confirm:
```
Access-Control-Allow-Origin: *
```

If missing, the CORS headers are missing from that endpoint — fix the route.
