# 13 · Resolve missing slips

Even with links and codes, some slips are still unsigned when the bus is about to leave. This video shows how PromiseHub chases them: reminders that go out on their own before the deadline, a check-in screen on the day that puts the missing children first, a tablet a guardian can sign at the bus door, and a quick reminder a director can send by hand.

## What the day-of promises

Reminders follow the slip's schedule, at six in the evening in the organization's time zone, twice a week or daily until the sign-by date. Each one goes only to families who haven't answered, each with fresh links for their own children, and a family is never reminded twice for the same slot. A family that can't be reached at all, because their email bounced and they have no mobile, is listed for staff instead of being retried forever. On the day, check-in shows who is cleared, who is missing a slip and who declined, missing first.

## At the bus door

On the morning of the trip, Jaylen opens check-in on his phone. It shows one cleared, two missing slips and one declined, with a warning that children without a signed slip can't go. Sofía and Yusuf are at the top. Carmen is at the door, so Jaylen taps Sign on tablet for Sofía. The tablet screen tells Jaylen to hand it to Carmen, shows the trip and what she is agreeing to, and Carmen types her name. Sofía is cleared at once, Carmen gets a copy by text, and the signature records that it was signed on Jaylen's tablet.

## Text the unsigned

Back at the office, Marisol opens the slip and taps Text unsigned. The dialog lists the families still to answer, when they were last reminded, and flags the Haddads, who can't be reached. The message fills in each family's children and links. If she deletes the link placeholder, PromiseHub refuses to send, so no family gets a reminder they can't act on.

## The screens

Two screens: the trip's check-in on the day, and the tablet page in the guardian's hands.

## How it is tested

Backend tests cover the schedule slot, reminding only unsigned families once per slot with their links, unreachable families listed instead of retried, the manual reminder with and without the link placeholder, the day-of order and counts, signing on the tablet with the right and wrong name, volunteer coordinators refused, another organization's slip, and the module switched off. The browser tests repeat the bus door and the reminder on phone and desktop, with an accessibility check on each.

## Recap

Things to remember. Reminders run themselves, once per slot, only to families who haven't answered. Missing slips come first on the day. A guardian can sign on the tablet in the same record format, witnessed by the staff member. Next, enrolling a child.
