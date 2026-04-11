# AGENTS.md

## Cursor Cloud specific instructions

This is a static portfolio website for digital artist Katarina Sokolova. No build step, no frameworks, no package manager.

- **Tech stack**: Plain HTML + CSS + vanilla JavaScript
- **Run locally**: `python3 -m http.server 8080` from the repo root, then open `http://localhost:8080/`
- **No dependencies to install** — no `package.json`, `requirements.txt`, or equivalent
- **No lint/test commands configured** — static files only
- **Placeholder images**: Files in `images/` are SVG placeholders. Replace with actual artwork JPG/PNG/WebP files, keeping the same filenames (update extensions in `index.html` accordingly).
- **Responsive design**: Desktop uses a 3D gallery carousel; mobile (<=768px) uses a swipeable card stack. Test both viewports when making changes.
