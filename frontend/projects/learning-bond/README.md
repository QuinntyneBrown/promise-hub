# learning-bond

Feature library for the Learning Bond module (ADR 0076, L1-026 to L1-029): the staff settings, launch, dashboard and families pages under `/learning-bond` and `/settings/learning-bond`, and the guardian claim and benefits pages under `/g/learning-bond/:token`. The app lazy-loads it only while Learning Bond is on: staff routes through the session's modules, guardian routes when the server answers the link. Depends only on `@promisehub/api` and `@promisehub/components`.

Prompt 82 lands the empty library and its two route tables; the screens arrive with prompts 83 to 92.
