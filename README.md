# ORBIT — Futuristic 3D Portfolio

A **complete, free, source-editable multi-page developer portfolio** for Satyajit Sahoo. A cinematic, blue-violet, holographic interface based on the selected design direction, with **real-time 3D cube rendering**, orbiting objects, scroll-reactive animations, projects, writing, a contact inbox, a public guestbook and private moderation controls.

**This is a real web application, not an HTML mockup or a static screenshot.**

## Quick start

**Requirements:** Node.js 20 or newer. No packages to install. No API keys required for basic local use.

```bash
# From the extracted project folder
npm run dev
```

Then visit **http://localhost:4173**.

`npm start` uses the same server without watch mode. You can set `PORT=3000` to use another port (see below). The application server serves all page routes and the API.

## Website pages

| URL | Description |
| --- | --- |
| `/` | Cinematic homepage and interactive rotating/scroll-reactive 3D Rubik-style core |
| `/about` | About, principles and background |
| `/projects` | Filterable selected work |
| `/projects/fabricflow` | FabricFlow case study |
| `/projects/alphazero-hrms` | AlphaZero HRMS case study |
| `/projects/kya-kare` | Kya Kare AI product case study |
| `/experience` | Engineering experience timeline |
| `/skills` | Tech stack and simplified architecture diagram |
| `/journal` | Engineering notes / blog |
| `/journal/<slug>` | Standalone articles |
| `/contact` | Working server-side contact form |
| `/guestbook` | Community comments, moderated before display |
| `/lab` | Dedicated interactive 3D lab |
| `/privacy` | Data handling and privacy starter notice |
| `/admin` | Private admin dashboard for contact inbox and guestbook moderation |

## How the 3D background works

The hero cube and the scrolling ambient scene are **computed in real time**, not exported images:

- `public/assets/js/cube3d.js` implements actual 3D vertex geometry, 26 separately modeled cubies, 3D rotation, face normals, perspective projection and depth sorting.
- Surface gradients, glowing outlines, tech markings, orbital rings, a projected holographic platform and small satellites are rendered into Canvas2D.
- Pointer movement shifts the core's viewing angle. Scroll changes its rotation and gently separates the individual cubies. The **Twist the Cube** button actually turns the top layer by 90° through a smooth three-dimensional transformation.
- `BackdropField` places additional 3D rotating wireframe cubes behind the content on every page.
- `/lab` contains a larger interactive cube scene.
- Reduced-motion system preferences are respected and rendering is frame-throttled on smaller screens.

**Rendering note:** This self-contained version uses **JavaScript 3D math + Canvas2D**, not Three.js or React Three Fiber. The geometry genuinely rotates in 3D; the code does **not** use prerendered WebGL assets or an MP4 loop. This approach avoids heavyweight packages, simplifies deployment and can run without fetching remote JavaScript. The optional Google Fonts stylesheet requires connectivity; system fonts are used as fallback.

## Customize content before publishing

Edit **`public/assets/js/content.js`**:

- `profile.name`, `profile.role`, `profile.location`, `profile.email` (public contact email if desired), `profile.github`, `profile.linkedin`.
- `projects` (descriptions, technology stack, case-study highlights). Current projects are high-level examples; verify exact facts and permissions to share them publicly.
- `skills`, `experience`, and `articles`.

If you want a resume download instead of the **Request my resume** contact CTA, place a PDF at `public/resume.pdf` and change the homepage button URL in `app.js` to `/resume.pdf` (regular anchor link; do not attach `data-link`).

All page structure is in **`public/assets/js/app.js`**. All visual styles and responsive breakpoints are in **`public/assets/css/style.css`**. The 3D source is in **`public/assets/js/cube3d.js`**.

## Contact form — how it actually works

`POST /api/contact` validates name/email/subject/message, checks a hidden spam-trap field, rate-limits submissions and saves them in the private `data/inbox.json` file. Files in `data/` are **not publicly served**.

