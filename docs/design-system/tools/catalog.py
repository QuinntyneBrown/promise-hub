"""PromiseHub component inventory. Selectors and source specimens come from the mocks."""

# slug | title | evidence selector | semantics | purpose
ROWS = '''
button|Button|.btn|button|Trigger a single explicit action, such as checking a child in or sending a slip.
button-group|Button group|.button-group|button|Group related choices, such as a youth's tracks, so exactly one is pressed without creating several primary actions.
link|Link|a.list-link|link|Navigate to a household, event or record with a named destination.
menu|Menu|.menu|menu|Offer secondary account actions without obscuring the current task.
text-field|Text field|.input|input|Collect one labelled value with persistent guidance and a specific error.
textarea|Textarea|.textarea|input|Collect a message, incident description or permission text over several lines.
select|Select|.select|input|Choose one known value using the native platform control.
checkbox|Checkbox|.choice:has(input[type=checkbox])|checkbox|Select independent permissions, recipients or consent acknowledgements.
radio-group|Radio group|fieldset:has(input[type=radio])|radio|Choose exactly one option from a labelled set.
switch|Switch|.switch|checkbox|Change a named preference while retaining a visible on or off state.
date-picker|Date picker|.field:has(input[type=date])|input|Enter dates with a native date input and a visible format label.
file-upload|File upload|.dropzone|input|Select a roster CSV through a labelled file input; dragging is optional.
form-field|Form field|.field|input|Keep the label, control, optional help, counter and error together.
form-layout|Form layout|.form-actions|form|Arrange related fields and one primary submit action with a linked error summary.
top-bar|Top bar|.topbar|navigation|Orient staff and keep primary navigation and account actions within reach.
sidebar-navigation|Sidebar navigation|.nav-drawer__nav|navigation|Expose a complete labelled list of permitted destinations.
bottom-navigation|Bottom navigation|.tabbar|navigation|Keep frequent staff destinations reachable on phones.
tabs|Tabs|.tabs|tabs|Switch between related views of one record without losing its context.
breadcrumb|Breadcrumb|.breadcrumb|navigation|Show the parent path back to a list or organization.
pagination|Pagination|.list-more|navigation|Move through a bounded set while preserving filters and announcing the result count.
stepper|Stepper|.steps|navigation|Show the current step and completed work during enrollment or setup.
skip-link|Skip link|a.skip-link|link|Let keyboard users move directly past repeated navigation to the main content.
card|Card|.card|display|Group one related set of facts and actions on a distinct surface.
accordion|Accordion|.accordion|disclosure|Reveal related details on demand through a native disclosure.
dialog|Dialog|.dialog|dialog|Ask for a focused decision or edit while preserving the calling context.
drawer|Drawer|.nav-drawer|dialog|Present the full navigation as an edge sheet on smaller screens.
tooltip|Tooltip||tooltip|Clarify an icon control on focus and hover without carrying essential instructions.
divider|Divider|.divider|display|Separate alternatives with text or draw a decorative rule.
container-grid-stack|Container, grid and stack|.two-col|display|Compose consistent pages through shared columns, gutters and vertical rhythm.
table|Table|.table|table|Compare records through captioned columns with reachable row actions.
list|List|.list|display|Scan related records with one clear primary link per item. A row may carry a paragraph of text (.list__text) under its meta, as for a youth's shared reflection, and a cluster of buttons under it for a row without a link, as on an at-risk flag.
description-list|Description list|.facts|display|Present labelled facts, such as contact details and approved pickups.
avatar|Avatar|.avatar|display|Identify a person by initials or image alongside their written name.
badge|Badge|.badge|display|Express a named status, role or meaningful count without relying on colour alone.
chip|Chip|.chip|button|Represent a filter choice, removable input value or short static category.
stat|Stat|.stat|display|Highlight a labelled count without losing the period or denominator.
timeline|Timeline|.feed|display|Read a chronological history with named actors and times.
toast|Toast|.toast|feedback|Acknowledge a completed action and offer a short recovery action when available.
alert|Alert|.alert|feedback|Keep important page or field feedback visible near the affected task.
banner|Banner|.banner|feedback|Keep a persistent page-wide condition visible with a clear recovery action.
inline-message|Inline message|.hint|feedback|Associate concise help or a corrective error with its field.
progress-bar|Progress bar|.progress|progress|Show meaningful completion with an accessible label and numerical value.
spinner|Spinner||feedback|Indicate an ongoing short operation alongside a specific loading message.
skeleton|Skeleton|.skeleton|display|Reserve the shape of expected content while its parent is busy.
empty-state|Empty state|.empty|feedback|Explain a first run, filtered result or unavailable state and offer one next action.
error-page|Error page|.error-page|feedback|Explain why a destination is unavailable while keeping a safe way back.
brand-mark|Brand mark|.ph-mark|display|Identify PromiseHub without replacing the accessible organization or application name.
roster|Attendance roster|.roster|display|Keep each child's identity, medical flag and attendance action on one readable row.
medical-flag|Medical flag|.flag|display|Signal that allergy or medication information is available on the child's Quick Card.
quick-card|Quick Card|.quick-card|display|Put emergency information first with readable contact and pickup details.
call-list|Call list|.call-list|display|List authorized contacts in their intended calling order with explicit phone actions.
sync-status|Sync status|.sync-chip|feedback|Distinguish pending local work from confirmed synchronization in words and colour.
guardian-shell|Guardian shell|.guardian-bar|navigation|Keep guardian pages simple, with organization identity and a labelled language choice.
summary|Summary|.summary|display|Present a short review of submitted or consent-related facts before confirmation.
signature|Signature|.signature|display|Display the signer's name and recorded metadata; it is not a drawing canvas.
slip-event|Slip event|.slip-event|display|Summarize the event being consented to before a guardian signs.
sms-preview|SMS preview|.sms|display|Preview the guardian message with language and length information.
push-notification|Push notification|.push|feedback|Show a concise lock-screen-style message with a named organization and destination.
recipient-count|Recipient count|.recipient-count|display|Make the size of the intended audience visible before sending.
bulk-action-bar|Bulk action bar|.bulk-bar|form|Show the number selected and the actions that will affect those records.
roster-mapping|Roster import mapping|.mapping|form|Map imported CSV columns to named fields with sample values for review.
plan-meter|Plan meter|.plan-meter|progress|Show billing usage with both a count and a labelled progress track.
attendance-dots|Attendance history|.dots|display|Show past attendance with a readable status legend and per-session meaning.
notification-panel|Notification panel|.bell-panel|display|Review persistent notifications with unread state and a clear destination.
wizard|Wizard|.wizard-card|form|Guide organization setup through a bounded sequence with Back, Skip and one primary action.
onboarding-receipt|Onboarding receipt|.onboarding-receipt|display|Confirm the records created during setup in a short concrete list.
question-panel|Question panel|.chapter|display|Group one survey question with its response or completion status.
search-result|Search result|.search-results|display|Group household, child and event matches by meaningful record type.
icon-tile|Icon tile|.icon-tile|display|Provide a decorative leading icon beside a fully named object.
status|Status dot|.status|display|Pair a short status word with a small colour marker for fast scanning.
qr-code|QR code|.qr-code|display|Present a high-contrast machine-readable plate with a written destination and a link alternative.
authentication-card|Authentication card|.auth-card|form|Group account access fields and recovery links in a readable, bounded surface.
error-summary|Error summary|.form-summary|feedback|List invalid fields with links so users can correct a failed submission without searching.
invite-row|Invitation row|.invite-row|form|Pair a staff email address with the role being granted before an invitation is sent.
scripture-block|Scripture block|.scripture|display|Set a quoted passage apart from the teaching with its reference, read at the lesson's text size.
video-player|Video player|.video-player|display|Play a lesson video with native, keyboard-operable controls and a failure state that keeps the lesson readable.
code-sample|Code sample|.code-block|display|Show a read-only, scrollable example of code with an accessible name.
code-playground|Code playground|.code-playground|form|Edit a small page of code, run it in a sandboxed preview and keep the lesson's checklist nearby.
quiz-option|Quiz option|.quiz-option|radio|Offer one answer of a quiz question around a native radio or checkbox, and mark it correct, wrong or missed in words in the review.
achievement-badge|Achievement badge|.achievement-badge|display|Show a badge youth earn as a medal with its name and how it is earned; a locked badge says so in words, not only in grey. A collection (.achievement-badges) lists several as a labelled grid that wraps from one column on a phone.
calendar|Calendar|.calendar|table|Show a month of sessions by week, Monday first: each day lists its sessions as links with their time, today is marked, and a cancelled session says so in words and is struck through. Below 640px it becomes an agenda of only the days with sessions.
'''

