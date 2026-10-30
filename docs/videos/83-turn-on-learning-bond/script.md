# 83 · Turn on Learning Bond

Nothing reaches a family until an admin has accepted the data-handling agreement and said which programs Learning Bond covers. This video follows two admins through that first staff journey: Grace Mensah at Northgate, who turns Learning Bond on for the first time, and Tom Nguyen at Harbourview, who chooses coverage, checks the invitation and handles a new version of the agreement.

## Refused, then the agreement

Grace runs Northgate Community Church Kids, with Roster and Messages on. She turns Learning Bond on in Settings, Modules, and saves. The server refuses: accept the Learning Bond data-handling agreement first. Nothing is saved, and Learning Bond stays off. This time the refusal carries a link, Read the agreement, right beside the reason, and Grace follows it. The agreement opens even though Learning Bond is still off, because it has to be accepted before the module can be on. It lives in Settings, not in the Learning Bond library, so that library is still never downloaded while the module is off.

## One page, three sections

The agreement is one page in three sections, versioned by the platform: what we collect, where it goes, and what your organization sees. Grace chooses Accept without ticking the box. Nothing is stored, and the reason appears beside the box: confirm you have authority to accept this agreement, or ask someone else to sign. She ticks the box and accepts. The page records who, which version and when, and the acceptance goes into Northgate's audit log. No family's data has been read. Because the module is still off, the next step is Turn on Learning Bond, which takes her back to Modules, where it now turns on.

## Ask someone else to sign

Not every admin can sign for the organization. Grace can name the person who can instead. Ask someone else to sign opens a dialog for their name, their role or title, and their email. A single-use link goes out from Northgate Community Church Kids via PromiseHub, and the page waits for Reverend Angela Baptiste, with Resend and Cancel. Only one request is open at a time. Resend sends a new link and the old one stops working, because only a hash of the link is ever stored. The signer's own page behind the link comes next.

## Settings, Learning Bond

At Harbourview, Learning Bond is already on, so Settings has a Learning Bond tab. The hub shows four cards. The agreement, accepted by Tom on the twenty-ninth of October, version two. Coverage, with every program and four households. The guardian invitation, with its sender name and the languages Harbourview's households use. And the launch, which comes next.

## Coverage

Tom chooses which programs Learning Bond covers. Every running program is listed with the number of households it would reach, counted on the server from children under eighteen actively enrolled; archived programs are not listed. He picks After-School Tutoring and Saturday Sports, and adds Site lead and Youth worker to the roles that see each family's status. Admin and Program director are always there, and mentors, volunteers and youth are never offered. Saving is audited, naming the fields that changed. A program that is archived, or belongs to another organization, is refused without confirming that it exists.

## The invitation

The invitation is platform wording, in English, Spanish and French, the three languages Harbourview's households use. Each language shows the text message with its segment count and the email. The previews use a sample child and guardian, so no family's name appears before invitations go out. The only thing Tom can change is the sender name, and the previews follow it as he types. A name with a link, a phone number or more than thirty characters is refused with one rule: use one to thirty letters, numbers and spaces.

## A new version of the agreement

When the platform publishes version three, Learning Bond stays on and families already in progress continue. The hub says a new version of the agreement needs accepting, with the day it takes effect, and Launch is disabled until it is. Harbourview's earlier acceptance of version two is still shown, so Tom can see what the organization agreed to before. He chooses Read and accept version three. He reads it, ticks the authority box and accepts, and the acceptance is audited just like the first. Back on the hub, the warning is gone and nothing blocks the launch any more.

## On a phone, and when things fail

The hub and the invitation work on a phone, one column at a time. The Settings tabs wrap onto a second line, the four cards stack, and each language keeps its text message and its email together. The tab bar along the bottom still reaches Today, Check-in, Families and Events. When something goes wrong, each page says so plainly and keeps what was typed. Chosen programs with none ticked is refused with choose at least one program. A sender name with a link in it is refused with the one rule, and the previews show exactly what would have gone out. When the hub fails to load, Try again brings it back. A site lead who opens the agreement is told that admins accept it, and the server refuses a site lead too, so a hidden button is never the only guard.

## How it is tested

The API tests cover reading and accepting the agreement with and without authority, the signer request with its field errors, resend and cancel, coverage with archived and foreign programs, the sender name rule and the new version. Each runs with the module off, as another organization, and as a site lead. In the browser, the agreement, signer, coverage, invitation and hub specs walk Grace, Tom and Jaylen on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. The agreement is read and accepted in Settings, before Learning Bond can be on. A named signer gets a single-use link, one at a time. Coverage counts households on the server and always includes Admin and Program director. The invitation's wording is fixed; only the sender name changes. A new agreement version disables Launch until it is accepted. Next, Tom launches the invitations.
