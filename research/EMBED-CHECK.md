# Go-deeper embed check

Checked 13 Nov 2026, about 5:52 PM ET, from the build machine, read-only (`curl -sSIL`, HEAD requests, redirects followed). No header was stripped, proxied or bypassed.
Rule: a source gets an optional embedded view only if it passes all three: (a) an official embed (widget, embed code or documented iframe use), (b) terms that allow embedding, (c) response headers that allow framing (no `X-Frame-Options: DENY/SAMEORIGIN`, no CSP `frame-ancestors` limit).

| Source | URL checked | (a) Official embed | (b) Terms allow embedding | (c) Headers allow framing | Result |
|---|---|---|---|---|---|
| DARMC | darmc.harvard.edu | None found | [UNKNOWN] | [UNKNOWN] — HTTP 403 to HEAD | New tab |
| Ancient World Mapping Center | awmc.unc.edu | None found for the site (tiles are a separate CC BY-NC product, not an embed) | [UNKNOWN] | Yes (no XFO/CSP on HEAD) | New tab |
| OWTRAD | ciolek.com/owtrad.html | None | [UNKNOWN] | [UNKNOWN] — HTTP 500 to HEAD | New tab |
| Dutch-Asiatic Shipping (Huygens) | resources.huygens.knaw.nl/das/ | None | No statement on embedding; site is CC BY-NC-SA | Yes (no XFO/CSP on HEAD) | New tab |
| SlaveVoyages | slavevoyages.org | None found | [UNKNOWN] | Yes (no XFO/CSP on HEAD) | New tab |
| Sound Toll Registers Online | soundtoll.nl | None | [UNKNOWN] | Yes (no XFO/CSP on HEAD) | New tab |
| OpenStreetMap (site) | openstreetmap.org | — | — | No: `X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'` | New tab |
| OpenStreetMap (embed page) | openstreetmap.org/export/embed.html | Yes: the site's Share → HTML embed | [UNKNOWN]: tile usage policy not read for this check; embed loads live tiles (online data) | Yes (no XFO/CSP on HEAD) | New tab (fails b) |
| OpenFlights | openflights.org | None | [UNKNOWN] | Yes (no XFO/CSP on HEAD) | New tab |
| Global Shipping Lanes (GitHub) | github.com/newzealandpaul/Shipping-Lanes | None | — | No: `X-Frame-Options: deny` | New tab |
| UN Comtrade | comtradeplus.un.org | None | Licence agreement limits re-dissemination | No: `X-Frame-Options: DENY` (HEAD on the root returned 404) | New tab |
| Global Energy Monitor | globalenergymonitor.org | None found | Site content CC BY 4.0 per GEM's page; data terms differ | No: `X-Frame-Options: SAMEORIGIN` | New tab |
| UNESCO World Heritage Centre | whc.unesco.org | None for the site | FAQ: personal, non-commercial use | No: `X-Frame-Options: SAMEORIGIN` | New tab |
| Qhapaq Ñan listing (UNESCO) | whc.unesco.org/en/list/1459/ | None | As above | No: `X-Frame-Options: SAMEORIGIN` | New tab |
| Han Silk Road traffic data (ScienceDB) | doi.org/10.11922/sciencedb.611 → scidb.cn | None | [UNKNOWN] | Yes on the final page HEAD | New tab |
| Periplus network dataset | hdl.handle.net/1956/11470 → nva.sikt.no | None | [UNKNOWN] | No: `X-Frame-Options: SAMEORIGIN` | New tab |

**Outcome: no source passed all three checks, so the app has no embedded views.** Every "Go deeper" entry is a plain link that opens in a new tab (`target="_blank" rel="noopener noreferrer"`). The app makes no network call for them and works fully offline.

If a source later publishes an official embed and terms that allow it, re-run this check before adding one; it would be optional, online-only, and off by default.
