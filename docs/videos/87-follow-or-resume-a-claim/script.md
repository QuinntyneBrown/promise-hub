# 87 · Follow or resume a claim

Carmen Rivera has submitted Mateo's Learning Bond application. This video follows what comes next. The provider reports back, a document is asked for, and the money lands. Then Sofía's claim stops for a missing number, and Carmen picks it up again from the same link.

## What was sent

Right after Submit, Carmen sees where the application went: sent to Northfield Credit Union on Thursday the fifth of November. Underneath is what happens next, in three steps. Northfield opens Mateo's RESP and confirms it received the application. The Government of Canada checks the family's tax returns and approves the bond. Then the money is deposited. A badge gives the deposit window from Northfield's stated processing time, January fifteenth to February twenty-eighth. Below that is every field that was sent, with both social insurance numbers masked, and the estimate. A few days later Northfield reports that it received the application. Carmen gets a text in Spanish, her household's language, and the first step shows done.

## How the provider reports back

The provider calls a webhook. It is trusted only when it carries the provider's own signature, an HMAC of the body under a secret only that provider holds. The application is found by the provider's reference, and the organization it belongs to must have Learning Bond on. Each event is applied once by its id, so a repeated delivery changes nothing and texts nobody twice. Texts go through Messages, so the monthly text cap and the email fallback still apply.

## A document, sent only on Send

Northfield asks for proof of address. The text names the document and links to this page. Carmen chooses a photo of her hydro bill, a PDF, JPEG or PNG of up to ten megabytes. It is encrypted and kept here. Nothing goes to Northfield until she taps Send, and then it goes once. A file that is too big, or of the wrong kind, is refused with the reason. Weeks later the deposit lands: fourteen hundred dollars in Mateo's RESP. All three steps are done, and staff see the household as deposited.

## A claim that pauses

Sofía doesn't have a social insurance number yet, so Carmen says so on Sofía's details. The claim pauses, and the page explains how to get one. Find her birth certificate, apply online or at a Service Canada Centre, for free, and come back with the number. Carmen asks to be reminded. One text comes in fourteen days and one in thirty, each with the link, and none after that. Nothing is sent after she says she isn't interested, or after the consent ends.

## Picking it back up

When Carmen reopens her link, each child shows where the claim goes on. Mateo's says see what happens next. Sofía's says pick up where you left off, and it leads straight back to Sofía's details with everything else kept. Her own SIN still shows only its last three digits. Giving Sofía's number ends the pause and cancels the reminders still to come.

## No tax return, and closing an idle claim

On a laptop the same pages read in one wide column. A family that hasn't filed last year's taxes sees the estimate with a note to file first. What to do now explains why a filed return matters and links to the free tax clinic finder. A claim paused for a hundred and eighty days with nothing happening closes as not completed. Its numbers are destroyed, and reopening the link starts again from consent.

## How it is tested

The API tests cover the submitted view and its deposit window. They cover the signed webhook: received, deposited and document needed, each applied once and texted in Spanish, while an unsigned event, an unknown reference, another provider's event or the module off changes nothing. They also cover the document upload and Send, pausing, reminders at fourteen and thirty days, resuming, and the hundred-and-eighty-day close. In the browser, the submitted and paused specs walk Carmen on a laptop and a phone, with accessibility checks, against the fake API.

## Recap

Things to remember. After Submit, Carmen sees where it went and when to expect the money. Provider events are signed, applied once and texted in her language. A document leaves only on Send. A paused claim explains what helps, reminds her twice at most, and picks up where it stopped. After a hundred and eighty idle days it closes and its numbers are destroyed. Next, Carmen can withdraw her consent.
