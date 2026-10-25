# 0014: Slips send through the message path and answer to their own module

- Status: accepted
- Date: 2026-10-25

## Context

Prompt 11 asks that a program director write an event's slip, send or schedule it, edit it after sending and watch signatures (`L2-014`). Slice 10 built messages: households, channels, the SMS cap and a per-tenant send job. Slips must still reach guardians when an organization has Permission slips on and Messages off.

## Decision

- **Model.** `PermissionSlip` carries the title, text (at most 600 characters, as in the mock), sign-by date, the optional questions (photos, swimming, lunch), the reminder choice, the channel, the status (`Draft`, `Scheduled`, `Sent`), the scheduled time, a version and the latest message. `SlipSignature` records one guardian's answer for one child to one version (`Signed`, `Declined`, or `Superseded` after a material edit).
- **Sending.** `SlipSender` validates the text and a sign-by date before the event day in the organization's time zone, then queues a message to the event's households through `MessageWriter`, the same writer Messages uses. `Message.Source` is `Slips`, and the send job sends a message only while its source module is on, so slips go out with Messages off and stop when Slips is off.
- **Scheduling.** A future time schedules the slip; `SendDueSlipsHandler` runs in the same per-tenant job and sends slips whose time has come while Slips is on. Cancelling returns the slip to a draft; send-now sends a scheduled slip at once. Other transitions answer 409.
- **Editing.** A sent slip's text, title and date can change. A small change keeps every answer. A material change starts a new version, supersedes the answers and sends a "has changed, please sign again" message.
- **Access.** `ManageSlips` (admins, directors, site leads) saves, sends and edits; every staff role can read. The editor lives in the `slips` library and the app mounts it at `/events/:eventId/slip`, where the mocks put it, with route parameters inherited by child routes.

## Consequences

The guardian's signing page and per-household links (`sign-slip`, `L2-026`), reminders on the chosen schedule (`remind-and-clear`), translation of the text and a delivery preview in the editor come later. Until then the text message names the slip and its date; answers come from the signing slice.
