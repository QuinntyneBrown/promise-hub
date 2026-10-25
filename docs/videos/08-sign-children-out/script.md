# 08 · Sign children out

Check-in tells you who arrived. Sign-out closes the loop: it says who each child left with, and it makes sure that adult was allowed to take them. This video shows Jaylen signing Mateo out to his mother, what happens when someone not on the list turns up, and how the rules are enforced and tested.

## What sign-out promises

A child leaves only with an adult on their approved list, or with someone else the primary guardian okays by phone. Staff check photo ID, or confirm they know the person. The attendance record keeps who collected the child and when, and the change is audited. Sign-out belongs to the Pickup module, so an organization that has not switched it on never sees it.

## Jaylen signs Mateo out

Here is Jaylen at the end of tutoring night, on his phone. Every checked-in child now has a Sign out button. He taps it for Mateo. The dialog lists Mateo's approved adults, Carmen first because she is the primary guardian, then Luis, marked to ask for ID. Carmen is at the door, so Jaylen picks her and taps Sign out. A toast confirms Mateo left with Carmen, and the row now shows the time and her name.

## Someone not on the list

Now a cousin, Daniel, arrives instead. Jaylen chooses Someone else. The dialog warns that Daniel is not on the approved list and puts Carmen's number one tap away. If Jaylen tries to sign Mateo out before Carmen has said yes, the server refuses and says so. Once Carmen confirms on the phone, Jaylen switches that on and Mateo is signed out to Daniel, with the phone okay kept on the record.

## The states on screen

The dialog has a state for every outcome: the approved list, the someone-else warning, the error when no one is chosen, and a failure message that keeps the choice so Jaylen can try again.

## How it is tested

Backend tests cover the approved list in order, a sign-out recorded once even when the tap is sent twice, the audit entry, someone else with and without the okay, a guardian from another household refused with whom to call, a child who is not checked in, volunteer coordinators refused, another organization's child and guardian, and Pickup switched off. The browser tests walk the same paths on phone and desktop, with an accessibility check on every state.

## Recap

Things to remember. Only approved adults, or someone the guardian okays by phone. Photo ID is part of the step. The record keeps who and when, and every sign-out is audited. Next, recording attendance as a youth worker.
