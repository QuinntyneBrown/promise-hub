# PromiseHub design system

Extracted from the PromiseHub HTML mocks on 2026-10-25. This is a complete design catalogue, not Angular component implementation. The application remains a scaffold. Existing token names and mock URLs are preserved.

Open [index.html](index.html) to browse the system. Every component documents anatomy, variants, sizes, state matrices, responsive rules, themes, accessibility, content, do/don’t, tokens, copyable markup and sources.

## Token and style sources

- [tokens/tokens.css](tokens/tokens.css): source of truth, inherited violet brand, semantic roles and both themes.
- [tokens/tokens.json](tokens/tokens.json): generated DTCG export.
- [tokens/contrast-pairs.json](tokens/contrast-pairs.json): inherited and PromiseHub-specific pairs.
- [assets/components.css](assets/components.css): inherited kit plus promoted PromiseHub components; names remain stable.
- [tools/build.py](tools/build.py) and [tools/catalog.py](tools/catalog.py): repeatable catalogue generation from the mocks. Requires Python and `beautifulsoup4`.

## Update and regeneration

Edit tokens and shared component CSS first. Edit catalogue metadata and generator prose for documentation changes. Run `python docs/design-system/tools/build.py` from the repository root, then the skill’s token export, structure and contrast checkers. The mock generator already points to this token and component CSS. `docs/mocks/assets/ui.css` remains an empty compatibility file; add shared styles here.

## Foundations

| Page | Purpose |
|---|---|
| [Colour](foundations/color.html) | Violet identifies primary actions; semantic status colours always carry written meaning. |
| [Typography](foundations/typography.html) | Rounded system type keeps names, instructions and high-priority information legible. |
| [Spacing](foundations/spacing.html) | A 4px base scale sets consistent inside and between spacing. |
| [Layout](foundations/layout.html) | One mobile-first grid governs columns, margins, gutters and page widths. |
| [Elevation](foundations/elevation.html) | Four shadow levels and explicit layers distinguish surfaces without competing with content. |
| [Shape](foundations/shape.html) | Five ordinary radii and one full pill radius establish a consistent rounded language. |
| [Motion](foundations/motion.html) | Movement explains change and remains optional. |
| [Iconography](foundations/iconography.html) | Outline icons support written labels; colour alone never identifies a medical or attendance state. |
| [Theming](foundations/theming.html) | Change semantic roles once to update every component and mock. |
| [Responsive](foundations/responsive.html) | Let content wrap and controls stay reachable from a 360px phone to an office laptop. |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA is a component contract and a screen-level responsibility. |
| [Content](foundations/content.html) | Speak calmly and directly to staff and families, in their language. |

## Components

