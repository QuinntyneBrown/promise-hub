# 51 · Accept an invitation as a youth or mentor

Youth and mentor accounts in PromiseHub are made by invitation, never by sign-up. This video shows how an admin invites a youth from the child record and a mentor from Staff and roles, how the invitee sets a password and lands on the home of their role, and what happens when a link runs out.

## One invitation for every role

Staff invitations already existed: an admin types a work email and a role, and PromiseHub emails a single-use link that lasts fourteen days. This slice extends that same invitation instead of adding a second system. A youth invitation also names the child record the new account will link to, so a youth account always belongs to exactly one child.

## Inviting a youth from the child record

Here is Tom, an admin at Harbourview, on Yusuf Haddad's record. Yusuf is thirteen and has no youth account yet, so the Youth account card offers one invitation. Tom types Yusuf's own email, not a guardian's, and sends it. The card now shows the invitation waiting and when it expires.

The card appears only for admins, only while Learning is on, and only for children aged twelve to eighteen. The server checks the same things: with Learning off both endpoints answer not found, another organization's child is not found, and every other role gets forbidden. A child who already has an account, or an invitation waiting, is named and nothing is sent.

## Mentors and volunteers

Mentors and volunteers are invited from Staff and roles like any staff role. Mentor is offered only while Mentoring is on, and the server refuses it otherwise. A youth invitation from Staff and roles is refused too, because youth come from their child record.

## Accepting, with one password rule

Yusuf opens the link on his phone. He sees who invited him, to which organization and as what, and his name is already filled in from his record. The password follows one rule everywhere a password is set: at least twelve characters, and not containing the name part of the email. His first try includes his email, so it is refused with a clear reason. The second one works, he is signed in, and he lands on Learning.

Grace, invited as a mentor, does the same on a laptop and lands on Mentoring. A volunteer lands on Today, and staff roles still continue to the phone step. A link that was already used, or withdrawn, says it can't be used and offers sign in.

## When the link expires

If Yusuf opens his link on day fifteen, he gets its own page. One button asks Tom for a new link. No account and no form are needed, because the expired link itself says which invitation it is. Asking twice records it once.

On Staff and roles, Tom sees the expired invitation marked as asking for a new link, and every admin gets a notification. Resend issues a fresh link that lasts fourteen days, and the old link stops working at once. Withdraw ends an invitation immediately. All of it is audited in that organization only.

## How it is tested

The API tests invite a youth and check the email, the audit entry and the child link after accepting, the age and duplicate rules, the module-off and cross-tenant answers, and the roles that are forbidden. They check the password rule on both the invitation and the reset, resend and withdraw, the reasons a link is gone, and that a request for a new link is recorded once and never reaches another organization. The browser tests run each journey on a phone and a laptop against the fake API, with accessibility checks on every screen.

## Recap

Things to remember. One invitation serves every role, and a youth invitation links to its child. The same password rule applies everywhere. An expired link asks for a new one, and Resend replaces it. Next, a guardian gives consent for a youth.
