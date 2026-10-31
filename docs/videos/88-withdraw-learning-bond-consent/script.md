# 88 · Withdraw Learning Bond consent

Consent given can always be taken back. This video follows Carmen Rivera as she withdraws Learning Bond consent for Mateo, and shows what PromiseHub destroys, what it keeps and why.

## Your consents

When Carmen opens her Learning Bond link, the page lists Your consents under her children. There is one row per child: Mateo, Learning Bond, signed Carmen Rivera on Thursday the fifth of November, wording version one. Each row has a Withdraw button. A screen reader hears it as withdraw consent for Mateo.

## What stops, and what stays

Withdraw opens a dialog before anything happens. It says it plainly: we'll stop and delete Mateo's information here, and anything already sent to Northfield Credit Union stays with them, so contact them to close the RESP. Two lines spell it out. What stops: any unsent application is cancelled, Mateo's SIN and answers are deleted, and Carmen's too if no other child still has consent, with no more texts about Mateo. What stays: the status, provider and dates of what was already sent, with no SIN. Focus starts on Cancel, and Cancel changes nothing.

## Withdrawing

Carmen withdraws. In one step, the server cancels every application for Mateo that wasn't sent. It destroys Mateo's encrypted SIN, cancels every reminder about him and deletes any document waiting to be sent. Because no other child of the Riveras has consent, Carmen's own SIN and her tax answer are destroyed too. Had Sofía still had consent, they would have stayed for her. Mateo's application already went to Northfield, so its status, provider and dates remain, with no SIN, and the dashboard can still count it. If Northfield reports news later, the status follows, but nobody is texted. The withdrawal is recorded in the audit log, with no number in it.

## Starting again

If Carmen changes her mind, she gives consent again. Mateo's details then start from the first question, because the old answers no longer exist. Her SIN, Mateo's, and the tax question are all asked again.

## On a laptop

On a laptop, Your consents and the dialog read the same, in one wide column. The dialog opens over the page with Cancel first. Cancel closes it, and the consent stays exactly as it was, with nothing deleted.

## How it is tested

The API tests withdraw before Submit. They check that the application is cancelled, both SINs and the tax answer are destroyed, the audit entry is written, and a new consent starts the intake over. They withdraw for Mateo while Sofía keeps consent, so Carmen's SIN stays. They withdraw after Submit: the status, provider and dates stay, the SIN goes, and a later provider event texts nobody. And another household's link, or an unknown consent, gets a not found. In the browser, the withdraw spec walks Carmen through the dialog on a laptop and a phone, with accessibility checks, against the fake API.

## Recap

Things to remember. Your consents lists each child, with Withdraw. The dialog says what stops and what stays, naming the provider. Withdrawing destroys the child's SIN and answers, and the guardian's when no other child needs them. What was already sent keeps only its status, provider and dates. Consenting again starts over. Next, the benefits check.
