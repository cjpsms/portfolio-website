# PORTFOLIO-website

Portfolio of cj (Pongnaruedol Pungirathanaruang), focused on projects on GitHub ([cjpsms](https://github.com/cjpsms)), with a CEDT section at the bottom of the page.

## Run

Needs Node.js 18 or newer. No `npm install` required (standard library only).

```bash
node server.js
# open http://127.0.0.1:3265
```

Configurable through env: `PORT`, `HOST` (default 127.0.0.1), `GH_USER` (default cjpsms), `GITHUB_TOKEN` (optional).

## Structure

```
server.js            serves public/, /api/repos and /api/readme/<repo name>
data/projects.json   Thai descriptions + category for each project
public/index.html    the page
public/css/style.css
public/js/particles.js  canvas dots (hero dome, ring that morphs into project names, contact card)
public/js/main.js       smooth scrolling + scroll-driven animation, project cards, detail view
public/vendor/          GSAP + ScrollTrigger, Lenis, marked, DOMPurify (bundled locally, not loaded from a CDN)
```

`/api/repos` fetches the public repos of `GH_USER` from the GitHub API (cached 10 minutes) and merges them with `data/projects.json`.
Repos not listed in projects.json show up with their GitHub description. If GitHub can't be reached, the list from projects.json is used instead.

`/api/readme/<name>` returns that repo's README as markdown (cached 6 hours), only for repos in the list.
Clicking a project card shows this README on the page.

To add or edit project descriptions: edit `data/projects.json`, then restart the server.

If the device has "reduce motion" turned on, the page skips the animations and the card row scrolls by finger/touchpad instead.
