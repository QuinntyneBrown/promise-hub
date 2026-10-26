# 41 · Manage billing

An organization should always know what it's paying for and how close it is to a limit. This video shows the Billing page: the plan, how many children and texts are used, changing plan, and what happens if a payment fails.

## What billing promises

There are three plans. Free costs nothing and covers fifty active children and two hundred texts a month. Standard is eighty-nine dollars and covers five hundred children and two thousand texts. Plus is a hundred and forty-nine dollars, for two thousand children and five thousand texts. An active child is enrolled in at least one program, and counts once. On Free, the fifty-first child can't be enrolled until the plan changes; nothing is lost. Changing up adds the difference for the rest of the month. If a payment fails, service continues for fourteen days of grace, then the account shows as suspended. Only admins see billing, and every change is audited.

## Tom moves to Plus

Here is Billing on Tom's laptop. Harbourview is on Standard, with a hundred and eighty-four active children and twelve hundred texts this month. He chooses Change plan, picks Plus, and confirms. The toast says fifty-two dollars is added to this month's invoice, for the days left.

## Limits and payments

On the Free plan, the page shows the fifty-child limit and warns when it's reached. A failed payment shows the date service continues until.

## How it is tested

Backend tests cover the plan and usage, the fifty-first child refused on Free, the prorated upgrade and its audit entry, the current or an unknown plan refused, the grace period then suspension, and directors refused while each organization sees its own. The browser tests cover usage, upgrading, choosing the same plan, a failed payment, suspension, the Free plan and the forbidden page, with accessibility checks.

## Recap

Things to remember. Three plans with clear limits. The limit stops new children, never deletes. Grace before suspension. Next, privacy settings.