COMPONENTS = []
for row in ROWS.strip().splitlines():
    slug, title, selector, kind, purpose = row.split('|')
    COMPONENTS.append(dict(slug=slug, title=title, selector=selector, kind=kind, purpose=purpose))

FOUNDATIONS = ['color', 'typography', 'spacing', 'layout', 'elevation', 'shape', 'motion',
               'iconography', 'theming', 'responsive', 'accessibility', 'content']

PATTERNS = {
    'forms': ('Forms', 'Edit a household or enroll a child through a labelled, reviewable flow.', ['form-field', 'text-field', 'select', 'form-layout', 'alert']),
    'feedback-loading': ('Feedback and loading', 'Choose feedback by duration, scope and whether staff can safely continue.', ['skeleton', 'spinner', 'progress-bar', 'toast']),
    'empty-error-states': ('Empty and error states', 'Explain the cause and offer one useful recovery action.', ['empty-state', 'error-page', 'alert']),
    'navigation': ('Navigation and page structure', 'Keep staff context and guardian reading order consistent across screen sizes.', ['breadcrumb', 'tabs', 'card']),
    'dialogs-overlays': ('Dialogs and overlays', 'Use a dialog for a short focused task and a page for long or multi-step work.', ['dialog', 'menu', 'tooltip']),
    'data-tables-lists': ('Data tables and lists', 'Choose a list for scanning and a table for column comparison; preserve filtering and selection.', ['table', 'list', 'pagination']),
    'notifications': ('Notifications', 'Use temporary feedback for acknowledgements and persistent records for work needing attention.', ['toast', 'alert', 'notification-panel']),
    'content-tone': ('Content and tone', 'Use direct, calm language that tells families what happened and what to do next.', ['inline-message', 'sms-preview', 'empty-state']),
}

