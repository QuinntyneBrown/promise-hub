# Verification record

Verified on 25 October 2026 using Chromium. No application behavior tests were added for these design artifacts.

| Check | Result |
|---|---|
| Mocks checker | 116 screens, 520 mocks; zero errors and warnings |
| Design-system checker | 95 HTML pages: 12 foundations, 74 components, eight patterns and the index; zero errors and warnings |
| Contrast checker | 232 light/dark pair checks passed; zero failures or unresolved pairs |
| Foundation token coverage | All 319 distinct CSS token names appear on exactly one foundation page |
| DTCG export | Regenerated from tokens.css, including theme extensions |
| Chromium layout inspection | All 95 catalogue pages at 360px and 1280px, in both themes; no horizontal page overflow, unset live tokens, duplicate IDs, script errors or failing live contrast ratios |
| Narrow reflow | Index, button, table, wizard and Quick Card pages checked at 320px; no horizontal page overflow |
| Keyboard and preferences | First Tab reaches the visible skip link; focus ring renders. Tooltip appears on keyboard focus and Escape dismisses it. Reduced motion resolves the transition to 0.01ms; forced colours resolves the focus token to Highlight |

## Update: mock review rules promoted (25 October 2026)

The remaining rules in `docs/mocks/assets/ui.css` (table `hide-sm` columns and first-column links, phone tab wrapping, padded-card lists, roster status stripe radius, KPI label baseline, phone chart labels, alert ghost action, wizard Skip, flush card titles, name-first tables and flush-card feeds) moved to `assets/components.css` in the same cascade position. The catalogue pages for tabs, table, list, badge, stat, timeline, card, medical flag, alert, roster, wizard and top bar now document them. After regeneration: mocks checker 116 screens, 520 mocks, 0 errors, 0 warnings; design-system checker 95 pages, 0 errors, 0 warnings; contrast checker 232 passed, 0 failed; DTCG export regenerated (391 tokens).

## Visual review

Reviewed the index, button, attendance roster, dialog and colour foundation at 360px and 1280px in light and dark themes. Reviewed button state matrices and representative source mocks: Today, check-in, Quick Card, guardian permission-slip signing and Add a family. Dark raised surfaces remain distinct. State matrices and tables scroll inside their own regions.

Review corrected table, tabs and wizard specimen overflow; transparent state-matrix headers that inherited the surrounding theme; and the Quick Card phone rule whose specificity prevented labels from stacking above values. Fixed dimensions were promoted into semantic tokens. The catalogue README records the remaining drift and compatibility decisions.

Screenshots, contact sheets, measurements and checker output are generated under `.cache/` and ignored by Git. Recreate them with `python docs/design-system/tools/review.py` after installing Python `playwright`, `Pillow` and Chromium. The documentation generator requires `beautifulsoup4`.

## Reproduce the static checks

From the repository root:

```sh
python docs/design-system/tools/build.py
python .agents/skills/extracting-design-systems/scripts/tokens_to_json.py docs/design-system/tokens/tokens.css
python .agents/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
python .agents/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
python .agents/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks
python docs/design-system/tools/review.py
```

## Boundaries

The catalogue documents visual and interaction contracts. Static overlay specimens remain in document flow and do not implement application workflows. Complete screen-reader testing, browser zoom at 200% and 400%, application keyboard flows and axe checks remain necessary when the Angular components and screens are implemented. These checks do not certify the eventual application as WCAG conformant.

The separate application scaffold passed all project builds, frontend Prettier and angular-eslint checks, backend formatting and the actual Husky pre-commit hook. Backend test projects load but contain zero tests. The frontend dependency audit reports zero vulnerabilities after the Vite patch override.
