# Website

The **Public website** module (ADR 0043, `L1-025`): the organization's anonymous, read-only public pages, served by `backend/src/PromiseHub.Application/Website/` and the `frontend/projects/website/` library at `/site/{slug}`. The organization comes from its public website slug, the one place a tenant is chosen without a membership. An unknown slug, a suspended organization and a module that is off all answer 404.

Prompt 49 built the foundation ([serve-public-site](serve-public-site/README.md)): `GET /website/{slug}` and the not-found gate (`L2-005` criterion 7). Prompt 81 (Explore the public website, Waypoint `public-site`, `L2-132` to `L2-134`, ADR 0075) adds:

| Design | Waypoint source | Requirements |
|---|---|---|
| [navigate-public-site](navigate-public-site/README.md) | navigate-public-site | L2-132 |
| [explore-programs](explore-programs/README.md) | explore-programs | L2-133 |
| [browse-current-cohorts](browse-current-cohorts/README.md) | browse-current-cohorts | L2-133 |
| [view-journey-and-impact](view-journey-and-impact/README.md) | view-journey-and-impact | L2-133 |
| [contact-program](contact-program/README.md) | contact-program | L2-134 |
| [register-volunteer-interest](register-volunteer-interest/README.md) | register-volunteer-interest | L2-134 |
| [start-donation](start-donation/README.md) | start-donation | L2-134 |
