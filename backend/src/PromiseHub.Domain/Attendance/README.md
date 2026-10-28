# Attendance

`AttendanceRecord` is a child's attendance at one session: its status follows check-in (not yet, present, absent, signed out), qualified as late or excused (ADR 0065); every change appends an `AttendanceEvent` keyed by its client action id. `AttendanceMark` names the four marks the history and corrections speak of. Also no-show alerts, walk-ins, approved pickups and pickup requests.
