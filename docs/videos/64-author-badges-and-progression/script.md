# 64 · Author badges and progression

Youth need to see how far they have come. This video shows how a program director defines that in PromiseHub: badges, with the rule that earns each one or awarded by hand, and the progression framework, the stages youth grow through and the competencies that earn them. Rules are checked on the server whenever a youth learns something, so a badge arrives on its own, once.

## Badges

Marisol Delgado is the program director at Harbourview. From Curriculum she opens Badges. Each badge shows its medal, how it is earned, the competency it counts toward and how many youth hold it, with counts at the top: six badges, four automatic and two by hand, five awards to two youth, and First Steps the most earned. New badge opens the builder. She names the badge Knows Themselves, writes what it celebrates, picks the book icon and watches the preview follow. Under Earning it she keeps Automatically, by a rule, chooses Completes a module and the module Knowing Yourself, and says it counts toward Speaks up. Save badge creates it and opens it at its own address, earned by nobody yet.

## Earned automatically

An automatic badge names one rule: a lesson completed, a module completed, a quiz passed, or an assignment accepted. After every learning event, the server checks each automatic badge the youth does not hold yet. Completing a lesson, a quiz attempt being scored, a mentor approving a quiz result, or a mentor accepting a submission all trigger it. A module counts as done when every published lesson in it is done and every required quiz is passed. Each award is made once, with a unique index on the badge and the youth, and the youth is told in the app. Servant Heart shows Sofía Rivera as earning it automatically, and it offers no Award badge, because the server awards it.

## Awarded by hand

Some milestones no rule can see, like speaking up in the group. Speaks Up is a badge by hand. Award badge lists the youth of Harbourview who don't hold it yet. Marisol chooses Nadia Haddad. The award is recorded with Marisol's name and the time, Nadia is notified, and the award is audited. Nadia joins Earned by. If someone else awarded it a moment before, the dialog says Nadia already has this badge, and nothing is added twice.

## The progression framework

Next, Progression. The framework is ordered stages: Explorer, Contributor and Leader at Harbourview, each with the competencies that earn it. These are the same competencies mentors assess on each youth's record, so the framework and the mentor's sheet never drift apart. A youth reaches a stage once every competency in it, and in the stages before it, is proficient or mastered. Add stage puts Mentor last. Add competency gives it Welcomes someone new, which mentors can assess at once. Move up and Move down save the whole order. Removing Works with others asks first; mentors stop assessing it, and every assessment already made is kept.

## On a phone

On a phone the list, the builder and the framework stack into one column, with nothing scrolling sideways.

## Refused, empty and off

Saving an automatic badge with no name and no module names both, beside the fields and in a summary that takes the focus. A failed save keeps every change and offers a retry. With no badges yet, the page offers New badge. Deleting a badge keeps it for every youth who earned it, and no one else can earn it. Site leads, youth workers, mentors and youth are refused by the server, another organization's badge or stage is not found, and with Learning off these pages go to Today while every endpoint answers not found.

## How it is tested

The API tests cover the badge fields and their refusals, every automatic rule after its learning event, awards made once, by hand and automatically, the stages and competencies, the mentor's sheet, other roles, another organization and Learning off. The browser tests run the badges, the award dialog and the framework on a phone and a laptop against the fake API, which awards badges after the same events, with accessibility checks.

## Recap

Things to remember. A badge is earned automatically by one rule, or awarded by hand by a program director. The server checks the rules after every learning event and awards each badge once. The progression framework is ordered stages of the competencies mentors assess, and removing one keeps its assessments. Next, youth see their journey and the badges they have earned.
