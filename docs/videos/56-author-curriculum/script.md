# 56 · Author curriculum

Youth cannot work through lessons until somebody writes them. This video shows how a program director builds curriculum in PromiseHub: tracks of ordered modules, lessons with teaching content and notes for leaders, a lesson video stored through PromiseHub's file storage, the cohorts that follow each track, and the rule that nothing unpublished ever reaches youth.

## Tracks and modules

Marisol Delgado is the program director at Harbourview. With the Learning module on, she opens Curriculum from the More menu. Each track is a card: its status, its description, its key for reports, the cohorts that follow it, and its modules numbered in the order youth see them. Leadership Foundations is published, with three modules. Digital Skills is still a draft. She creates a new track called Art Club, leaves the key blank, and PromiseHub makes the key art-club from the name. The track starts as a draft and a toast confirms it. Then she moves Speaking Up above Leading by Serving with its Move up button. The server saves the whole order at once, and the same order shows after a reload.

## The module editor

Opening Leading by Serving shows the module editor. On the left are its details: the name, a description youth see on the module cover, a prerequisite chosen from the modules before it, and an anchor passage the module keeps coming back to. On the right are its lessons in order, each with its status and its own Move up and Move down, and a Visibility card naming the cohorts that will see the module once it is published. Saving with no name shows the error beside the field and in a summary that takes the focus.

## Writing a lesson

Add lesson asks only for a title, then opens the lesson editor. Marisol writes the estimated minutes, the teaching content youth read, and leader guide notes for staff and mentors. Objectives and reflection prompts are one per line. Save lesson confirms with a toast, and every save is audited with the values before and after.

## Draft, review and publish

The Status button opens one dialog for tracks, modules and lessons. A track or a lesson is a draft or published. A module can also be in review, ready for another author to check. Publishing a lesson needs teaching content, and publishing a module needs at least one lesson, so an empty module is refused with the reason. A lesson reaches youth only while the lesson, its module and its track are all published, and only for a cohort that follows the track. Leader notes are only ever sent to authors.

## A lesson video

Each lesson can carry one video. Marisol chooses a file in the Video card. A PDF is refused straight away, naming the file, and nothing is stored. An MP4 shows as uploading, then appears with its size, the date and who uploaded it, and a Remove button. On the server the file is checked three ways: its extension, its content type and its first bytes, so a renamed PDF fails too. It is stored through a new file storage port, under the organization and the lesson, with a key the server makes up rather than the uploaded name. A new video replaces the old one and deletes its file. Chunked upload and transcoding are left for later, and recorded in an architecture decision.

## Cohorts that follow a track

In PromiseHub a cohort is a program. On her phone, Marisol opens the cohorts of Digital Skills. Each program shows its term, its schedule and the track it follows now. She ticks Winter Camp and saves. A program follows one track, so choosing one that followed another track moves it, and programs she leaves unticked follow none. Archived programs and programs of another organization are refused.

## Empty, failed and off

With no tracks, Curriculum says so and offers New track. If it fails to load, the error offers Try again. Site leads, youth workers, youth and mentors are refused by the server. Turn Learning off, and every curriculum page goes to Today and every curriculum endpoint answers not found. Northgate never sees a Harbourview track, and every Harbourview id answers not found there.

## How it is tested

The API tests cover tracks and keys, module order, details and prerequisites, lessons with every field, status rules, the soft delete, the video checks and file storage, the cohorts, the roles, another organization and Learning off. The browser tests run every screen on a phone and a laptop against the fake API, with accessibility checks and no sideways scrolling.

## Recap

Things to remember. A track holds modules in order, and a module holds lessons in order, all saved as whole lists. One status dialog moves tracks, modules and lessons between draft, review and published, and nothing unpublished reaches youth. Lesson videos go through PromiseHub's file storage, checked by type, content and size. Next, youth complete the lessons.
