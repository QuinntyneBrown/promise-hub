# 81 · Explore the public website

Families find a program long before anyone at the organization knows their name. This video shows the public website PromiseHub gives each organization: pages anyone can read without an account, the programs that are open with a way to apply, and three ways to help: writing in, volunteering and giving monthly. Everything shown is published content only, and a visitor's request lands in the right organization and nowhere else.

## The address is the organization

Dana Thompson is a parent in Hamilton. She types the address slash site slash harbourview. That address names Harbourview Youth Collective, and it is the one place PromiseHub chooses an organization without anyone signing in. The server finds the organization by its address, checks it is not suspended and that its Public website module is on, and only then answers. An unknown address, a suspended organization and a module that is off all look exactly the same: a page that isn't here.

## The home page

The home page shows the name and the tagline from the website profile, then how joining works in four steps: find a program, apply online, we say hello, grow with us. What we run counts programs running and programs open for enrollment and, because Learning is on, published learning tracks and modules. PromiseHub never publishes how many children or staff an organization has. Open now lists the programs taking applications.

## Programs and open cohorts

Dana opens Programs. A Waypoint cohort is a PromiseHub program, so each card is a current program: when it meets, who it is for, when it runs and whether it is running now or starting soon. Archived programs and programs that have ended never appear. Apply shows only while enrollment is open and its link exists; Winter Camp says enrollment is closed for now instead.

## Learning and mentoring, only when they are on

Because Learning is on at Harbourview, the page also shows what youth learn: each published track and its published modules, with the badge a module earns. Drafts never leave the authoring screens. Because Mentoring is on, each program names its lead mentor by first name only, and the page explains how mentoring works. Switch either module off and that section, and every field it adds, disappears from the answer, not just from the page.

## Apply

Apply on After-School Tutoring opens the program's own enrollment link, the same flow a family already uses from a flyer or a text. The website never takes an application itself, so there is one intake and one review queue for staff.

## About and contact

About shows the organization's own words, where to find it and its promise to families: screened adults, a guardian's consent before a child takes part, and allergies and medication on hand at every session. The contact page is the form itself. Sending it empty shows each error under its field with a summary at the top. Dana writes her question and sends it; the form is replaced by a thank-you that says someone will reply by email. If the send fails, everything she typed is kept.

## Volunteer

Get involved offers three ways to help. Leo Martins signs up to volunteer in a dialog: his name, email, how he would like to help, and a box to say he understands that volunteers who work with children are screened and reference checked. Without that box nothing is sent. His offer is stored for Harbourview with the acknowledgement, and a toast thanks him.

## Give monthly

Dana chooses fifty dollars a month and gives her name and an email for the receipt. PromiseHub asks the payment provider for a checkout, saves the pledge with only the provider's reference, and offers Open secure payment in a new tab. Card details go to the provider, never to PromiseHub. Until an organization has a provider, the dialog says online giving isn't available yet and nothing is saved.

## Rules on the server

Every website endpoint is anonymous by explicit opt-in and goes through the same resolver, so every one answers not found in the same cases. Each request is checked on the server against fixed lists and lengths, stored as plain text and only ever shown escaped. A sixth message, offer or pledge from the same email to the same organization within an hour is refused kindly. Every request is in the audit log as the website visitor.

## On a phone

On a phone the links wrap onto their own row under the name, nothing hides behind a menu, and the cards stack in one column with nothing to scroll sideways.

## Off, empty and failed

At Northgate, Learning and Mentoring are off, so its programs page lists its program and nothing about tracks or mentors. With nothing open, the home page says so and offers Contact us. When the content fails to load, the frame stays and Try again brings it back. And an address that is not published shows the same not-found page, without even downloading the website.

## How it is tested

The API tests PublicContentTests, WebsiteRequestsTests and WebsiteDonationsTests cover published content only, each module gate, the limit, the audit, the payment provider and a second organization that never sees the first one's data. In the browser, the landing, programs, about, navigation, contact, get involved and donate specs walk Dana and Leo on a laptop and a phone with accessibility checks, against the fake API.

## Recap

Things to remember. The address chooses the organization, and unknown, suspended and off all look the same. Only published content is shown, and each module adds its section only while it is on. Apply is the program's enrollment link. And every request is validated, limited, audited and kept for that organization alone, while cards go straight to the payment provider. That completes the Waypoint journeys.
