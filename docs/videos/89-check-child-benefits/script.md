# 89 · Check child benefits

The Learning Bond is one benefit. Families with lower incomes are often missing others. This video follows Carmen Rivera as PromiseHub checks every child benefit her family may qualify for. Each one is applied for on its own, and nothing is sent until she says so.

## The offer, and its own consent

On Mateo's confirmation, the agent offers to check child benefits. It takes about three questions. Carmen chooses Check benefits. Not now would hide the offer here, and it would stay on her Learning Bond page for later. Benefit details need a consent of their own, separate from the Learning Bond. The wording says PromiseHub may use what she has already given, plus her household size, marital status and whether she gets the Canada Child Benefit, to check and apply for the benefits she chooses. She ticks it and signs with her name. Without that consent, every benefits endpoint answers forbidden.

## Three questions

The agent reuses what it already has: Mateo's and Sofía's details, Carmen's SIN and her tax answer. It asks at most three facts more: how many people live with her, her marital status, and whether she gets the Canada Child Benefit now. It also asks whether her income has changed a lot since her last return. If it has, every estimate carries a note. For a separated or divorced parent, it asks who claims each child. If nobody is sure, the check stops for that child, and staff can help. The answers are stored encrypted, never in clear.

## Each benefit, one state

Then the list. Each benefit comes from a catalogue the platform maintains: federal programs, Ontario's, and Hamilton's, because that is where Harbourview is. Rules on the server compute each estimate, never the language model, and every card shows its source and rule version. Each benefit shows exactly one state. The Ontario Child Benefit: apply now, about sixteen hundred and eighty dollars a year. Hamilton Recreation Assistance needs a document first. The Child Disability Benefit is not eligible, with the reason: neither child has an approved Disability Tax Credit certificate. And the Canada Child Benefit sits under You already get these.

## Apply now, one at a time

Apply now opens the Ontario Child Benefit's own application, filled in from what Carmen has given. Her SIN shows only its last three digits. She adds her address, and the page says this sends her application to the Ontario Child Benefit, only this one. There is no Submit all. Submit sends it once, and a second tap sends nothing more. The submission is recorded in the audit log without any number.

## A form she sends herself

Hamilton takes its program on paper or by email. On a laptop, Carmen uploads her hydro bill as proof of address. It is encrypted, and goes only with this application. Apply now then gives her the filled form as a PDF, with where to send it. The SIN box is left blank for her to fill in, because PromiseHub never prints a full number. She sends it herself and taps Mark as sent.

## How it is tested

The API tests cover the offer and Not now, and the consent, without which everything is forbidden. They cover the intake's checks and the child nobody is sure about. They check that the catalogue's states and amounts come from its rules, and that a city with no local programs says so. They check that Apply now sends one benefit once, that the form path never prints a SIN, and that another household's link reaches nothing. In the browser, the benefits spec walks Carmen through all of it on a laptop and a phone, with accessibility checks, against the fake API.

## Recap

Things to remember. The benefits check has its own consent. It asks three questions and reuses the rest. Each benefit shows one state, computed by the platform's rules. Each application is sent on its own, only when Carmen says so, and a paper form never carries her full SIN. Next, reminders on the dates that matter, and the running total.
