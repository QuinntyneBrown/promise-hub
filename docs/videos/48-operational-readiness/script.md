# 48 · Operational readiness

Before PromiseHub goes out to many more organizations, the people who run it need to see trouble before families do, and to know the app stays quick on a phone at a busy door. This video shows the request logs, the alerts, and the performance budgets that now run in every build.

## What every request leaves behind

Every request writes one structured log line: the organization, the route template, the status, how long it took, and a correlation id. The route is the template, never the real path, so a child's name or a guardian's link never lands in a log. The logging sits outside the fault handler, so a request that breaks is logged with the five hundred it became.

## When something breaks

Here is Jaylen opening PromiseHub on a laptop while the server is failing. She gets the server error page, which says nothing was lost, shows a reference she can quote to support, and offers Try again. When the server is back, Try again opens Today as if nothing happened. On our side, that same reference is on the fault's log line, and the fault was counted.

## Alerts for on-call

Every request is also counted, per organization, for the last five minutes. Once a minute a check looks at those numbers. If more than one percent of at least twenty requests failed, it raises an error rate alert. If an organization has a message waiting more than ten minutes past its time, it raises a queue alert naming that organization. Each alert is raised once, and again only after it has cleared.

## The budgets, measured

Here is Jaylen checking in tonight's roster on her phone. The row turns to checked in at once, and filtering by Rivera keeps up with every key. The build measures exactly this. A budgets project loads Today, Check-in, Families, Events and Reports cold from the production build on an emulated phone. Each must paint within one and a half seconds and be ready within two and a half. A check-in row must update within three hundred milliseconds, and each search keystroke within two hundred.

## How it is tested

The API tests prove the log line, the five hundred with only a reference, the error rate alert, the rule that too few requests raise nothing, and the queue alert naming its organization. They also read the server's own numbers: check-ins confirmed under a second, and two organizations reading their sessions at once staying under five hundred milliseconds. Field measurements on real phones and a load test across fifty organizations come later.

## Recap

Things to remember. One log line per request, with no names in it. Alerts fire once, for errors and for stuck queues. The budgets fail the build when the app gets slow. Next, more of the same care for backups and jobs.
