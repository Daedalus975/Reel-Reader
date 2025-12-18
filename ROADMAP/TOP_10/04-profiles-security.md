# 04 — Profiles & Security (Adult mode + PIN)

**Summary:** Add per-profile security: PIN gating, adult mode toggle, and profile-based content restrictions.

**Acceptance criteria:**
- Profiles can be assigned PINs; PIN unlock gate applies where configured.
- Adult content is hidden unless profile has adult mode enabled.
- Session timeout and optional biometric unlock supported (platform-dependent).

**Feature flag:** `feature_profiles_security`
**Estimate:** 3–5 days
