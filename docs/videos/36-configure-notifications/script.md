# 36 · Configure notifications

Every organization runs a little differently. Some want a guardian texted ten minutes after a session starts, others give families half an hour. This video shows Settings › Notifications, where an admin sets the no-show delay, supervisor emails and the monthly text budget, and how the background jobs follow those choices.

## What the settings promise

A new organization starts with sensible defaults: a no-show text fifteen minutes after start, supervisors emailed about new incidents, and the plan's monthly text cap. An admin or program director can change them. The delay must be between five and sixty minutes, and the cap can't drop below what's already been used this month. Every save is recorded in the audit log. The jobs read the settings on every run, so a change applies to the next session.

## Tom changes the settings

Here is Settings › Notifications on Tom's laptop. Twelve hundred texts are already used this month. He shortens the no-show delay to ten minutes and tries a cap of one thousand. The page names the problem: the cap can't be below what's already used. He sets fifteen hundred instead and saves.

## Who can change them

Site leads and youth workers who open the page are told admins configure notifications. Each organization keeps its own settings; Northgate still has its defaults.

## How it is tested

Backend tests cover the defaults, out-of-range values named per field, a shorter delay texting sooner and a longer one waiting, supervisor emails switched off while the in-app notice still arrives, a lower cap saved and shown, and roles and other organizations kept out. The browser tests cover the defaults, saving, validation, a failed load and the forbidden state, with accessibility checks.

## Recap

Things to remember. Defaults first. Jobs follow the settings on every run. The cap never drops below what's used. Next, grant reports.
