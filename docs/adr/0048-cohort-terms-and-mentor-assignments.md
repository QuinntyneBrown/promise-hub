# 0048: A cohort's term is a label on its program, and mentors are assigned per youth and per cohort under the Mentoring module

- Status: accepted
- Date: 2026-10-26

## Context

Prompt 54 ports Waypoint's cohort management (`L2-ADMIN-003`) and mentor assignment (`L2-ADMIN-005`) as `L2-061` and `L2-062`. Waypoint keeps a `Cohort` table with a required track, a lead mentor and a location, a separate `Term` table with an Upcoming, Active or Completed status (at most one Active), a `CohortMentor` join with an `IsLead` flag, and a youth's mentor as `User.MentorId`. ADR 0043 already decided that a cohort is a PromiseHub program, that mentors are Mentor memberships and that Mentoring is a module that needs Roster.

## Decision

- **Term.** `Program` gains an optional `Term` label of up to 40 characters ("2026–27", "Fall 2026"), edited on the program form and shown on Programs and the program page. The program's own start and end dates are the term's dates, so there is no term table and no Active status to keep unique. A term table, filtering by term and Waypoint's tracks wait for curriculum (prompt 56).
- **Placing youth.** Adding youth to a cohort is enrolling their child record on the program's roster with the existing enrollment endpoint, capacity check and plan limit. A child may be on several programs, as today; placement for Learning stays the earliest active program (ADR 0047). Waypoint's "already in another cohort" rule is not ported.
- **Youth mentor.** A tenant-owned `YouthMentor` row (organization, child, mentor membership, assigned at) gives a child at most one mentor in the organization; assigning again replaces it and removing deletes the row. It is set from a cohort's roster, so the endpoint is `PUT`/`DELETE /programs/{id}/youth/{childId}/mentor` and the child must be on that program's active roster.
- **Cohort mentors.** A tenant-owned `CohortMentor` row (organization, program, mentor membership, is lead) per mentor; `PUT /programs/{id}/mentors` replaces the whole team with one required lead and any supporting mentors. A mentor may lead one cohort and support another.
- **Reading.** `GET /programs/{id}/mentoring` answers the team, each roster child's mentor and the organization's active mentors (Mentor role, not removed). Any staff role may read it; only `ManagePrograms` (admin, program director) may write. Assignments to a membership that is no longer an active mentor are ignored when read.
- **Gates.** The three endpoints carry `RequireModule(Roster)` and `RequireModule(Mentoring)`, so either module off answers 404; the rows are kept and return when Mentoring is on again. Writes to an archived program answer 422. Writes are audited as Updated on `YouthMentor` or `CohortMentors`, and removal as Deleted on `YouthMentor`.
- **A mentor's youth.** `GET /mentoring/youth` lists, once each by name, the children assigned to the caller directly plus the active roster of every program that is not archived where the caller is on the team.
- **Components.** The supporting-mentor choice uses the checkbox page's existing group variant, built in the library as `ph-checkbox-group`.

## Consequences

- The mentor dashboard (prompt 55) builds on `GET /mentoring/youth`; the Mentoring page lists the assigned youth by name until then.
- Caseload balance on the staff report (`L2-ADMIN-005` criterion 3) is deferred to reports (prompt 76); clearing a cohort's whole team is deferred (a lead stays required once set).
- Removing a staff member or changing a mentor's role leaves their rows in place but drops them from every read.
