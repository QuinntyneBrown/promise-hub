# 05 · Create programs and events

Today's sessions, check-in and permission slips all hang off programs and events. This video shows Marisol, Harbourview's program director, setting up a program, filling its roster, and managing the events that run under it.

## What programs and events promise

A program has dates, a schedule, a capacity and an age range. A new one starts with nobody enrolled and enrollment closed unless the director opens it. Children join a roster until the program is full. Archiving hides a program from lists and pickers without deleting anything, and it can be restored. Every event belongs to an active program and takes that program's roster. An event that needs a permission slip starts with a draft slip, and a cancelled event stays on the record with who cancelled it and why.

## Marisol sets up a program

Here is Marisol in Programs on a laptop. She creates Spring Robotics: January to April, Wednesdays four to six, twelve places, ages eight to thirteen. The program opens with nobody enrolled and enrollment closed. She adds Amara Okonkwo by searching the roster for her name, and Amara joins the list. When a program is full, the next child is refused with how many places it has.

## Archive and restore

Archiving asks for the program's name to be typed. An archived program is read-only, says it is archived and who did it, and keeps its roster, events and attendance for reports. Restoring brings it back with enrollment still closed, so nothing opens by surprise.

## Events and their slips

Events lists what is coming up, what still needs a slip and what is past, with a program filter and a search. The Fall field trip to the Royal Botanical Gardens needs a slip, so it says the slip is not written yet. On her phone, Marisol cancels the trip because of a bus strike. She writes the message for guardians, and the event now shows it was cancelled by her. Sending that message arrives with Messages.

## Who can do what

Program directors and admins create, edit and archive programs and manage rosters. Site leads read programs and create and edit events, but cannot cancel them. Youth workers read. Each of these rules is checked on the server, and another organization's programs and events answer not found.

## How it is tested

Backend tests cover the rules for new programs, capacity, archiving and restoring, draft slips, cancelling, each role and the cross-tenant cases, and show that programs and events answer not found when the roster module is off. The browser tests create programs and events, manage a roster, archive and restore, and cancel the field trip at phone and desktop widths with an accessibility check on every page and dialog.

## Recap

Things to remember. New programs start empty and closed. Capacity is enforced. Archiving keeps everything and can be undone. An event that needs a slip starts with a draft. Next, site leads check children in.
