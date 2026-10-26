# 29 · Manage staff access

Every person who can see a child's allergies or a family's phone number should be there on purpose, with the right role, and gone the day they leave. This video shows how Tom, the admin, invites a new youth worker, changes a role and removes access.

## What staff access promises

Only admins manage staff. An invitation goes to a work email with a role, and its link lasts fourteen days until it's accepted or withdrawn. Someone who already has access can't be invited twice. A new role applies the next time that person does anything. Removing someone signs them out on their next action, while everything they recorded keeps their name. Admins can't change or remove themselves, so there's always an admin. Every change is recorded.

## Tom invites Sam and promotes Jaylen

Here is Staff and roles on Tom's laptop. He taps Invite staff, enters Sam's work email, leaves the role as youth worker, and sends it. Sam appears under invitations waiting. Then Tom changes Jaylen's role to program director, and the list shows it straight away.

## Removing access

When Aisha leaves, Tom removes her access with one confirmation. Her next request is refused, but her check-ins and reports still say Aisha Bello. Other roles who open this page are told only admins manage staff.

## How it is tested

Backend tests cover the invitation and its email, invalid and duplicate invitations, a role change applying on the next request, an admin unable to change or remove themselves, removal ending the next request and keeping history, withdrawing an invitation, other roles refused, another organization's staff not found, and the audit entries. The browser tests follow Tom through each step on phone and desktop with accessibility checks.

## Recap

Things to remember. Invitations by email, with a role. Role changes and removals take effect on the next action. History keeps everyone's name. Next, accepting an invitation and starting a shift.