Contact messages can be read at `/admin` after setting `ADMIN_TOKEN`. If you want notifications, set `CONTACT_WEBHOOK_URL` to an HTTPS endpoint that accepts a JSON `POST` (for example, a workflow you've configured in Make/n8n). **The form does not send email by itself.** It stores submissions reliably only while `DATA_DIR` is persisted by your host.

## Guestbook/comments + admin

- Visitors submit through `POST /api/guestbook`.
- New notes are stored as `pending`, not published.
- Public `GET /api/guestbook` returns **approved** entries only.
- Access the `/admin` page with an owner-set `ADMIN_TOKEN` (minimum 16 characters).
- The admin dashboard shows pending notes, all guestbook notes, and contact inbox submissions. Approve/reject notes there.
- Alternatively, moderate through the command line:

```bash
npm run moderate -- list
npm run moderate -- approve <message-id>
npm run moderate -- reject <message-id>
```

The admin token is never exposed in the client HTML and is compared in constant time on the server. Use **HTTPS** when deployed. The browser keeps it for the tab session after login.

## Environment variables

| Name | Purpose |
| --- | --- |
| `PORT` | HTTP listening port, default 4173 |
| `SITE_URL` | Public URL for canonical tags, sitemap and robots, e.g. `https://mydomain.com` |
| `ADMIN_TOKEN` | Secret 16+ character value required for `/admin` |
| `DATA_DIR` | Server-side folder for guestbook and contact records. Default `./data` |
| `CONTACT_WEBHOOK_URL` | Optional HTTPS webhook for contact notifications |

Example for **Windows PowerShell**:

```powershell
$env:ADMIN_TOKEN="replace-with-a-strong-random-secret"
$env:PORT="4173"
npm run dev
```

Example for **Linux/macOS**:

```bash
ADMIN_TOKEN='replace-with-a-strong-random-secret' PORT=4173 npm start
```

Node.js 20.6+ can also read `.env` with `node --env-file=.env server/index.mjs`. Start from `.env.example`, set your own values, and never commit actual secrets.

## Deployment notes (Railway / VPS / Docker)

- Start command: `npm start`
- Node runtime: 20+.
- Configure `SITE_URL`, `ADMIN_TOKEN` and optional `CONTACT_WEBHOOK_URL`.
- **Mount persistent disk storage** and point `DATA_DIR` at that directory (e.g. `/data`). Railway's default app filesystem is not a durable database; without a persistent volume, comments and inquiries may disappear on redeploy.
- Back up `DATA_DIR`, enforce permissions and monitor disk capacity.
- For production with more than one server instance, replace file storage with PostgreSQL and a shared, persistent rate-limit backend. Current file-lock queue is safe for one Node process, not multi-instance writes.
- Review `public/assets/js/content.js` and the `/privacy` text before launch.
- Custom domains and HTTPS should be configured in your hosting provider; this project does not automatically deploy.
- `/sitemap.xml` and `/robots.txt` are generated by the server.

## Tests

```bash
npm test
```

Automated tests cover API validation, server routes, HTML page-template rendering, 3D scene-rendering calculations, contact submission and data storage, pending guestbook moderation, admin authorization, approval, and public display.

**Visual test disclosure:** The automated Chromium environment blocked direct navigation to localhost. I instead injected the app assets into an isolated browser document to visually review desktop/mobile homepage, projects and contact layouts, and verified twist-button animation plus mobile navigation without JavaScript exceptions or horizontal overflow. This does **not** replace a full real-host, cross-browser and device test: run the app locally and check all routes before publishing.

## Directory layout

```text
satyajit-orbit-portfolio/
├── package.json
├── .env.example
├── server/index.mjs              # Web server, validation, contact + guestbook + admin APIs
├── public/
│   ├── index.html                # App shell
│   └── assets/
│       ├── favicon.svg
│       ├── css/style.css         # Full responsive visual system
│       └── js/
│           ├── app.js            # All routes, templates, interactions and forms
│           ├── content.js        # Editable website content
│           └── cube3d.js         # Cube and background 3D engines
├── scripts/moderate.mjs          # Optional guestbook CLI moderation
├── tests/                        # No-network Node.js test suite
├── data/                         # Private runtime data (ignored by Git)
└── LICENSE                       # MIT
```

MIT licensed. No external runtime JavaScript dependencies.
