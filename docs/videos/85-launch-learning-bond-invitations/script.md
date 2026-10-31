# 85 · Launch Learning Bond invitations

The agreement is accepted, coverage is chosen and the invitation reads well. Now the families have to hear about it. This video follows Tom Nguyen, Harbourview's admin, as he plans the launch, and then the staff who help families once the texts go out.

## Plan the launch

Tom opens Settings, Learning Bond, and chooses Plan the launch. The page counts the covered households and how each can be reached. Four are covered, through After-School Tutoring and Saturday Sports. Three have a guardian with a mobile number, so they are invited by text. None has only an email this time, and one has neither. Only counts appear here, never a contact.

## Households to collect from

View households to collect from lists the households with no mobile number or email, by name, guardian and program, each linking to its household. Staff collect a number at check-in, and the household is invited on the next run.

## Choose a day

Tom chooses Send invitations on a day. The day has to be from tomorrow to ninety days ahead, in Harbourview's time zone, so today is refused: choose a date from tomorrow to ninety days ahead. He picks Monday the ninth of November. The page now says the launch is scheduled for ten in the morning that day, with three by text and none by email, and the form only moves the day. Scheduling is audited.

## Cancel the launch

Until the day comes, Tom can change the date or cancel. Cancel the launch asks first, and says nothing has been sent. Cancelling sends nothing and is recorded in the audit log.

## How the launch sends

On the day, at ten o'clock in the organization's time zone, the send job, which already runs for every organization, sends one invitation per covered household. It goes through Messages, so the monthly text cap and the email fallback apply, and a suspended organization, or one with Learning Bond turned off, sends nothing. Each text is in the household's language, starts once with the sender name, names each eligible child, Mateo y Sofía for the Riveras, and carries the household's own link. A household invited in the last seven days is never invited again.

## Staff invite at the door

Instead of a day, Tom can choose Staff invite at the door. Nothing is sent in bulk. On a covered household's page, staff whose role sees status find a Learning Bond card: not invited yet, covered through After-School Tutoring. Invite to Learning Bond shows the text Dana Thompson will get, in English, naming Jordan, with its length and segments. Send invitation texts her at once, and the card now says invited, Thursday the fifth of November.

## Covered households and their status

Staff in the status roles also have Learning Bond in their menu. It lists every covered household with its status and when it last changed, filtered by status and by program: not invited, invited, call requested and, as families start their claims, the steps they reach. Nothing else about a claim ever appears here, and a test checks that no staff response carries a social insurance number, income or amount.

## A call request

Linh Tran would rather talk to someone. She left her number and asked for an afternoon call, so the Tran household reads call requested, with her number, and the status roles were notified. After calling, Tom chooses Mark call done. Resumed returns the family to where it was, no answer keeps it call requested to try again, and not interested, which Linh chose, ends the texts. The outcome is audited.

## On a phone, and when things fail

The households and the launch work on a phone, one column at a time. Each household keeps its status beside its name, and while a call is requested, the number to call sits right under it, with Mark call done in reach. The launch page stacks its four counts above the form. When no covered household has a mobile number, Launch is disabled with the reason: add guardians' mobile numbers before launching. And a site lead whose role is not in the status roles has no Learning Bond in the menu and is told their role doesn't see Learning Bond status.

## How it is tested

The API tests cover the counts and the missing contacts, the day's range, the pending agreement version and the no-mobile block, a launch that sends at ten on its day and never twice, a moved, cancelled, suspended or switched-off launch, the invitation at the door within seven days, the households with their filters, the session flag, the call request and its outcomes. Each runs as another organization and as a role outside the status roles. In the browser, the launch, invite, and households specs walk Tom and Jaylen on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. The launch page shows counts, never contacts. A scheduled launch sends at ten on its day through Messages, once per household, in its language, naming each child. At the door, staff in the status roles invite one household at a time, never twice in seven days. Staff see status and call requests only. Next, a guardian follows the link and claims the Learning Bond.
