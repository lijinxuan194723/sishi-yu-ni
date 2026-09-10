# Verification · 2026-09-09 update

## Implemented
- Caiyun v2.6 token/coordinates, current weather, optional minute forecast and alerts, rain/snow/sun effects, refresh/stale/error states; free Open-Meteo fallback.
- Model API configuration and test; fixed Luke persona, recent messages, rolling memory, pinned editable facts, lexical retrieval, original transcript search, stop/retry, import/export.
- Local storage only, compatible with v1 backups; no D1/R2 binding. Keys are session-only and excluded from backups. Companion start date and day count are editable directly from the home counter.

## Executed checks
- `node --experimental-strip-types scripts/checks/check.mjs`: legacy backup validation and invalid records/dates passed.
- `node --experimental-strip-types scripts/checks/check-integrations.mjs`: persona/context injection, pinned/summary/original retrieval, summary checkpoints, failed API preservation, output truncation/empty response, cancellation, provider URL validation, weather mapping/staleness/precipitation boundary, day calculations and round trip passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed with home and two API routes.
- Local HTTP root: 200. Live Open-Meteo through actual weather route: 200, normalized current weather returned for explicit test coordinates 39.9042,116.4074 (not the user's location).
- Proxy input rejects private/unsupported target: 400. Cross-origin request rejected: 403.
- Source review: visible navigation, settings, counter, weather configuration/refresh, model test, save settings, search, send/stop/retry, calendar dates/months, tasks, check-in, notes, memory editing and backup controls have handlers. Disabled states are limited to invalid input, completed daily check-in, loading, unsafe concurrent restore and storage failure.

## Boundaries
- [UNRUN] Real Caiyun token and user-selected model: no credentials supplied. Set up through Settings → API connections, test model and refresh weather.
- [UNRUN] Browser clicking, phone layout and real reload/restore interaction: run in the visible preview; only non-browser HTTP, code and logic checks performed.
- [UNRUN] Optional WebMCP navigation contract in a supported browser context.
- Summary and keyword retrieval are lossy; full transcript is retained and pinned facts can correct omissions. Clearing browser storage removes the records. No background notifications after closing the page.

## 2026-09-09 artwork and chat polish
- Four supplied clean originals copied byte-for-byte to public/images; no watermark-bearing classroom/cycling images used. CSS frames originals for desktop/mobile, avatar and chat.
- Chat has its own reusable model configuration form, actual network test, and save action; preserves existing weather configuration. Configured state is not presented as verified connectivity.
- Composer supports multiline text and ignores IME composition Enter. Existing local data schema and storage key preserved.
- PASS: all four local image URLs HTTP 200; local model proxy reached DeepSeek and received the expected upstream rejection for a deliberately invalid test key (401). This proves network reachability, not successful authenticated generation.
- PASS: local weather proxy returned real Open-Meteo data with HTTP 200.
- PASS: existing data/integration checks, including distinction between expired site login and upstream API-key rejection; TypeScript and production build.
- [UNRUN] User's actual model API generation and Caiyun Token request: enter credentials in chat/settings and run connection test. No valid credentials provided.
- [UNRUN] Browser interaction/visual QA: not explicitly requested. Responsive implementation inspected in source only.
