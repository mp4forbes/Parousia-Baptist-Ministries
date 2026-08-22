<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Parousia bilingual conventions

Read `handoff.md` → **Bilingual UI conventions** before changing language labels or French copy.

- **Language toggle:** French UI → button says `Translate to English`; English UI → button says `Traduire en français`.
- **French fields:** `*_kreyol` / `*_ht` columns are standard French (not Haitian Creole). Use `src/lib/french-content.ts` helpers and `seed.ts` migrations.
