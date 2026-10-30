# 91 · Report Learning Bond outcomes

An organization that helps families claim money they are owed wants to know it worked, and so do its funders. This video follows Marisol Delgado, Harbourview's program director, as she reads the Learning Bond dashboard and exports the figures for a funder. Throughout, it shows counts and sums, never a family.

## The dashboard

Learning Bond in the menu opens the covered households, and Marisol's Dashboard button opens the figures. There are six of them. Households invited: one hundred and eight. Started: forty-three. Completed, meaning at least one application sent: twenty. Children with a Learning Bond application: twenty-five. Estimated dollars unlocked: thirty-nine thousand nine hundred, from the Learning Bond and the benefits together. Confirmed dollars deposited: almost twelve thousand. Each dollar figure is split into Learning Bond and benefits.

## By program, and why some say fewer than five

Below the figures, a row for each covered program. After-School Tutoring and Saturday Sports show their numbers. Winter Camp has only a few families under way, so every figure reads fewer than five, and its dollars are withheld. A small count could point to a family, so the dashboard never shows one. Marisol filters by program, or by the last thirty or ninety days. The figures are computed fresh on every read from the organization's own records, so another organization's families never count here.

## Export for funders

Export for funders writes the same figures as a CSV, with one row per covered program and a total. It adds the confirmed dollars per completed household. Counts under five read "less than five", and their dollars are blank. No row names a family, a child or an amount per family. The file is kept for seven days, like every report export, and the export is recorded in the audit log.

## On a phone, and for other roles

On a phone, the figures stack in one column and the table keeps the program and its key numbers. The dashboard is for roles that read reports: admins, program directors and site leads. A youth worker who opens it is told who sees it, and can still help families from the covered households list.

## How it is tested

The API tests cover the zero state at launch, and a single family under way reading fewer than five with its dollars withheld, overall and for its program. They cover a role without report access refused, the module off returning not found, and another organization never counted. They also cover the funder CSV: one row per program and a total, its markers, no names, the audit entry, and the link gone after seven days. In the browser, the dashboard spec walks Marisol and a youth worker through it, with accessibility checks, against the fake API.

## Recap

Things to remember. Six figures, computed on read from the organization's own records. Dollars are split into Learning Bond and benefits. Fewer than five households and the figure is masked, its dollars withheld. The funder export is the same, per program and in total, kept seven days and audited. That completes the Learning Bond for staff. Next, the agent that explains each step to families.
