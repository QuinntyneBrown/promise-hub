# 50 · Sign in as a youth or mentor

Youth and mentors cannot use anything Learning or Mentoring brings until they can sign in. This video shows how they sign in to PromiseHub, where each of them lands, and what happens when sign-in goes wrong: too many tries, a shared device, a session that timed out, and an account that was turned off.

## One sign-in, a home per role

There is one sign-in page for everyone. The email field now just says Email, because a twelve-year-old has no work email. After the password, PromiseHub reads the session and picks a home: youth go to Learning, mentors go to Mentoring, and everyone else goes to Today, as before. If someone opened a link before signing in, that link wins.

Here is Sofía, a youth at Harbourview, on her phone. She types her email and password, and lands on Learning. Her program has not published a track yet, so the page says so.

Daniel, a mentor, signs in on a laptop and lands on Mentoring. Nobody is assigned to him yet, so his list is empty.

## When the module is off

The home only points at a module that is on. Lucía is a youth at Northgate, where Learning is off. She signs in and lands on Today, which says there is nothing to do yet. Learning is not linked, not loaded and not prefetched, and its address answers not found on the server.

## Too many tries

Five wrong passwords in a row lock that email for fifteen minutes, whether or not it has an account. Here Sofía has four wrong tries already. The fifth gets the usual message, the one that never says whether the email exists. Then, even with the right password, sign-in is paused until a stated time, and the page offers to reset the password.

The count is now consecutive: a successful sign-in starts it again. When a lock starts, it is written to the audit log of every organization the email belongs to, and no other. A password reset by emailed link ends the lock, is audited as an unlock, and lands the youth on her own home.

## Signing out of a shared device

Youth often share a phone or a program laptop. When Sofía signs out, the server records that this session ended, so even a copy of the cookie stops working. The device forgets everything PromiseHub kept on it, including saved rosters and Quick Cards, and the page says she is signed out. Going back shows sign-in, not her lessons.

## Timed out, or turned off

A session idle for twelve hours times out. The next page shows sign-in with the reason, and after signing in again she returns to where she was.

If an admin removed someone's access everywhere, the right password now shows an inactive page: access was turned off, nothing was deleted, and the program director or admin can turn it back on. A wrong password still gets the generic message, so the page never reveals whether an email has an account. Someone removed from one organization simply continues in their other one.

## How it is tested

The API tests sign in youth and mentors and check the session carries only their own organization's role and modules, and that Learning and Mentoring answer not found where they are off. They check the consecutive lock, the audit entries per organization, the unlock by reset, the copied cookie after sign-out, the cookie flags, and the inactive answers. The browser tests run each journey on a phone and a laptop against the fake API, with accessibility checks on every page.

## Recap

Things to remember. One sign-in, and a home for each role while its module is on. Five wrong tries lock the email, and a reset ends the lock. Sign-out ends the session on the server and clears the device. Next, youth and mentors accept their invitations.
