# 86 · Claim the Learning Bond

The invitation has gone out. Now a family claims the money. This video follows Carmen Rivera, a Harbourview mother, on her phone, from the text link to an application on its way to an RESP provider. She needs no account and puts in no money.

## The link and the code

Carmen taps the link in her text. This phone has never been verified for the Riveras, so the six-digit code comes first, sent to the number on the family record. Nothing about the children shows before it succeeds, because this page leads to social insurance numbers.

## What the Learning Bond is

Then the page opens in her language. The agent explains it in three short sentences. The Canada Learning Bond is money the Government of Canada puts in a child's RESP for families with lower incomes. The family puts in no money. What Carmen enters goes to the RESP provider and the Government of Canada, never to Harbourview. Mateo and Sofía are listed, each with up to the amount they may be owed. Carmen can continue, choose not now, or say she isn't interested, and then nothing more is sent about it.

## Consent for each child

Before anything is asked, Carmen gives permission for each child, separate from any program consent. Each box carries the exact wording: her SIN and Mateo's, and the tax-filing status, go to the provider she chooses and to the Government of Canada. She ticks Mateo, types her name and agrees. That consent is stored with the Learning Bond scope, the wording's version, her language and the time, and it is audited. Nothing is asked about Sofía.

## Mateo's details

The intake confirms what enrolment already holds, Mateo's name and date of birth, with Fix this if it's wrong. It asks for only three things: Carmen's SIN, Mateo's SIN, and whether the family filed last year's tax return. The numbers go in form fields, are checked on the server, and are encrypted under a key kept outside the database. From then on, only the last three digits show. When Sofía's turn comes, Carmen's own number and her tax answer are reused, never asked again.

## The estimate

The estimate is one number, and a rule on the server computes it, never the language model. Five hundred dollars for the first year, then a hundred for each year up to fifteen, capped at two thousand. Mateo was born in 2017, so he may be owed up to fourteen hundred dollars. The estimate records the rule's version. A family that hasn't filed last year's taxes sees that they need to file to receive it, and the claim waits.

## The review

The review recommends a no-fee RESP provider from the platform's list, the first that serves Ontario. The list is the same for every organization and no provider pays to be on it. Choose another shows the others that serve the province. Every field of the application is listed, both SINs masked. The family record has no address, so Carmen adds hers. Edit opens a dialog, and the address belongs to this application only. Each edit moves the review's version.

## Submit

Nothing has left PromiseHub yet. Submit to Northfield Credit Union is the only way to send it, and the line above it says exactly where it goes. Carmen taps it. The server checks the review's version, decrypts the numbers in memory and sends the application once. A double tap sends nothing more. The submission is audited without any SIN. Back on her family page, a Learning Bond card says Mateo's application was sent.

## In Spanish, and when things go wrong

Carmen's household speaks Spanish, so her link opens in Spanish: the agent, the children, every step and the step counter. On a laptop the review reads the same, one column in the middle of the page. Choose another lists the other no-fee providers that serve Ontario, and Carmen can pick one. If the provider doesn't answer, Carmen is told plainly: we couldn't send it, nothing was sent, try again. Her application stays saved exactly as she reviewed it, and a retry sends it once. If no provider serves the province, the page says so, links to the Government of Canada, and the claim stays saved. And a family that answered no to the tax question sees the estimate with a reminder to file first.

## How it is tested

The API tests cover the link and the code, consent per child, SIN checks and encryption, the estimate's rule, the application and its edits, and Submit sent once through a fake provider that records nothing before it. They also cover another household's link and the module turned off. In the browser, the guardian page, consent, intake, estimate, review and home card specs walk Carmen on a laptop and a phone, with accessibility checks, against the fake API.

## Recap

Things to remember. The link opens in the family's language, after a code on a new device. Consent is given child by child. A SIN is typed once, encrypted, and shown only by its last three digits. The estimate comes from a rule, never the model. Nothing leaves before Submit, and Submit sends once. Next, Carmen follows the claim, or picks it up where she left off.
