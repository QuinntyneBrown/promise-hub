# Learning Bond

The **Learning Bond** module (ADR 0076, `L1-026` to `L1-029`): an organization turns it on behind a versioned data-handling agreement, guardians claim the Canada Learning Bond and check child benefits from a text link with no account, and staff see completion status only. It is served by `backend/src/PromiseHub.Application/LearningBond/` and the `frontend/projects/learning-bond/` library, needs Roster and Messages, and is off for every organization until an admin turns it on. Social insurance numbers and financial details are encrypted under a key outside the database, decrypted only to send an application the guardian submitted, and destroyed when no longer needed; the agent explains and prepares, and never submits.

Nothing is built yet. Requirements are `L2-135` to `L2-163`; screens are the `learning-bond-*`, `settings-learning-bond`, `guardian-learning-bond`, `export-learning-bond` and `withdraw-learning-bond-consent` mocks in `docs/mocks/`.

| Design | Journey | Requirements |
|---|---|---|
| [gate-learning-bond-module](gate-learning-bond-module/README.md) | Turn on Learning Bond | L2-135, L2-162, L2-161 |
| [accept-data-handling-agreement](accept-data-handling-agreement/README.md) | Turn on Learning Bond | L2-136, L2-137 |
| [configure-coverage-and-invitation](configure-coverage-and-invitation/README.md) | Turn on Learning Bond | L2-138, L2-139 |
| [launch-invitations](launch-invitations/README.md) | Turn on Learning Bond | L2-140 |
| [view-dashboard-and-export](view-dashboard-and-export/README.md) | Report Learning Bond outcomes | L2-141, L2-143 |
| [support-families-with-status](support-families-with-status/README.md) | Help a family with Learning Bond | L2-142 |
| [open-guardian-learning-bond](open-guardian-learning-bond/README.md) | Claim the Learning Bond | L2-144 |
| [give-and-withdraw-consent](give-and-withdraw-consent/README.md) | Claim the Learning Bond | L2-145, L2-152 |
| [complete-intake](complete-intake/README.md) | Claim the Learning Bond | L2-146, L2-159 |
| [estimate-learning-bond](estimate-learning-bond/README.md) | Claim the Learning Bond | L2-147 |
| [review-and-submit-application](review-and-submit-application/README.md) | Claim the Learning Bond | L2-148, L2-149 |
| [follow-application-progress](follow-application-progress/README.md) | Claim the Learning Bond | L2-150, L2-151 |
| [offer-benefits-check](offer-benefits-check/README.md) | Check child benefits | L2-153, L2-154 |
| [list-and-apply-for-benefits](list-and-apply-for-benefits/README.md) | Check child benefits | L2-155, L2-156 |
| [remind-and-total-dollars](remind-and-total-dollars/README.md) | Check child benefits | L2-157, L2-158 |
| [run-learning-bond-agent](run-learning-bond-agent/README.md) | Every guardian page | L2-160, L2-163 |

Decisions the designs make beyond ADR 0076, each stated in the design it affects:

- The agreement routes (`/learning-bond/agreement/**`) and the signer's anonymous link (`/sign/learning-bond/{token}`, `SignerLinkAccess`) work while the module is off, because `L2-135` criterion 4 requires acceptance before the module can be turned on. The mock state `settings-learning-bond/not-accepted` describes a state the requirements make impossible.
- The household page card and the `learning-bond-invite-household` dialog live in the `households` library and depend only on `LEARNING_BOND_API`.
- `LearningBondCoverage` is the one query for covered households; `LearningBondFigures` is shared by the dashboard and the export; `LearningBondStatus` computes a household's status from its records.
- Not sure to the tax question pauses the claim like No (`L2-151` criterion 2 over `L2-147` criterion 4). Fix this on the intake pauses the claim as `AwaitingRecordFix`; the guardian change-request handler is chosen at implementation.
- Applied webhook event ids are kept on `LearningBondApplication`. A started benefit's confirmed amount is the first-year figure the program's event carries, else the catalogue estimate.
- The agent bubble shows the approved fixed line first and replaces it when the model answers within 10 s, which reconciles `L2-160` criterion 4 with the 3 s first-words budget of `L2-163`.
- The benefits catalogue matches one city per organization; multi-site organizations are not covered.
