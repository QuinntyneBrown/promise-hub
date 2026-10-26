# 40 · Switch organizations

Some people help more than one organization. Priya coordinates volunteers at Harbourview and at Northgate. This video shows how she moves between them, and why nothing from one ever shows up in the other.

## What switching promises

A person can belong to several organizations, with a different role in each. One organization is active at a time. When someone belongs to two or more, the top bar shows a switcher with the active one marked. Choosing another moves the signed-in session to that membership and reloads the app, so every screen and every request after that belongs to the new organization. The switch is recorded in that organization's audit log. If someone is removed from the organization they're working in, their next request moves them to the one they still belong to.

## Priya switches to Northgate

Here is Today on Priya's laptop, in Harbourview. She opens the switcher, which lists both organizations with her role in each. She picks Northgate. The app reloads, and Today shows Northgate's numbers and what's coming up there.

## One organization, no switcher

Aisha only works at Harbourview, so she never sees a switcher. On a phone, Priya's switcher sits beside the logo.

## How it is tested

Backend tests cover listing both memberships with the active one marked, switching and seeing only Northgate's families, the switch audited, refusing someone else's membership, and falling back to the remaining organization when a membership is removed. The browser tests cover the switcher, switching and reloading, a removed membership, and a person with one organization, with accessibility checks.

## Recap

Things to remember. One active organization at a time. Switching reloads everything. Removal falls back safely. Next, managing billing.
