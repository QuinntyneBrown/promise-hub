# 32 · Use permitted child details

A youth worker needs to know the children in front of them tonight, and nothing more. This video shows what Aisha, a youth worker at Harbourview, can see about a child, and what the server refuses to send her at all.

## What permitted means

Aisha works Tutoring night. She can open the children enrolled in the programs of the sessions she works. For them she sees each child's age, school and household, and the guardians' names and phone numbers, so she can call a parent at pickup. She does not see medical details or a date of birth; those need a staff role. A child who is in none of her sessions is not sent to her at all. The server answers forbidden and records the attempt.

## Aisha opens the Rivera household

Here is the Rivera household on Aisha's laptop. A notice says some details are hidden for her role. Carmen's phone number is there. She opens Mateo. His age shows, nine years, without his birth date, and the medical card is locked. Then she follows an old link to Kevin Tran, who only comes to Saturday Sports. The page says he isn't in her sessions, and nothing about him has reached her browser.

## Lists leave them out too

Families and the child search only ever contain the households of her sessions. On a phone she sees the same thing, in one column.

## How it is tested

Backend tests cover the date of birth withheld from youth workers and shown to site leads, a child outside her sessions answering forbidden with an audit entry, Families and search leaving those children out, another organization's child not found, and the Roster module switched off. The browser tests follow Aisha and Jaylen on phone and desktop with accessibility checks.

## Recap

Things to remember. Youth workers see the children of their sessions. Age, not date of birth, and no medical details. Anything else is refused on the server, and logged. Next, the director's view of today's work.
