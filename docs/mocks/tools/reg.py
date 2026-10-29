"""Screen registry: each screen module registers a function that fills a Builder."""
from __future__ import annotations

from kit import staff_doc, guardian_doc, auth_doc, wizard_doc, site_doc

SCREENS: list[dict] = []


class Builder:
    def __init__(self, meta: dict):
        self.meta = meta
        self.states: list[tuple[str, str, dict]] = []

    def add(self, state: str, desc: str, **kw):
        self.states.append((state, desc, kw))

    def render(self) -> dict[str, str]:
        names = [s for s, _, _ in self.states]
        out = {}
        for state, desc, kw in self.states:
            shell = kw.pop("shell", self.meta.get("shell", "staff"))
            common = dict(kind=self.meta["kind"], sid=self.meta["id"], state=state, title=self.meta["title"], desc=desc,
                          reqs=self.meta["reqs"], states=names)
            if shell == "staff":
                out[state] = staff_doc(**common, **kw)
            elif shell == "guardian":
                out[state] = guardian_doc(**common, **kw)
            elif shell == "site":
                out[state] = site_doc(**common, **kw)
            elif shell == "wizard":
                out[state] = wizard_doc(**common, **kw)
            else:
                out[state] = auth_doc(**common, **kw)
        return out


def screen(sid: str, kind: str, title: str, *, route: str | None = None, opens_from: str | None = None,
           reqs=(), na: dict | None = None, shell: str = "staff"):
    def deco(fn):
        SCREENS.append(dict(id=sid, kind=kind, title=title, route=route, opens_from=opens_from, reqs=list(reqs),
                            na=na or {}, fn=fn, shell=shell))
        return fn
    return deco
