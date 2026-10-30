# 82 · Learning Bond safeguards

Learning Bond will ask families for the most sensitive things PromiseHub has ever held: social insurance numbers, tax filing and benefit details. Before a single family sees a Learning Bond screen, three safeguards have to exist. The module has to be off everywhere until an organization chooses it, a SIN must never exist in clear text, and every action has to land in the audit log. This video shows those three foundations, built before any Learning Bond page.

## The twelfth module

Learning Bond is the twelfth module of PromiseHub. It reads children and guardians from Roster and reaches guardians through Messages, so it needs both. In Settings, Modules, it is listed last with its one line: claims every dollar the government already owes your child, from birth to university. While it is off, the caption under it says what it needs: Roster and Messages. No onboarding preset turns it on.

## Refused twice

Grace Mensah is the admin at Northgate Community Church Kids, which runs check-in only. She turns Learning Bond on and saves. The server refuses: Learning Bond needs Messages, written beside the switch, and nothing is stored. Grace turns Messages on and saves again. Refused a second time: accept the Learning Bond data-handling agreement first. The agreement is versioned by the platform and accepted per organization, and Northgate has not accepted it. Both checks run in the save handler on the server, so the same request without the page gets the same answer.

## Turning it on

At Harbourview Youth Collective, Tom Nguyen accepted version two of the agreement. He turns Learning Bond on and saves, and the module is on. Turning it off later hides it and deletes nothing, and turning it back on needs no new acceptance. Once it is on, a new agreement version does not switch it off.

## Off means unreachable

While Learning Bond is off, every Learning Bond endpoint answers not found for that organization. Grace types slash learning-bond into the address bar and lands on Today. The Learning Bond library is never even downloaded, because the route only loads it while the session says the module is on. Harbourview's settings never change Northgate's.

## A guardian's link

Guardians have no account, so the organization comes from the link itself. Carmen Rivera opens a Learning Bond link on her phone. The server finds the link's organization, then checks its module. Northgate has it off, so the answer is a bare not found, and the page says Learning Bond isn't available, without naming any organization. An unknown link gets exactly the same page, so the answer never confirms which it was. Opening a link while the module is off is written to that organization's audit log, as the guardian.

## Encrypted at the field

A SIN is stored as two things only: its ciphertext and its last three digits. The cipher is A E S in G C M mode under the Learning Bond key, which lives in configuration or a key vault and never in the database. Every value gets a fresh nonce, so the same number encrypts differently twice, and a ciphertext that was altered or made under another key is refused rather than decrypted. A value that is not nine digits with a valid check digit is refused before it is encrypted, and the refusal never repeats it. Without a key, the cipher says it is unavailable and stores nothing. The only string a SIN ever turns into is its mask: three stars, three stars, and the last three digits.

## Destroyed, and audited

When a SIN is no longer needed, its ciphertext is destroyed and only the last three digits remain. The destruction is audited by System, naming the field and never a digit. Searching the audit log for Learning Bond finds that entry, the module being turned on or off by name, and the link opened while off, each in its own organization only.

## On a phone, and when things fail

Settings, Modules works on a phone with each module and what it needs. When the list fails to load, Try again brings it back. A site lead who opens it is told that admins configure modules.

## How it is tested

LearningBondModuleTests covers the dependencies, the agreement, the staff and guardian doors with the module on and off, a second organization and the audit search. LearningBondAuditTests proves that a known test SIN is in no log line. LearningBondCipherTests and LearningBondSinStorageTests cover the round trip, the masking, tampering, a missing key, what the database holds and destruction. In the browser, the module gate spec walks Tom, Grace and Carmen on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. Learning Bond needs Roster, Messages and an accepted agreement before it turns on. Off means not found everywhere, and the library never loads. A SIN is only ever ciphertext and three digits, and destroying it keeps only the three. Every action is in the audit log without the value. Next, Tom reads and accepts the agreement himself, and chooses which programs Learning Bond covers.
