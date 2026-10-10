# ORBIT — Futuristic 3D Portfolio

A **complete, free, source-editable multi-page developer portfolio** for Satyajit Sahoo. A cinematic, blue-violet, holographic interface based on the selected design direction, with **real-time 3D cube rendering**, orbiting objects, scroll-reactive animations, projects, writing, a contact inbox, a public guestbook and private moderation controls.

**This is a real web application, not an HTML mockup or a static screenshot.**

## Quick start

**Requirements:** Node.js 20 or newer. Run `npm install` first to install the optional PostgreSQL driver. No database credentials are required for local development; the Content Studio uses `data/posts.json` locally.

```bash
# From the repository folder
npm install
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
| `/journal` | Database-backed blog articles plus existing engineering notes |
| `/journal/<slug>` | Published dynamic and existing static articles |
| `/contact` | Working server-side contact form |
| `/thoughts` | Short thoughts and LinkedIn-style updates |
| `/guestbook` | Community comments, moderated before display |
| `/lab` | Dedicated interactive 3D lab |
| `/privacy` | Data handling and privacy starter notice |
| `/links` | Public profiles, project demos and configurable resume/hackathon links |
| `/admin` | Private admin dashboard for contact inbox and guestbook moderation |
| `/admin/content` | Private Content Studio: create/edit/delete articles and thoughts |


## Dynamic Content Studio — new feature branch

Branch: `feat/content-studio-robot-glass` (based on `dev/portfolio-improvements`).
`main` has **not** been edited and no GitHub Actions workflows were added.

### Admin workflow

1. Start the local server and open `http://localhost:4173/admin/content`.
2. Set `ADMIN_TOKEN` to a strong value (16+ characters). Log in with that token; it remains in tab session storage.
3. Choose **New content** and select **Blog post** or **Quick thought**.
4. Paste the same text you used on LinkedIn. Add title, excerpt, category, and comma-separated tags.
5. Paste **External image URL** (image must allow direct embedding) and optionally the original LinkedIn post URL. You do **not** upload or store the image.
6. Click **Preview**, **Save** to keep a draft, or **Publish now** to make it public.
7. Manage existing items from the searchable left column. Open, edit, unpublish (change visibility to Draft), or delete them.

Public articles appear on `/journal`, selected latest articles appear on the homepage, and short thoughts appear on `/thoughts`. Dynamic journal details use `/journal/<slug>`. Existing hardcoded journal notes remain accessible.

**Image warning:** LinkedIn often issues time-limited CDN URLs or blocks hotlinking, so copied `media.licdn.com` URLs may stop working. The editor previews the source and the public site displays a fallback if the image fails; the app never uses R2, S3 or local image uploads. A stable externally hosted public image URL is more reliable.

### Database setup (production)

This feature uses **PostgreSQL** when `DATABASE_URL` is configured (for example Neon, Railway PostgreSQL, or an existing managed PostgreSQL instance). Tables/indexes are created automatically at first access. The PostgreSQL driver `pg` is installed with `npm install`.

```env
# Put in local .env or in your host's private environment variables (never commit)
ADMIN_TOKEN=replace-with-a-strong-private-token
DATABASE_URL=postgresql://user:password@hostname:5432/db?sslmode=require
SITE_URL=https://your-portfolio-domain.example
```

For a local-only demo, **omit DATABASE_URL**. Posts are stored in ignored `data/posts.json`; this supports persistent local editing as long as the folder exists.

**Production requires DATABASE_URL** — the server refuses ephemeral local content storage when `NODE_ENV=production`, `VERCEL`, or `RAILWAY_ENVIRONMENT` is set. The existing guestbook and contact inbox continue using file storage; configure a persistent volume if you deploy those endpoints as a traditional Node server. Those file-backed endpoints are not yet converted to PostgreSQL.

**Vercel notice:** This repo uses a custom Node HTTP server rather than a Next.js API framework. PostgreSQL works with its Node server, but deployment on Vercel requires adapting the server to Vercel Functions and routing. Please validate locally first; do not assume a simple static Vercel deployment will make the API durable.

### Robot and UI improvements

ORB-I now appears shortly after page load across public portfolio pages (not inside private admin), changes its guidance by section, and docks away near the footer. Its bubble can be closed and opened by clicking the robot. Content cards, the editor, typography, borders, and glass layering have been refined, with smaller mobile effects and reduced-motion support.

### Test locally

```powershell
git fetch origin
git switch feat/content-studio-robot-glass
git pull origin feat/content-studio-robot-glass
npm install
npm test
npm run dev
```

