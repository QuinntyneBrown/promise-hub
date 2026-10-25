# 02 · Sign in securely

Every staff page in PromiseHub now sits behind a sign-in. This video shows Jaylen and Tom signing in, what happens when a password is wrong or keeps being wrong, why Tom is asked for a code, and how the server, not the screen, decides who may do what.

## What sign-in promises

Valid credentials land you on Today. Five failures in fifteen minutes pause sign-in, without ever revealing whether the email exists. Admins and program directors enter a six-digit code. A session that sits idle for twelve hours ends, and signing back in returns you to where you were. And every request is checked on the server against your role.

## Jaylen signs in

Here is Jaylen at the sign-in page on a laptop. He mistypes his password first. The message says the email and password don't match, keeps his email and clears only the password. With the right password he lands on Today. His avatar opens the account menu, with his name, his role and Harbourview Youth Collective, and Sign out.

## Wrong, and wrong again

The same message answers a wrong password and an email nobody has, so the page never confirms who has an account. After five failures in fifteen minutes the server pauses sign-in for that email, known or not, and the page says until when and offers a password reset.

## Tom enters a code

Tom is an admin, so after his password the server asks for a code from his authenticator app. Until the code is right, nothing but the code step is open to him. On a phone it is one field, one switch and one button.

## Sessions and the server

The session is a cookie the browser cannot read from script, sent only over HTTPS and only to PromiseHub. After twelve idle hours it stops working; the next request answers session expired, and sign-in says your session timed out, then takes you back to the page you were on. Roles are checked on the server for every request: a site lead who asks for the organization settings gets forbidden, whatever the screen shows. Every sign-in is written to the audit log.

## How it is tested

Backend tests drive the real cookie sign-in with a fake clock: lockout, the fifteen-minute pause, the code step, sign out and a twelve-hour expiry. The browser tests sign in against the fake API at phone and desktop widths, with an accessibility check on every state.

## Recap

Things to remember. One message for every failed sign-in. Five failures pause any email for fifteen minutes. Admins and directors enter a code. The server checks the role on every request. Next, admins choose which modules their organization uses.