EXTRA_VARIANTS = {
 'button':['primary','secondary','ghost','link','danger','icon','block'],
 'text-field':['text','email','password','number','search','prefix','suffix','counter'],
 'textarea':['default','counter'], 'select':['default','placeholder'],
 'checkbox':['single','group','description'], 'radio-group':['vertical','horizontal','card'],
 'switch':['off','on','description'], 'badge':['neutral','info','success','warning','danger','count'],
 'chip':['static','filter','removable'], 'dialog':['default','danger','form','scrollable','sheet'],
 'table':['default','dense','sortable','selectable','row-actions','sticky-header'],
 'tooltip':['text','shortcut'], 'spinner':['inline'], 'progress-bar':['determinate','indeterminate','success','danger'],
 'pagination':['previous-next','numbered','page-size'],
 'tabs':['underline','pill','counts','scrollable'], 'avatar':['initials','image','icon','group','status'],
 'link':['inline','standalone','external'], 'card':['default','interactive','header-footer','selected'],
 'empty-state':['first-run','no-results','forbidden','error'],
 'error-page':['404','403','500','offline','maintenance'],
 'skeleton':['text','title','circle','rect','card'],
 'divider':['horizontal','vertical','label'],
 'quiz-option':['single','multiple','review'],
 'achievement-badge':['earned','locked','small','collection'],
 'list':['link','text'],
 'calendar':['month','agenda'],
}

EXTRA_STATES = {
 'button':['loading','pressed','expanded'], 'text-field':['invalid','read-only','required'],
 'textarea':['invalid','read-only'], 'select':['invalid'], 'checkbox':['checked','indeterminate','invalid'],
 'radio-group':['checked','invalid'], 'switch':['checked'], 'file-upload':['dragover','loading','failed'],
 'date-picker':['invalid'], 'tabs':['selected'], 'menu':['open','checked'],
 'dialog':['open','busy','invalid','failed'], 'drawer':['open','busy'],
 'chip':['selected'], 'card':['selected'], 'table':['loading','empty','error','selected'],
 'accordion':['expanded'], 'roster':['in','out','missing','absent','queued'],
 'sync-status':['queued','synced','failed'], 'signature':['empty','signed'],
 'notification-panel':['unread','read','empty'], 'wizard':['busy','invalid','failed'],
 'quiz-option':['selected','correct','wrong','missed'],
 'achievement-badge':['earned','locked'],
 'calendar':['today','outside','cancelled'],
}

KEYBOARD = {
 'button': [('Tab / Shift+Tab','Move through enabled controls in DOM order.'), ('Enter / Space','Activate a button or toggle its pressed state.')],
 'link': [('Tab / Shift+Tab','Move to and from the link.'), ('Enter','Navigate to its named destination.')],
 'input': [('Tab / Shift+Tab','Move among labelled fields.'), ('Typing / platform keys','Edit the native value; preserve paste and password managers.')],
 'checkbox': [('Tab / Shift+Tab','Move between choices.'), ('Space','Toggle the focused checkbox or switch.')],
 'radio': [('Tab / Shift+Tab','Enter or leave the group at its selected item.'), ('Arrow keys','Select the previous or next option.'), ('Space','Select the focused option.')],
 'menu': [('Enter / Space','Open the menu and focus its first enabled item.'), ('Arrows / Home / End','Move among enabled menu items.'), ('Printable character','Move by item name.'), ('Escape','Close and return focus to the trigger.')],
 'tabs': [('Tab','Enter at the selected tab, then move to the panel.'), ('Left / Right / Home / End','Move tab focus; manual activation prevents unexpected work.'), ('Enter / Space','Activate the focused tab.')],
 'dialog': [('Tab / Shift+Tab','Cycle within the open modal.'), ('Escape','Close when safe and return focus to the opener.'), ('Enter','Activate the focused action; do not imply destructive consent.')],
 'disclosure': [('Tab','Focus the summary.'), ('Enter / Space','Expand or collapse the details.')],
 'navigation': [('Tab / Shift+Tab','Move through links in visual and DOM order.'), ('Enter','Navigate; retain the current-page indicator.')],
 'form': [('Tab / Shift+Tab','Move through controls in reading order.'), ('Enter','Submit only from the expected form context; retain values on failure.')],
 'display': [('Tab','Only actual links and buttons receive focus; descriptive containers do not.')],
 'feedback': [('Tab','Reach an action or dismiss button if present; do not focus routine status messages.')],
 'progress': [('Tab','Progress itself is not focusable; reach only associated controls.')],
 'table': [('Tab','Reach sort, selection and row-action controls; static cells are not tab stops.')],
 'tooltip': [('Tab','Focus the owning control and reveal the description.'), ('Escape','Dismiss without moving focus.'), ('Pointer hover','Reveal the same description; allow moving over it without dismissal.')],
}
