# 79 · Configure the organization

An organization in PromiseHub says a few things about itself once and expects every screen to follow: its name, the city it works in, how families reach it, the time zone its sessions run in, its logo, and the defaults the modules it uses bring along. This video shows Settings › Organization, the one place an admin keeps all of that, and what the server does to keep each organization's settings its own.

## Settings opens on Organization

Tom Nguyen is the admin at Harbourview Youth Collective. He opens Settings from the More menu, and it now lands on Organization, the first of the Settings tabs. The page is a column of cards. Profile comes first, and below it a card for each module whose defaults live here, but only while that module is on. Nothing is edited on the page itself. Each card has an Edit button that opens its own dialog, so a stray tap never changes anything.

## Editing the profile

Tom chooses Edit profile. The dialog holds the organization's name, its city, a contact email, the phone guardians call and the time zone. He adds a contact email, changes the phone and picks Atlantic for the time zone, then saves. A toast says Organization profile saved and the card shows the new values. The phone is what every guardian page shows, the name is what the top bar shows, and the organization's today, the date every session and due date is measured against, follows the time zone.

## Rules on the server

The server checks each field. An empty name or city, an email without a domain, a phone without its area code, or a time zone outside the list answers unprocessable, with a message on the field and a summary at the top of the dialog. The request never names an organization; the server takes it from the signed-in membership, so when Grace saves Northgate's profile, Harbourview never changes. A save is audited with the names of the fields that changed, and only admins and program directors can read or change any of it.

## The logo

The logo uploads straight from the Profile card. Tom chooses a PNG of Harbourview's logo, and it appears at once with its file name, when and by whom, and a Remove logo button. The server does not trust the file name. It reads the first bytes and accepts only a PNG or a JPEG of up to one megabyte, and stores it under a key made from the organization and a random name. An SVG is refused too, because it can carry script. When Tom tries a PDF flyer, the drop zone says it wasn't uploaded and what to choose instead. A new logo replaces and deletes the old file, and both uploads and removals are audited.

## Module defaults

Below the profile sit the defaults the modules bring. Learning's card holds the guardian consent policy, the age under which youth need a guardian's consent and the wording guardians sign. It is the same policy Privacy and data shows, saved through the same dialog, so there is only ever one. Tom lowers the age to sixteen and the toast says it applies from each youth's next request.

## How often mentors check in

Mentoring's card holds how often mentors should check in with each youth: every seven, fourteen, twenty one or thirty days, fourteen until someone changes it. Tom chooses every seven days. That number is not decoration. Daniel Osei is a mentor, and his dashboard now has a Check-ins due card: each of his youth with no mentor check-in from him in that many days, those he has never checked in with first, then the oldest. Another mentor's check-ins never count for Daniel. When the cadence drops from fourteen days to seven, Jordan, whom Daniel last saw nine days ago, joins the list, while Mateo, seen four days ago, still isn't due.

## The public website profile

When Harbourview turns Public website on, a third card appears. It holds the website address, a tagline, an about text and a public email. Tom moves the site to harbourview youth and writes a tagline. The toast names the new address, and the old one stops answering. An address must be three to forty lowercase letters, numbers and hyphens, and an address another organization already uses is refused without saying whose it is. The public pages that show all of this come with the public website journey.

## Modules that are off

At Northgate, Learning, Mentoring and Public website are off. Grace sees the profile and nothing else: no card, no link, and no request for those settings is ever made. If something asks anyway, each of those endpoints answers not found, as every endpoint of a module that is off does. Jaylen, a site lead, is told that admins set up the organization, and the server answers forbidden. Here are Northgate, the forbidden page, an invalid profile and a website address that is taken.

## How it is tested

The API tests OrganizationProfileTests, OrganizationLogoTests, LearningSettingsTests, MentoringSettingsTests and WebsiteProfileTests cover every field rule, the file checks, the audit, the module gates, the roles and a second organization that never changes. In the browser, the organization profile, logo and module defaults specs, and the check-ins due spec on the mentor dashboard, walk Tom, Grace, Jaylen and Daniel on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. Settings opens on Organization, and every card edits in its own dialog. The profile, the logo and the defaults belong to the signed-in membership's organization and never reach another. A module's defaults appear only while the module is on, and its endpoints answer not found when it is off. The cadence decides who is due a mentor check-in. Next, reporting, exporting and importing learning data.
