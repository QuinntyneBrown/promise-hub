import type { FakeApi } from "./fake-api";
import type { ModuleId } from "./seed";

const ALL: ModuleId[] = [
  "Roster",
  "Slips",
  "RollCall",
  "QuickCards",
  "Pickup",
  "Messages",
  "Incidents",
  "Reports",
  "Learning",
  "Mentoring",
];

/**
 * Report, export and import learning data (L2-127 to L2-131): Nadia placed in After-School Tutoring with both Knowing Yourself lessons done,
 * Sofía with none; Mateo present and Sofía absent tonight; Daniel mentors Nadia and Sofía, logged a check-in with Nadia and flagged her.
 */
export function learningReports(api: FakeApi): void {
  api.setModules("org-harbourview", ALL);
  api.placeInProgram("c-nadia", "p-tutoring");
  api.learningState.complete("m-nadia", "l-strengths", "l-values");
  api.markAttendance("e-tutoring-today", "c-mateo", "Present");
  api.markAttendance("e-tutoring-today", "c-sofia", "Absent");
  api.assignYouthMentor("c-nadia", "m-daniel");
  api.assignYouthMentor("c-sofia", "m-daniel");
  api.mentorCheckIns.seed({
    childId: "c-nadia",
    youthName: "Nadia Haddad",
    mentorId: "m-daniel",
    date: "2026-11-03",
    kind: "OneToOne",
    engagement: "Engaged",
  });
  api.seedRaisedFlag({
    childId: "c-nadia",
    youthName: "Nadia Haddad",
    raisedById: "m-daniel",
    raisedBy: "Daniel Osei",
    severity: "Medium",
    reason: "Missed three sessions in a row.",
  });
}

/** Northgate with Reports on and Learning and Mentoring off. */
export function northgateReports(api: FakeApi): void {
  api.setModules("org-northgate", [
    "Roster",
    "RollCall",
    "QuickCards",
    "Reports",
  ]);
}