Test the admin at `/admin/content`, draft vs published feeds, `/journal`, `/thoughts`, the public image fallback, and robot on desktop/mobile. The new integration tests cover admin authorization, publishing, and external image URL handling. This branch has not been deployed or visually validated against real Vercel hosting.


## Interactive Skills Cube & Scroll Companion (development branch)

The existing 3×3 Rubik puzzle appearance and multi-axis twist engine are preserved.
Each of the **six faces has nine independently labeled stickers (3 rows × 3 columns)**:
Backend, AI/agents, Databases, Cloud/DevOps, Frontend, and Architecture/Security.
A matching **3-column Skills Cube panel** on the homepage displays the complete technology names,
with one skill per tile and a link to the full Skills directory. Switching categories does not
overwrite the Rubik puzzle state; every sticker retains its original skill during twists.

A friendly CSS-only assistant **ORB-I** appears shortly after loading public pages and changes its hints at scroll stages
to introduce skills and projects. It can be dismissed and its message can be toggled.
It is a guided tour, **not a chat service**.

Mobile optimization includes offscreen Canvas pausing, fewer particles and satellites,
a smaller Canvas pixel ratio, lower frame rate, and shorter orbit paths. The robot is
shown only for early homepage stages on small screens, and reduced-motion settings are respected.

Run from the development branch:

```bash
git switch dev/portfolio-improvements
git pull origin dev/portfolio-improvements
npm test
npm run dev
```

No GitHub Actions workflow was added or changed. Merge into `main` only after local review.

## How the 3D background works

The hero cube and the scrolling ambient scene are **computed in real time**, not exported images:

- `public/assets/js/cube3d.js` projects and animates 3D geometry with pointer/scroll interaction.
- `public/assets/js/rubik.js` persists cubie positions and sticker orientation between face/slice turns.
- Surface gradients, glowing outlines, tech markings, orbital rings, a projected holographic platform and small satellites are rendered into Canvas2D.
- Pointer movement shifts the core's viewing angle. Scroll changes its rotation and gently separates the individual cubies. Home has U/R/F controls; the **3D Lab** supports clockwise and counterclockwise R/L/U/D/F/B, middle M/E/S and whole cube X/Y/Z rotations, scramble and reset. Repeated moves change the puzzle state.
- `BackdropField` places additional 3D rotating wireframe cubes behind the content on every page.
- `/lab` contains a larger interactive cube scene.
- Reduced-motion system preferences are respected and rendering is frame-throttled on smaller screens.

**Rendering note:** This self-contained version uses **JavaScript 3D math + Canvas2D**, not Three.js or React Three Fiber. The geometry genuinely rotates in 3D; the code does **not** use prerendered WebGL assets or an MP4 loop. This approach avoids heavyweight packages, simplifies deployment and can run without fetching remote JavaScript. The optional Google Fonts stylesheet requires connectivity; system fonts are used as fallback.

## Customize content before publishing

Edit **`public/assets/js/content.js`**:

- Edit `profile.name`, `profile.role`, `profile.location`, `profile.email`, `profile.github`, `profile.linkedin`, and `profile.links`.
- Add verified `profile.resume` and `profile.hackathon` URLs when available; they are intentionally blank. If a resume download is desired, use a direct PDF URL or put a PDF in `public/` and set `/resume.pdf`.
- `projects` includes 11 selected work, SaaS, AI, IoT and experiments, with verified public links where possible. Review confidential client details and public availability.
- `skills` now covers full backend, Django, GenAI, ML, cloud, databases, frontend, security and IoT categories. Review `experience` against your preferred public employment history before launch.

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

The local `tests/rubik.test.mjs` covers all face/slice rotations and inverses. Automated tests cover API validation, server routes, HTML page-template rendering, 3D scene-rendering calculations, contact submission and data storage, pending guestbook moderation, admin authorization, approval, and public display.

**Visual test disclosure:** The automated Chromium environment blocked direct navigation to localhost. I instead injected the app assets into an isolated browser document to visually review desktop/mobile homepage, projects and contact layouts, and verified twist-button animation plus mobile navigation without JavaScript exceptions or horizontal overflow. This does **not** replace a full real-host, cross-browser and device test: run the app locally and check all routes before publishing.

## Direct GitHub update

No files under `.github/workflows` were added or modified. Pull `main`, run `npm test`, then `npm run dev`. Full local/browser tests of the pushed commit are still required.

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
│           ├── cube3d.js         # 3D scene renderer
│           └── rubik.js          # Persistent Rubik puzzle state
├── scripts/moderate.mjs          # Optional guestbook CLI moderation
├── tests/                        # No-network Node.js test suite
├── data/                         # Private runtime data (ignored by Git)
└── LICENSE                       # MIT
```

MIT licensed. No external runtime JavaScript dependencies.