| Page | Purpose |
|---|---|
| [Button](components/button.html) | Trigger a single explicit action, such as checking a child in or sending a slip. |
| [Button group](components/button-group.html) | Group related choices, such as a youth's tracks, so exactly one is pressed without creating several primary actions. |
| [Link](components/link.html) | Navigate to a household, event or record with a named destination. |
| [Menu](components/menu.html) | Offer secondary account actions without obscuring the current task. |
| [Text field](components/text-field.html) | Collect one labelled value with persistent guidance and a specific error. |
| [Textarea](components/textarea.html) | Collect a message, incident description or permission text over several lines. |
| [Select](components/select.html) | Choose one known value using the native platform control. |
| [Checkbox](components/checkbox.html) | Select independent permissions, recipients or consent acknowledgements. |
| [Radio group](components/radio-group.html) | Choose exactly one option from a labelled set. |
| [Switch](components/switch.html) | Change a named preference while retaining a visible on or off state. |
| [Date picker](components/date-picker.html) | Enter dates with a native date input and a visible format label. |
| [File upload](components/file-upload.html) | Select a roster CSV through a labelled file input; dragging is optional. |
| [Form field](components/form-field.html) | Keep the label, control, optional help, counter and error together. |
| [Form layout](components/form-layout.html) | Arrange related fields and one primary submit action with a linked error summary. |
| [Top bar](components/top-bar.html) | Orient staff and keep primary navigation and account actions within reach. |
| [Sidebar navigation](components/sidebar-navigation.html) | Expose a complete labelled list of permitted destinations. |
| [Bottom navigation](components/bottom-navigation.html) | Keep frequent staff destinations reachable on phones. |
| [Tabs](components/tabs.html) | Switch between related views of one record without losing its context. |
| [Breadcrumb](components/breadcrumb.html) | Show the parent path back to a list or organization. |
| [Pagination](components/pagination.html) | Move through a bounded set while preserving filters and announcing the result count. |
| [Stepper](components/stepper.html) | Show the current step and completed work during enrollment or setup. |
| [Skip link](components/skip-link.html) | Let keyboard users move directly past repeated navigation to the main content. |
| [Card](components/card.html) | Group one related set of facts and actions on a distinct surface. |
| [Accordion](components/accordion.html) | Reveal related details on demand through a native disclosure. |
| [Dialog](components/dialog.html) | Ask for a focused decision or edit while preserving the calling context. |
| [Drawer](components/drawer.html) | Present the full navigation as an edge sheet on smaller screens. |
| [Tooltip](components/tooltip.html) | Clarify an icon control on focus and hover without carrying essential instructions. |
| [Divider](components/divider.html) | Separate alternatives with text or draw a decorative rule. |
| [Container, grid and stack](components/container-grid-stack.html) | Compose consistent pages through shared columns, gutters and vertical rhythm. |
| [Table](components/table.html) | Compare records through captioned columns with reachable row actions. |
| [List](components/list.html) | Scan related records with one clear primary link per item. |
| [Description list](components/description-list.html) | Present labelled facts, such as contact details and approved pickups. |
| [Avatar](components/avatar.html) | Identify a person by initials or image alongside their written name. |
| [Badge](components/badge.html) | Express a named status, role or meaningful count without relying on colour alone. |
| [Chip](components/chip.html) | Represent a filter choice, removable input value or short static category. |
| [Stat](components/stat.html) | Highlight a labelled count without losing the period or denominator. |
| [Timeline](components/timeline.html) | Read a chronological history with named actors and times. |
| [Toast](components/toast.html) | Acknowledge a completed action and offer a short recovery action when available. |
| [Alert](components/alert.html) | Keep important page or field feedback visible near the affected task. |
| [Banner](components/banner.html) | Keep a persistent page-wide condition visible with a clear recovery action. |
| [Inline message](components/inline-message.html) | Associate concise help or a corrective error with its field. |
| [Progress bar](components/progress-bar.html) | Show meaningful completion with an accessible label and numerical value. |
| [Spinner](components/spinner.html) | Indicate an ongoing short operation alongside a specific loading message. |
| [Skeleton](components/skeleton.html) | Reserve the shape of expected content while its parent is busy. |
| [Empty state](components/empty-state.html) | Explain a first run, filtered result or unavailable state and offer one next action. |
| [Error page](components/error-page.html) | Explain why a destination is unavailable while keeping a safe way back. |
| [Brand mark](components/brand-mark.html) | Identify PromiseHub without replacing the accessible organization or application name. |
| [Attendance roster](components/roster.html) | Keep each child's identity, medical flag and attendance action on one readable row. |
| [Medical flag](components/medical-flag.html) | Signal that allergy or medication information is available on the child's Quick Card. |
| [Quick Card](components/quick-card.html) | Put emergency information first with readable contact and pickup details. |
| [Call list](components/call-list.html) | List authorized contacts in their intended calling order with explicit phone actions. |
| [Sync status](components/sync-status.html) | Distinguish pending local work from confirmed synchronization in words and colour. |
| [Guardian shell](components/guardian-shell.html) | Keep guardian pages simple, with organization identity and a labelled language choice. |
| [Summary](components/summary.html) | Present a short review of submitted or consent-related facts before confirmation. |
| [Signature](components/signature.html) | Display the signer's name and recorded metadata; it is not a drawing canvas. |
| [Slip event](components/slip-event.html) | Summarize the event being consented to before a guardian signs. |
| [SMS preview](components/sms-preview.html) | Preview the guardian message with language and length information. |
| [Push notification](components/push-notification.html) | Show a concise lock-screen-style message with a named organization and destination. |
| [Recipient count](components/recipient-count.html) | Make the size of the intended audience visible before sending. |
| [Bulk action bar](components/bulk-action-bar.html) | Show the number selected and the actions that will affect those records. |
| [Roster import mapping](components/roster-mapping.html) | Map imported CSV columns to named fields with sample values for review. |
| [Plan meter](components/plan-meter.html) | Show billing usage with both a count and a labelled progress track. |
| [Attendance history](components/attendance-dots.html) | Show past attendance with a readable status legend and per-session meaning. |
| [Notification panel](components/notification-panel.html) | Review persistent notifications with unread state and a clear destination. |
| [Wizard](components/wizard.html) | Guide organization setup through a bounded sequence with Back, Skip and one primary action. |
| [Onboarding receipt](components/onboarding-receipt.html) | Confirm the records created during setup in a short concrete list. |
| [Question panel](components/question-panel.html) | Group one survey question with its response or completion status. |
| [Search result](components/search-result.html) | Group household, child and event matches by meaningful record type. |
| [Icon tile](components/icon-tile.html) | Provide a decorative leading icon beside a fully named object. |
| [Status dot](components/status.html) | Pair a short status word with a small colour marker for fast scanning. |
| [QR code](components/qr-code.html) | Present a high-contrast machine-readable plate with a written destination and a link alternative. |
| [Authentication card](components/authentication-card.html) | Group account access fields and recovery links in a readable, bounded surface. |
| [Error summary](components/error-summary.html) | List invalid fields with links so users can correct a failed submission without searching. |
| [Invitation row](components/invite-row.html) | Pair a staff email address with the role being granted before an invitation is sent. |
| [Scripture block](components/scripture-block.html) | Set a quoted passage apart from the teaching with its reference, read at the lesson's text size. |
| [Video player](components/video-player.html) | Play a lesson video with native, keyboard-operable controls and a failure state that keeps the lesson readable. |
| [Code sample](components/code-sample.html) | Show a read-only, scrollable example of code with an accessible name. |
| [Code playground](components/code-playground.html) | Edit a small page of code, run it in a sandboxed preview and keep the lesson's checklist nearby. |

