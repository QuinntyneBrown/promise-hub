# 77 · Reset a password as a youth or mentor

Youth and mentors now sign in to PromiseHub with their own accounts, and sooner or later one of them forgets a password. This video shows how anyone, staff, youth or mentor, gets back in on their own: a link by email that never reveals whether an address has an account, at most three of them an hour, only the newest one working, one password rule for everyone, and every other session signed out.

## Asking for a link

Sofía Rivera is twelve and in After-School Tutoring at Harbourview Youth Collective. On her phone she opens sign in and follows Forgot your password. The field is labelled Email, not Work email, because the same page serves every role. She types her address and asks for a link. The page says Check your email, and shows her address masked, the first letter, four dots and the domain, so a shared phone never shows it in full. The link works once, for one hour.

## The same answer for everyone

The server answers accepted for every address. An address with no account, an account that an admin deactivated, or a membership that was removed gets exactly the same page, and no email goes out. Nothing on the screen or in the response tells someone guessing whether Sofía has an account.

## Resend, with a limit

Didn't get it? Sofía taps Resend the email, and a toast says Sent again. Every new link replaces the earlier ones, so only the newest link works. The server sends at most three links to an account in an hour. A fourth request answers the same way and sends nothing, so the limit reveals nothing either, and it protects her inbox from someone pressing the button for her.

## Choosing a new password

Sofía opens the emailed link. The page checks it first, then names her account. She tries a password with her own name in it, and the shared policy refuses it: don't use your email in your password. The same rule applies to staff, mentors and youth, at least twelve characters and at most one hundred and twenty eight. She chooses another one, types it twice, and she is signed in. Every other session of hers ends, in every organization, and the reset is audited in the organization her new session starts in. A toast says Password updated, other devices were signed out, and she lands on Learning, the home for her role.

## A mentor on a laptop

Daniel Osei mentors Sofía's cohort. He resets on a laptop the same way and lands on Mentoring, with the same toast.

## Modules off and other states

Identity belongs to no module and is always on, but the home it opens follows the modules. Lucía Rivera is a youth at Northgate, where Learning and Mentoring are off. After her reset she lands on Today, and nothing from Learning is fetched; Learning answers not found for her. An address without an at sign is refused inline. An earlier link that a newer one replaced, a link older than an hour, a used link, or one whose account was deactivated after it was sent says This link has expired, with Send a new link. A save that fails keeps the form and says it didn't save.

## Secrets stay secret

Only the hash of each link is stored, and the password only as a salted hash. The request log records the route template, never the token or the password, and the audit entry names the account and nothing else. The token appears in the clear in one place only: the email.

## How it is tested

The API tests in PasswordResetForEveryRoleTests cover a youth and a mentor getting links, the same answer for unknown and deactivated addresses, the limit of three an hour, only the newest link working, a link failing after deactivation, the policy, sessions ending in both of Priya's organizations, the audit in one organization only, Learning still answering not found at Northgate, and the logs. The browser tests in reset a password walk Sofía, Daniel and Lucía on a laptop and a phone against the fake API, with accessibility checks on every state.

## Recap

Things to remember. Anyone with an account resets their own password, and the answer never says whether an address has one. Three links an hour, only the newest works, once, for an hour. One password rule for everyone, every other session ends, and you land on the home of your role. Next, managing your personal settings.
