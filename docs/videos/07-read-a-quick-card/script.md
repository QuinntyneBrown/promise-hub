# 07 · Read a Quick Card

When a child has an allergic reaction, nobody should scroll. The Quick Card puts what matters first. This video shows Jaylen opening Mateo's card from tonight's roster, what a volunteer coordinator sees instead, and how every open is recorded.

## What the Quick Card promises

The severe allergy alert is always the first thing on the card, with what to do. Then the medical facts, then who to call in order, each number one tap away, then who may pick the child up, and notes. Medical details are kept from roles that should not see them, by the server, not the screen. And every time anyone opens a card, the audit log records who opened whose card and when.

## Jaylen opens Mateo's card

Here is Jaylen at check-in on his phone. Mateo's name is a link. One tap, and the card opens with a red alert: a severe allergy to peanuts and tree nuts, and the instruction to use the EpiPen in his backpack's front pocket, call 911, then Carmen. Below it are his medication, his doctor and his health card, shown only as the province and the last four digits. Carmen's number is the first in the call list, and it dials when tapped. Luis is the backup.

## When there is nothing medical

A child with no medical information gets a card that says so plainly, rather than an empty section that could be mistaken for a loading problem. Who to call and who may pick up are still there.

## What others see

Priya is a volunteer coordinator. When she opens the same card, the server leaves the medical details and the alert out of the response entirely, and the card says they are hidden for her role. She still sees who to call and who may pick Mateo up, because in an emergency everyone needs those. Her open is recorded too.

## How it is tested

Backend tests check the alert and its order, the masked health card, the call order, the audit entry for every open, the restricted response for volunteer coordinators, the empty case, another organization's child, and the module switched off. The browser tests open the card from check-in, check the tel links, the empty and restricted states, and that names are plain text when Quick Cards is off, at phone and desktop widths with an accessibility check on every state.

## Recap

Things to remember. The alert comes first. Numbers are one tap away. Medical details never leave the server for roles without access. Every open is audited. Next, signing children out to the right adult.
