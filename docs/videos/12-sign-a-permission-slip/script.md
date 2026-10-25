# 12 · Sign a permission slip

The slip Marisol sent in the last video lands on Carmen's phone as a text with a link. This video follows Carmen from that text to a signed slip, in Spanish, with no account and no password, and shows what PromiseHub records when she signs, what happens when a family declines, and how the link protects the family's details.

## What signing promises

Each child gets a link, sent to the household's phone or email. The link alone shows nothing. The first time a phone opens it, the guardian types a number or email the organization has on file and gets a six-digit code that lasts ten minutes. Three wrong codes pause the link for fifteen minutes. A verified phone opens that family's links for thirty days without another code. The page is in the household's language, and the signature keeps the typed name, the time, the device, the language, and a fingerprint of the exact text the guardian agreed to.

## Carmen signs

Here is Carmen's phone. The household's language is Spanish, so the page is too. She types her number, gets the code by text, and enters it. The slip opens for Mateo: the trip, the date to sign by, and his details to check, his allergies, his medication and who to call. She answers the two questions, types her full name and taps to sign. The receipt thanks her by name, and on Marisol's side Mateo now counts as signed.

## Dana declines

Jordan can't go on the trip. Dana opens his link on her phone, which she has already verified, taps Jordan can't come, adds that the family is away, and confirms. The page says Jordan won't go, and the slip's tracking shows him as declined.

## Keeping families safe

The name must match a guardian of the child, or signing is refused right on the page. Once the event has started, the slip closes. A month after the sign-by date, or as soon as the family's phone number changes, the link stops working, and the page offers the organization's number instead.

## How it is tested

Backend tests cover the code request that never reveals which contacts are on file, the code itself, the lock after three wrong codes, a verified device opening the family's other links but never another family's, the pre-filled slip, signing with what the record keeps, a name that doesn't match, declining, a closed slip, an expired link, a revoked link after a contact change, and the module switched off. The browser tests repeat the guardian's path on phone and desktop with an accessibility check on every state.

## Recap

Things to remember. No accounts: a link plus a six-digit code. The page speaks the family's language. The signature records who, when, on what device, and exactly what they agreed to. Next, reminders that chase unsigned slips.
