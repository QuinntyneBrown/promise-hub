# 66 · Write reflections

A lesson lands when a young person stops to think about it. This video shows how a youth writes a reflection in PromiseHub: how she feels about a lesson, a few sentences in her own words, and one thing she will do this week. A reflection is private unless she chooses to share it with her mentor. Mentors read only what is shared, nobody else reads reflections at all, and leaving with unsaved words asks first.

## Writing a reflection

Sofía Rivera is twelve and in After-School Tutoring at Harbourview. She has just read Pick Up the Towel. Under Think it over, a new button, Write your reflection, opens her reflection on that lesson. The page shows the lesson's prompt, who picked up the towel for you this week. She chooses how she feels, Thoughtful. She writes her words, and one thing she will do this week. Sharing is off, so when she saves, the page says Reflection saved, only you can see it.

## One reflection per lesson

The server keeps one reflection for each youth and lesson, and saving again replaces it, so she can come back and change it any time. A mood and her words are required, her words up to five thousand characters and the action up to one thousand. Each save is audited as created or updated, with whether it is shared, but never her words or her mood.

## Sharing with her mentor

The switch names her mentor, Daniel Osei, and says who can see the reflection. She turns it on and saves. Now the page says Daniel Osei can read it. Saving again with the switch off takes it back. Sharing is chosen each time she saves, and it is enforced on the server, not hidden by the page.

## What Daniel sees

Daniel opens Sofía's record from My youth. While Learning is on, a Shared reflections card lists what she shared, newest first: the lesson, its module, how she felt, when she saved it, her words and the one thing she will do. Her private reflections never leave the server, and the card says so. The read is audited. A mentor who does not mentor her is refused and that attempt is audited too. Admins, program directors, staff and guardians have no way to read reflections.

## Leaving with unsaved words

If Sofía starts writing and then taps away, a dialog asks first: leave without saving, keep editing, or save a draft and leave. A draft stays on this device only, under her own account and that lesson. It never reaches the server or her mentor, even with sharing on. When she comes back, the page says we restored your draft, with Start over to clear it. Closing the tab with unsaved words makes the browser ask, and a successful save clears the draft.

## On a phone

On a phone the reflection fits one column, and Daniel's card reads just as well, with nothing scrolling sideways.

## Refused and off

Saving with no mood and no words lists both problems beside the fields and in a summary. A failed save keeps every word on the page. A lesson she has not reached says what to finish first. Before a guardian consents, the page says Learning is not open yet. Another organization's lessons are never found, and with Learning off the page goes to Today while the endpoints answer not found.

## How it is tested

The API tests cover the editor, saving and replacing, the checks, the audit without her words, the lesson and consent gates, the mentor's view of shared reflections only, another mentor, other roles, another organization and the modules being off. The browser tests write, share, leave and restore a draft, and read the mentor's card, on a phone and a laptop against the fake API, with accessibility checks.

## Recap

Things to remember. A reflection is one per youth and lesson, private until she shares it. Only her mentor reads what she shares. Drafts stay on her device. Next, mentors record check-ins.
