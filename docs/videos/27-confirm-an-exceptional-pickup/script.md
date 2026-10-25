# 27 · Confirm an exceptional pickup

Sometimes the adult at the door isn't on the list: an aunt who was never added, a neighbour helping out, or someone nobody knows. Staff can't let the child go on a guess. This video shows how Jaylen asks the guardian with one tap, how the guardian answers from their phone, and what happens when the answer is no.

## What confirming a pickup promises

When someone outside the approved list arrives, staff can still call the guardian, or ask by text from the sign-out screen. The text links to the family's page, where the guardian sees who is waiting and approves or refuses. An approval counts as the guardian's okay. A refusal keeps the child with staff, blocks that adult from signing them out, and is logged as a pickup incident. Every answer is recorded.

## Jaylen asks Carmen

Here is the sign-out on Jaylen's laptop. Rosa Alvarez has come for Mateo, and she isn't on his list. Jaylen chooses someone else, types Rosa's name and taps Ask Carmen by text. The dialog waits for Carmen's answer. A few seconds later she approves from her phone, the dialog says so, and Jaylen signs Mateo out with Rosa.

## When the answer is no

On Carmen's phone, the family page shows who is waiting, with Approve and Refuse. If she refuses, the dialog on Jaylen's screen says so, the sign-out button is switched off, and an incident is logged for Marisol to review, already filled in with the child, the adult and the time.

## How it is tested

Backend tests cover the text with the family link, an approval allowing sign-out without the phone switch, a refusal blocking that adult and creating the incident, a request that can't be decided twice, another household or organization refused, a child not checked in, and the module switched off. The browser tests follow Jaylen through both answers and Linh approving on her page, with accessibility checks.

## Recap

Things to remember. Ask by text when you can't call. The guardian answers from their phone. A refusal keeps the child and becomes an incident. Next, sending messages to families.