## Patterns

| Page | Purpose |
|---|---|
| [Forms](patterns/forms.html) | Edit a household or enroll a child through a labelled, reviewable flow. |
| [Feedback and loading](patterns/feedback-loading.html) | Choose feedback by duration, scope and whether staff can safely continue. |
| [Empty and error states](patterns/empty-error-states.html) | Explain the cause and offer one useful recovery action. |
| [Navigation and page structure](patterns/navigation.html) | Keep staff context and guardian reading order consistent across screen sizes. |
| [Dialogs and overlays](patterns/dialogs-overlays.html) | Use a dialog for a short focused task and a page for long or multi-step work. |
| [Data tables and lists](patterns/data-tables-lists.html) | Choose a list for scanning and a table for column comparison; preserve filtering and selection. |
| [Notifications](patterns/notifications.html) | Use temporary feedback for acknowledgements and persistent records for work needing attention. |
| [Content and tone](patterns/content-tone.html) | Use direct, calm language that tells families what happened and what to do next. |

## Changelog and drift

| Evidence | Issue | Resolution |
|---|---|---|
| Existing design system | Five vendored files but no browsable catalogue | Added twelve foundations, all evidenced and core components, and eight patterns. Preserved original token names and stylesheet classes. |
| mocks/assets/ui.css | PromiseHub components lived outside the shared catalogue | Promoted all styles to assets/components.css; retained an empty compatibility file and the original mock URLs. |
| ui.css and inherited components.css | Fixed widths, label measures and blur lengths lived directly in rules | Added semantic dimension tokens with the same values; reused existing space and control tokens where values matched. Media query thresholds remain literal because CSS custom properties cannot be used there. |
| ui.css overlay offset | 0.375rem (6px) was off the 4px spacing grid | Normalized to --space-2 (8px). An inherited, unused achievement-badge overhang was also snapped from 3.2px to the 4px step; no PromiseHub mock uses that selector. |
| Existing tokens.css | Copied organization comment referenced a different product’s ADR and implied an implemented server feature | Replaced the comment with the scoped pair contract; no existing token value changed. Organization branding remains unimplemented. |
| Quick Card phone facts | The .quick-card-specific two-column rule overrode the narrower generic phone rule | Matched specificity in the phone rule so labels stack above values below 640px, as documented; no information is removed. |
| Core catalogue | Tooltip, spinner and complete sidebar/pagination specimens were not all present in mocks | Documented core compositions using inherited roles and tokens; source sections identify core additions explicitly. |
| Waypoint foundation mocks (ADR 0043) | Youth, mentor and volunteer shells, Learning, Curriculum, Mentoring and public website pages | Composed only from existing components (top bar, tab bar, nav drawer, card, list, icon tile, empty state, skeleton, guardian bar); no token or component added. The navigation pattern documents the participant-role and module-off states. |
| Sign in as a youth or mentor (prompt 50) | Signed-out and account-inactive pages, the youth state of sign-in | Composed only from the existing authentication card, brand mark and button; the sign-in email field is labelled "Email" because youth sign in too. No token or component added. |
| Accept an invitation (prompt 51) | Youth account card on the child record, invite-youth dialog, youth and mentor states of accept-invite, invite-expired, Resend on Staff and roles | Composed only from existing components (card, empty state, list, badge, button, dialog, text field with Show password, authentication card, alert, toast); no token or component added. |
| Give guardian consent (prompt 52) | guardian-consent (verify, sign, signed, given, withdrawn, expired, Spanish), withdraw-consent, the youth's consent-required state, the consent policy card and dialog on Privacy and data, Guardian consent on the child record | Composed only from existing components (guardian shell, card, description list, select, checkbox, text field, button, alert, empty state, list, icon tile, badge, dialog, toast, skeleton); the signature preview is not used, so no token or component is added. In the library, `ph-checkbox` gains the invalid state (error under the box, `aria-invalid`) and `ph-select` its help text, both already defined on their design-system pages, and the shield and edit icons from the mocks join the icon set. |
| Complete first-run onboarding (prompt 53) | youth-welcome (you, preferences, your program, waiting, invalid, busy, error, finishing, success), no-cohort, the resume state of Learning | Composed only from existing components (page header, card, stepper, text field, select, switch, description list, button, alert, error summary, empty state, skeleton, toast). The Waypoint wizard maps to the existing `stepper` and `wizard` pages and its no-cohort state to `empty-state` (ADR 0043). In the library, `ph-switch` gains the description line already defined as the switch page’s “description” variant (`.switch__description`). No token or component added. |
| Manage cohorts (prompt 54) | program (term, mentor on each roster row, Mentors card; no-mentors, mentor-assigned, mentoring-off), program-form term field, assign-mentor and cohort-mentors dialogs, mentoring assigned | Composed from existing components (page header, card, list, avatar, button, empty state, select, text field, dialog, alert, toast). The Waypoint cohort pages map to the program page (ADR 0043). The supporting-mentors choice uses the checkbox page’s existing “group” variant (legend over several boxes), which the library gains as `ph-checkbox-group`. No token added. |
| Use the mentor dashboard (prompt 55) | mentor-dashboard (default, rollcall-off, empty, error, forbidden), mentor-youth (searched, no-results), mentor-youth-detail (onboarded, rollcall-off, forbidden), mentor-group | Composed only from existing components (page header, stat, card, list, avatar, icon tile, timeline for recent activity, description list, table with status, alert, text field of type search, empty state, skeleton, button). Waypoint’s progress rings, review queue, check-in and at-risk widgets belong to later prompts and are not ported. No token or component added. |
| Author curriculum (prompt 56) | curriculum-tracks (created, forbidden), curriculum-module (empty, invalid, busy, saved, failed, not-found), curriculum-lesson (no-video, video-uploading, video-invalid, video-failed), new-track, new-module, new-lesson, track-cohorts, curriculum-status (module, lesson, track), delete-lesson | Composed only from existing components (page header, stat, card, list, badge, icon-only button, breadcrumb, text field, textarea, select, switch, checkbox group, radio group, file upload, alert, error summary, description list, dialog, empty state, skeleton, toast). Waypoint’s drag-to-reorder becomes Move up and Move down icon buttons, for which the icon set gains `arrow-up` and `arrow-down` (iconography). Waypoint’s chunked-upload and transcoding states are not ported (ADR 0050). No token added. |
| Complete lessons (prompt 57) | learn-home (completed, resume), learn-track (coding, not-found), learn-module (locked, completed, coding), learn-lesson (video-failed, busy, completed, locked), learn-lesson-scripture (large-text), learn-coding-lesson (ran, saved, completed, failed), learn-coding-project (saved, submitted), submit-project | Four components join the system and the library, using the names ADR 0043 gives them: `button-group` (`.button-group`, the track switch; the page now documents the built segmented form with `aria-pressed`, replacing the unbuilt `.day-chips` evidence), `scripture-block` (`.scripture`, the Waypoint scripture component), `video-player` (`.video-player`, native controls plus the failed state with Retry) and, for coding lessons, `code-sample` (the inherited `.code-block`) and `code-playground` (`.code-playground`, editor, Run and a sandboxed preview). The reading text size steps use `.reading--lg` and `.reading--xl` on existing font-size tokens, and the icon set gains `book`, `code` and `play`. No token added. |
| Inherited component CSS | Includes historical selectors unused by PromiseHub | Retained for compatibility; catalogue scope is the PromiseHub evidence plus the core set. Do not interpret unused inherited selectors as implemented product features. |

## Verification

See [verification.md](verification.md) for actual checker results, reviewed screenshots and limitations. The structure and contrast checks do not substitute for application-level keyboard, screen-reader and axe checks.

## Remaining design decisions

The violet brand remains the existing mock default pending a PromiseHub brand decision. Typed-signature legal requirements remain a product decision; this catalogue documents visual evidence only. No application consent or messaging logic is implemented.
