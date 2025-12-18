# 02 — Metadata & Artwork Integration

**Summary:** Integrate metadata providers, artwork fetchers, and a manual match picker for quality control.

**Acceptance criteria:**
- Providers configurable; fallback logic in place.
- Users can manually pick a match and lock fields.
- Artwork can be uploaded and preferred artwork chosen.

**Implementation notes:**
- Feature flag: `feature_metadata_artwork`
- Modules to add: `src/features/metadata`, `src/services/metadataProviders`

**Tasks:**
- [ ] Provider adapter interface
- [ ] Manual match picker UI and edit flow
- [ ] Artwork fetch/upload + preference setting

**Estimate:** 4–6 days

**Related docs:** `OPTIONAL_FEATURES.md` (Top 10)
