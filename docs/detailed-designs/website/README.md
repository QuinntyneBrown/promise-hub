# Website

The **Public website** module (ADR 0043, `L1-025`): the organization's anonymous, read-only public pages, served by `backend/src/PromiseHub.Application/Website/` and the `frontend/projects/website/` library at `/site/{slug}`. The organization comes from its public website slug, the one place a tenant is chosen without a membership. An unknown slug, a suspended organization and a module that is off all answer 404.

Prompt 49 built the foundation only ([serve-public-site](serve-public-site/README.md)): `GET /website/{slug}` (the organization's public name, `L2-005` criterion 7) and the placeholder `WebsitePage` (`website`). The journey prompt adds this design:

| Design | Prompt | Waypoint source |
|---|---|---|
| `explore-the-public-website` | 81 Explore the public website | `public-site` L1-PUB-001 |
