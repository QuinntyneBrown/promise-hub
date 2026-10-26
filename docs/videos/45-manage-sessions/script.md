# 45 · Manage sessions

Phones get lost, and shared computers get left signed in. This video shows the account page, where staff see their details, make recovery codes for when a phone goes missing, and sign out every other device in one step.

## What the account page promises

Every staff member has an account page, opened from the account menu. It shows their name, email, mobile, role and organization, and how many recovery codes they have left. Making new recovery codes shows ten codes once; only scrambled versions are stored, and the old codes stop working. Signing out everywhere else ends every other session the next time it asks for anything, while the device in hand stays signed in. All three are recorded in the audit log.

## Jaylen secures his account

Here is Jaylen's account on his laptop. He makes new recovery codes, and ten appear, once, with a reminder to save them now. Then he signs out everywhere else, because he left the office computer signed in. The toast confirms the other devices are signed out, and he's still here.

## How it works underneath

Each sign-in carries a session version. Signing out everywhere raises it, so any older session is refused on its next request, and a fresh sign-in picks up the new version.

## How it is tested

Backend tests cover the account details, ten new codes stored only as hashes and replacing the old ones, another session refused after signing out everywhere while this one stays, signing in again working afterwards, and no session answering unauthorized. The browser tests cover opening the account from the menu, making codes and signing out other devices, with accessibility checks.

## Recap

Things to remember. Recovery codes are shown once and stored scrambled. Signing out everywhere keeps this device. Every step is on the record. Next, recovering account access.
