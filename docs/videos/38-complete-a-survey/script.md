# 38 · Complete a survey

A program only gets better if families can say how it went, and it only works if answering takes a minute on a phone, in their own language. This video shows how a director sends a two-question survey after a session and how Carmen answers it in Spanish.

## What surveys promise

After a session, a director or site lead sends a survey from Reports. Each household gets one text with a link per child. The link works like every guardian link: on a new device the guardian confirms a code first, and the page appears in the household's language. There is a rating from one to five and an optional comment. Each child's survey is answered once, and it closes a week after it was sent. The answers show up in the report as a count and an average rating.

## Carmen answers on her phone

Here is Carmen's survey on her phone. It's in Spanish, because the Rivera household speaks Spanish. She picks four, adds that Mateo loved tutoring, and sends it. The page thanks her, and there's nothing more to do.

## Sending, and when it closes

Marisol sends the survey from Reports by choosing the session. A week later, the link says the survey has closed.

## How it is tested

Backend tests cover a link per child for each household, verification and the household language, a rating required and one answer only, answers in the report, the survey closing after a week, youth workers refused, another organization's event not found, and everything hidden with Reports off. The browser tests follow Carmen through verification in Spanish, a missing rating, a closed survey and Reports off, and Marisol sending a survey, with accessibility checks.

## Recap

Things to remember. One link per child, verified like every guardian link. The household's language. One answer, closed after a week, counted in reports. Next, setting up a new organization.
