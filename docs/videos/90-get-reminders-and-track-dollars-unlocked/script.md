# 90 · Get reminders and track dollars unlocked

Benefits keep coming only if families keep up: file the taxes, renew on time, and know what changes when a child turns six or eighteen. This video follows Carmen Rivera after her benefits check. She gets reminders on the dates that matter, and watches the dollars her family has unlocked add up.

## Your reminders

When the benefits check finishes, PromiseHub sets Carmen's reminders from her household's own dates. Filing her 2026 taxes, on March fifteenth and every March fifteenth after. The Canada Child Benefit and the Ontario Child Benefit renewing in July. And Sofía and Mateo turning eighteen, with a text thirty days before each birthday. They are past six, so there is no reminder for that. Each reminder can be turned off. Carmen turns off the Ontario Child Benefit renewal, and it will never be sent.

## How a reminder is sent

On its day, at ten in the morning in Harbourview's time zone, the organization's reminder job sends one text, in the household's language, with what to do and a link. It goes through Messages, so email takes over when there is no mobile number or the monthly text cap is reached. Each reminder is sent once, and a tax reminder sets next year's. Nothing is sent while the Benefits consent is withdrawn, the organization is suspended, or Learning Bond is off. If a reminder's day passes while the module is off, it is never sent late.

## The running total

Carmen's family page now carries her total. Unlocked so far: three thousand and eighty dollars. That is Mateo's Learning Bond deposit and the first year of the Ontario Child Benefit. Applied for: up to seventeen hundred more, for Sofía's Learning Bond. See your total splits it by child and stream, confirmed or applied for. When a program reports that a benefit has started, through its own signed webhook, the total updates and Carmen is texted the benefit and her new total. With nothing confirmed yet, the total says so, and shows what is applied for.

## Only hers

The total is computed from her household's records on every visit, never stored and never shared. Another household's amounts are never in it, and staff have no way to see it.

## How it is tested

The API tests cover the reminders a finished check sets, on Rivera's real dates. They check that a reminder is texted once at ten on its day, that one turned off never is, and that one whose day passed with the module off is skipped. They check the total before and after a deposit and a started benefit, the text with the new total sent once, another household's empty total, and an unsigned program event refused. In the browser, the reminders and total spec walks Carmen through both on a laptop and a phone, with accessibility checks, against the fake API.

## Recap

Things to remember. Reminders come from the household's own dates, and each can be turned off. One text at ten on its day, once, never late. The total shows what is unlocked and what is applied for, by child and stream. It belongs to the family alone. Next, the dashboard staff and funders see, in counts and dollars, never a family.
