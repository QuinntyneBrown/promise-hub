# 01 · The walking skeleton

This is the first slice of PromiseHub. It adds no feature a family would notice. What it gives you is the frame that every later journey hangs on: a database the command line can build and fill, tenants that can never see each other's data, an audit trail that cannot be rewritten, and a shell that works on a phone and on a laptop.

## What the skeleton promises

Four promises, each one backed by tests. The command line migrates and seeds two organizations, and running it twice changes nothing. Every query is filtered by the organization of the person signed in. Sensitive actions are written to an audit log that cannot be edited. And the app opens on a shell built only from the shared components library.

## Migrate and seed

The API never touches the schema. The `CLI` does. Run migrate, then seed, and you get Harbourview Youth Collective on the Standard plan, and Northgate Community Church Kids on the Free plan, with Jaylen, Marisol, Tom, Priya and Aisha, and the Rivera family. Seed again and the second run finds every row by a stable identifier and leaves it alone. If you start the API against a database with a pending migration, it logs the migration by name and refuses to serve.

## One tenant at a time

The tenant never comes from the request. It comes from the membership on the session. Every tenant-owned table carries the organization id, and a filter on the database context adds it to every query. Saving a row for another organization throws. Both organizations have a child called Mateo Rivera on purpose. When Jaylen at Harbourview asks for Northgate's Mateo by id, the answer is not found, and the attempt lands in Harbourview's audit log.

## An audit trail that stays put

Audit entries are written in the same unit of work as the change they describe, so a committed change always has its entry. Once saved, an entry cannot be edited or deleted through the application; the database context refuses.

## The shell

Here is the shell on a laptop. The top bar is a floating capsule: Today, Check-in, Families and Events, with Programs, Messages and Reports from a thousand and twenty four pixels, and More at the end. Incidents and Settings always live in More, so the bar never overflows. More opens a drawer that traps focus and closes on Escape. A page that doesn't exist yet gets a friendly not found page with a way back to Today.

On a phone, the same sections move to a tab bar at the bottom. Priya covers two organizations; signed in to Northgate, the menu names Northgate, never Harbourview. Every one of these screens passes an axe accessibility check, at phone and desktop widths.

## How it is tested

Backend tests run against the real API with an in-memory database, migrated and seeded by the same command line. The browser tests run with no backend at all: a fake API answers every call from seeded data, and any request it does not know fails the test loudly.

## Recap

Things to remember. The command line owns the schema and the seed. The membership decides the tenant, never the client. Audit entries are permanent. And every screen is composed from the components library. Next, staff sign in securely.
