# 78 · Manage personal settings

Everyone who signs in to PromiseHub, staff, youth and mentors alike, has a few things that are theirs alone: the name others see, the mobile alerts go to, the password, how the app looks, and which notifications reach them. This video shows the one place all of that lives now, Your account, and what the server does to keep each choice yours.

## Your account

Jaylen Okafor is a site lead at Harbourview Youth Collective. He opens Your account from the account menu. It is a short list of cards: Profile, Password, Display, Two-step sign-in, Notifications and Devices. Nothing is edited on this page itself. Each card opens its own screen or dialog, so a stray tap never changes anything, and personal settings belong to no module, so every role has them in every organization.

## Editing a profile

Jaylen chooses Edit profile. His name and mobile are his to change. His email is shown, but read-only, because it is how he signs in to every organization he belongs to, and changing it needs a verified flow that comes later. His role and organization sit under Set by Harbourview Youth Collective. He adds his middle initial and a new mobile number and saves. A toast says Profile saved, and the top bar already shows the new name.

## Only this organization

The name and mobile belong to the membership, not to the person. So when Priya, who volunteers at Harbourview and at Northgate, changes her name at Harbourview, Northgate still shows the name it knew. The request never names a membership; the server takes it from the session. An empty name or a mobile without its area code is refused with a message on each field and a summary at the top. The change is audited without the values. Sofía Rivera is a youth, and her name comes from her child record, so she sees it read-only with a note to ask staff; she can still add a mobile.

## Changing a password

Back on Your account, Jaylen chooses Change password. The dialog asks for his current password, then the new one twice. When he types the wrong current password, the field says That isn't your current password, and nothing changes. With the right one, the dialog closes and a toast says Password changed, your other devices were signed out. His session version went up, which ends every other session in every organization, while this device was given a fresh cookie and carries on. The same twelve character rule applies as everywhere else, and the audit entry never holds the password.

## Display and theme

Sofía opens Change display on her phone. Theme offers System, Light and Dark, and System, the default, follows the device. She picks Dark and the whole app turns dark at once, before she saves. She picks Larger text and every page grows by a quarter, and the top bar makes room by moving links into More rather than scrolling sideways. Reduce motion turns off animations and smooth scrolling whatever the device says. She saves, and a toast says Display saved. Her choice belongs to her, not to an organization, so it follows her to every device she signs in on. Leaving without saving puts the saved choice back, and signing out hands the theme back to the device.

## Notifications follow their modules

The Notifications card opens the choices from the notifications journey. Sofía sees grades and badges, assigned work, messages and announcements. When Harbourview turns Messages off, Messages and Announcements are not offered at all, and saving either answers not found, as every endpoint of a module that is off does. A kind her role never receives answers unprocessable instead.

## Other states

An invalid profile shows each problem twice, at the field and in the summary. A save that fails keeps what was chosen and says nothing changed. Here are the notifications with Messages off, the invalid profile and the failed display save.

## How it is tested

The API tests ProfileTests, ChangePasswordTests and DisplayPreferencesTests cover the active membership only, a youth's read-only name, the wrong current password, other sessions ending, the audit in one organization, preferences following Priya to Northgate and never reaching Grace, and the unknown values. NotificationPreferencesTests covers the not found answer for a module that is off. In the browser, the edit profile, change password, display and theme, and notification specs walk Jaylen, Sofía, Daniel and Priya on a laptop and a phone, with accessibility checks in both themes.

## Recap

Things to remember. Your account is the one place for personal settings, and every card opens its own screen or dialog. The profile belongs to the membership; the password, theme and text size belong to the person. Changing the password ends every other session. A module that is off has no notification choices. Next, configuring the organization.
