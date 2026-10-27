# 58 · Apply or refer a youth

A young person can't always count on a parent to sign them up, and the teacher who notices them can't enroll them either. This video shows how PromiseHub's enrollment link now takes three kinds of applicant: a parent or guardian, the young person applying for themselves, and someone referring a young person. It is still one intake, the program's own link, and every application waits for staff review.

## Who is applying

The link opens on one question: who is applying? A parent or guardian is chosen by default, so families see the enrollment they already know. The young person, aged twelve to eighteen, can apply for themselves. A teacher, counsellor, social worker or coach can refer one. Whichever is chosen, the person proves their own phone or email with a six-digit code before any details step opens, exactly as a guardian does.

## A young person applies

Malik Johnson is fourteen. He gives his name, date of birth, school and why he is interested. Then he gives his mother's name and mobile number, because a young person under eighteen needs a parent or guardian. On the last step he agrees to the privacy notice and to the fact that his mother must consent before he starts. A young person aged eighteen gives the season consent themselves. Someone younger than twelve is asked to have a parent or guardian apply instead. Every step is checked on the server, so a missing reason or guardian is named before he moves on.

## A referrer refers

Rachel Ellis is a guidance counsellor at Bennetto Elementary. She says who she is and how she knows the young person, and her verified email is shown back to her. She tells us about Zoe Campbell and why she is referring her, then gives Zoe's guardian's details. Before submitting, she confirms the family knows about the referral and agrees to be contacted. The request keeps her name, role, organization and contact for the office, so whoever reviews it knows who to call back with questions. Rachel never sees Zoe's family record, and nothing she typed is matched against families already on file.

## What is recorded

A submission becomes an enrollment request waiting for review, or waitlisted when the program is full. It records who applied, the reason, and whether the season consent was given. A young person's application or a referral always creates a new household for the guardian, never one matched from a phone number someone typed, so a stranger cannot attach a child to another family. Nothing creates an account, and the submission is audited. The person who applied gets one confirmation by text or email.

## Duplicates and too many codes

If the same young person already has an open application in the program, by name and date of birth, a second one is refused and nothing is sent twice. The page names the young person and the office's number instead. A fourth code within fifteen minutes is refused too, so nobody can flood a phone with texts, and the page says when to try again. A failed load offers Try again, and with the Roster module off the link says the page isn't available.

## How it is tested

The API tests cover each path, the age and field rules, consent, the new household, another organization's family, Roster off, the acknowledgement, duplicates and the code limit. The browser tests walk every path on a phone and a laptop against the fake API, with accessibility checks and no sideways scrolling. On a phone the question, the steps and every error fit the screen at three hundred and ninety pixels, and the keyboard reaches every choice in order. The Spanish and French pages use the same steps in the family's language.

## Recap

Things to remember. One link takes guardians, young people and referrers, and each proves their contact first. Each path agrees only to what it can agree to, and the season consent is recorded. Applications land in the same review, in a new household, acknowledged once. Next, staff review applications and place young people into cohorts.
