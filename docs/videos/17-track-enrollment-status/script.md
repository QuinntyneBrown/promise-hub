# 17 · Track enrollment status

When a family enrolls, the next question is always the same: did my child get in? This video shows how a guardian finds out, from the text Tom's decision sends, on a page that lists each child and where they stand.

## What the status page promises

Every decision text ends with a link to the family's own page. The link belongs to that household alone, and a new phone checks it's them with a six-digit code. Each child's programs show as enrolled with the start date, waiting for review, on the waitlist with the number, or not enrolled with the reason staff wrote. The page speaks the family's language.

## Linh checks on Kevin and Emily

Here is Linh Tran's phone. She opens the link from her text, types her number and the code that arrives. The page greets her and shows Kevin enrolled in Winter Camp, with Tom's welcome note, and Emily first on the waitlist, with a promise to text her first if a place opens.

## Other families and other answers

For the Rivera family, the page is in Spanish. A declined child shows the reason. A family with nothing enrolled is told so, and an old or unknown link says it has expired and gives the organization's number.

## How it is tested

Backend tests cover the home link in the decision text, the code on a new device in the household's language, each status with the waitlist number and the note, the reason for a decline, a changed mobile revoking the link, and the roster module switched off. The browser tests follow Linh and Carmen on phone and desktop, with an accessibility check before and after the code.

## Recap

Things to remember. Every decision texts a link to the family's page. A code on a new phone, then each child's status. Waitlisted children see their number. Next, managing the waitlist.
