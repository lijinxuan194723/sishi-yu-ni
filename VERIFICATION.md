# Verification

- Official character portrait: https://tot.hoyoverse.com/en-us/character
- Runnable check: `node --experimental-strip-types check.mjs` (backup round trip, corrupt records, leap dates, all local reply branches).
- `npx tsc --noEmit` passed before publication; production build required before shipping.
- Local route HTTP smoke check returned 200.
- Data uses browser localStorage; export/import allows manual transfer. No cloud synchronization or AI service connected. Character activity and dialogue are explicitly simulated.
- [UNRUN] Browser interaction and visual checks; open site on phone and exercise chat, calendar, notes and backup restore.
- [UNRUN] WebMCP contract runtime: no supported validation context used. The optional page navigation tool feature-detects support.
