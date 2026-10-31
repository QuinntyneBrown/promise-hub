# 84 · Sign the data-handling agreement

Not every admin can sign for the organization. This video follows the person who can: Reverend Angela Baptiste, the board chair of Northgate Community Church Kids. She has no PromiseHub account. Grace Mensah, Northgate's admin, names her, and Angela accepts the Learning Bond data-handling agreement through a single-use link.

## Grace names the signer

Grace opens the agreement in Settings. Learning Bond is still off at Northgate, because the agreement has to be accepted first. She chooses Ask someone else to sign, and enters Angela's name, her title, board chair, and her email. The link goes out from Northgate Community Church Kids via PromiseHub, and the page waits for Angela, with Resend and Cancel.

## The email Angela receives

Grace can see exactly what Angela was sent. See the email opens a preview, built with the same email preview component as the guardian invitation. It says who asked, what Learning Bond is, why someone with authority has to accept, and that the link works once, for fourteen days. Where the email has its link, the preview shows Read and accept, because PromiseHub keeps only a hash of the link and could never show it again.

## Angela opens the link

Angela opens the link on her laptop. There is no sign-in. The page names the organization and who asked her, and shows the agreement in full: what we collect, where it goes, and what your organization sees. The page lives in the settings library, beside the agreement page, so the Learning Bond library is never downloaded while the module is off.

## The authority box

Angela chooses Accept without ticking the box. Nothing is stored, the link still works, and the reason appears beside the box: confirm you have authority to accept this agreement for Northgate Community Church Kids. She ticks the box, I, Reverend Angela Baptiste, have authority, and accepts.

## Thank you

The page thanks her and shows what was recorded: her name, her title and her email, the version and the time. The acceptance has no membership, because Angela has none. It goes into Northgate's audit log as Signer: Reverend Angela Baptiste. The link is now used, and opening it again says it has expired.

## On a phone

The same link works on Angela's phone, which is where most people open an email. The page has no menus and no sign-in, just the organization's name at the top. The agreement reads in one column, each section with its heading, and nothing scrolls sideways. When she reaches the end, the authority box and Accept sit below it, and the thank-you page fits the screen the same way.

## Grace is told

Grace is told in two ways. A notice in the app says Angela, board chair, accepted the Learning Bond data-handling agreement, version two, and an email says the same. The notice belongs to a new kind, Learning Bond agreement, which needs only Roster and Messages, so Grace sees it even though Learning Bond is still off. The agreement page shows Accepted by Reverend Angela Baptiste, and offers Turn on Learning Bond. This time Modules turns it on.

## Links that no longer work

A used link, one that has passed its fourteen days, one Grace cancelled, one replaced by Resend, or one from a suspended organization all say the same thing: this link has expired, ask Northgate Community Church Kids to send a new one. PromiseHub keeps the hash of every link it issued, so even a replaced link knows whom to ask. A link PromiseHub has never seen gives the same words without naming anyone. If the page fails to load, Try again reads the link again and uses nothing up.

## How it is tested

The API tests open the link with no sign-in while Learning Bond is off, refuse Accept without the box, record the acceptance with the signer's name, title and email, check the notice, the email and the audit entry, and prove the link then answers gone. They cover replaced, expired, cancelled and suspended links, an unknown link, and that Northgate's signer changes nothing of Harbourview's. In the browser, the signer specs walk Angela on a laptop and a phone with accessibility checks, and Grace's spec opens the email preview, all against the fake API.

## Recap

Things to remember. The signer needs no account: the link is the only key, and only its hash is kept. The authority box is required, and a refusal uses nothing up. Accepting records the signer's name, title and email, tells the admin in the app and by email, and kills the link. Every dead link says whom to ask; an unknown one names no one. Next, Tom launches the invitations.
