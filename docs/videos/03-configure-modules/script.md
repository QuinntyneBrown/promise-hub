# 03 · Configure modules

PromiseHub is a suite, but no organization has to take all of it. A church kids club might want only check-in; a youth collective runs the whole thing. This video shows Tom switching modules on and off, what the server refuses, and how the rest of the app follows.

## What modules promise

There are eight modules: Roster, Permission slips, Roll Call, Quick Cards, Pickup, Messages, the Incident log and Reports. Roster is the data every other module reads. A module that is off is neither served nor shown: its endpoints answer not found and its sections leave the navigation. Turning a module off hides it and deletes nothing.

## Tom switches modules

Here is Tom, Harbourview's admin, in Settings, Modules on a laptop. Every module is a row with a switch, and the count above says how many are on. He turns Roll Call off and saves. Pickup needs Roll Call, so the server refuses, and the reason appears beside Pickup. Then he picks the Just check-in preset, which leaves Roster, Roll Call and Quick Cards on, saves, and a toast confirms three on. Back on Today, the top bar shows only Today, Check-in and Families.

## The rules

Every module needs the roster, and Pickup also needs Roll Call. The server checks every save, answers unprocessable with one message per broken dependency, and writes the change to the audit log with the modules before and after. Only admins and program directors may change modules; a site lead sees who to ask, and the server answers forbidden.

## Off means unreachable

Northgate Community Church Kids runs check-in only. Priya, signed in there on her phone, sees Today, Check-in and Families, and the More menu lists no slips, messages, incidents or reports. If she types the address of a module that is off, she lands on Today, and that module's code is never even downloaded. On the server, every endpoint declares its module, so a request to an off module answers not found. Turn the module back on and every record is still there.

## How it is tested

Backend tests save configurations, break each dependency, check the role, prove one organization's change never touches another, and turn the roster off and on again to show the data returns. The browser tests switch modules, check the inline errors and presets, and open every off module's address at phone and desktop widths.

## Recap

Things to remember. Roster is the base and Pickup needs Roll Call. Off means not found on the server and absent in the app. Nothing is ever deleted. Next, admins and office managers maintain households.
