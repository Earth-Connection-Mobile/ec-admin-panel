# EC Admin Panel

Admin dashboard for the [Earth Connection Community](https://github.com/Earth-Connection-Mobile/earth-connection-mobile) platform. Manage playlists, tracks, videos, community updates, and members.

---

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Fonts:** Cormorant Garamond (headings) + Libre Franklin (body)
- **Markdown:** @uiw/react-md-editor
- **Auth:** Supabase JS SDK
- **Deployment:** Cloudflare Pages via GitHub Actions

---

## Project Structure

```
src/
├── App.jsx                    # Routes + ProtectedRoute wrapper
├── main.jsx                   # Entry point
├── index.css                  # Tailwind + CSS design tokens
├── lib/
│   ├── auth.jsx               # Auth context (SSO token + email/password)
│   ├── supabase.js            # Supabase client init
│   ├── media.js               # R2 upload/delete, audio duration extraction
│   └── preview.jsx            # Preview state context
├── pages/
│   ├── Dashboard.jsx          # Stats overview, recent content, quick actions
│   ├── Login.jsx              # Email/password admin login
│   ├── Members.jsx            # Member list, invite, activate/deactivate
│   ├── Playlists.jsx          # Playlist table, featured toggle, delete
│   ├── PlaylistEdit.jsx       # Playlist + track CRUD, bulk audio upload
│   ├── Videos.jsx             # Video table, delete
│   ├── VideoEdit.jsx          # Video upload + thumbnail + metadata
│   ├── Updates.jsx            # Update table, pin/unpin, delete
│   └── UpdateEdit.jsx         # Markdown editor + cover image
└── components/
    ├── Layout.jsx             # Sidebar nav + preview pane
    ├── Table.jsx              # Reusable data table with loading/empty states
    ├── Modal.jsx              # Confirmation dialogs
    ├── FileUpload.jsx         # Drag-drop upload with progress
    ├── Badge.jsx              # Color-coded status badges
    ├── Toast.jsx              # Toast notification system
    ├── ErrorBoundary.jsx      # Error catching
    ├── PreviewPane.jsx        # Mobile preview sidebar
    └── preview/
        ├── PhoneFrame.jsx     # iPhone mockup frame
        ├── PlaylistCard.jsx   # Mobile playlist card preview
        ├── VideoCard.jsx      # Mobile video card preview
        └── UpdateCard.jsx     # Mobile update card preview
```

---

## Authentication

Two paths into the admin panel:

1. **SSO from Mobile App:** The mobile app's Settings screen (admin-only) opens `https://ec-admin-panel.pages.dev/?token={access_token}` — the panel captures the token and sets the Supabase session.
2. **Direct Login:** Email + password via `signInWithPassword()`.

Both paths verify the user has `role = 'admin'` and `status = 'active'` in the `members` table. Non-admins are signed out and shown an error.

---

## Routes

```
/login              → Login page
/                   → Dashboard (protected)
/playlists          → Playlist list
/playlists/new      → Create playlist
/playlists/:id      → Edit playlist
/videos             → Video list
/videos/new         → Create video
/videos/:id         → Edit video
/updates            → Update list
/updates/new        → Create update
/updates/:id        → Edit update
/members            → Member management
```

All routes except `/login` are wrapped in `<ProtectedRoute>` which checks for admin auth.

---

## CRUD Operations

| Entity | Create | Read | Update | Delete | Extra |
|---|---|---|---|---|---|
| **Playlists** | New playlist form | Table list | Edit all fields | Cascade (playlist + tracks + R2 files) | Featured toggle (only one at a time) |
| **Tracks** | Individual or bulk upload | Within playlist | Edit modal per track | With R2 cleanup | Drag-to-reorder |
| **Videos** | Upload form | Table list | Edit all fields | DB record + R2 files | Auto-extract duration |
| **Updates** | Markdown editor | Table list | Edit all fields | DB record + R2 cover | Pin/unpin toggle |
| **Members** | Invite via email | Table with filters | Activate/deactivate | Soft delete (deactivate) | Search, role badges |

---

## Media Uploads

Media files are uploaded to Cloudflare R2 via the [ec-media-worker](https://github.com/Earth-Connection-Mobile/ec-media-worker).

**Upload flow:**
1. Admin selects file via drag-drop or file picker
2. `uploadToR2(file, key, session)` sends a PUT request to the worker at `/upload/{key}`
3. Worker validates admin token, stores file in R2
4. The R2 key is saved to the Supabase record (e.g., `audio_file_url`, `cover_art_url`)

**Key functions in `src/lib/media.js`:**
- `uploadToR2(file, key, session)` — Upload file to R2
- `deleteFromR2(key, session)` — Delete file from R2
- `generateFileKey(prefix, filename)` — Generate unique key: `{prefix}/{uuid}.{ext}`
- `getMediaUrl(key)` — Build full media URL
- `fetchImageAsBlob(key, session)` — Fetch image with auth header for `<img>` preview
- `getAudioDuration(file)` — Extract duration via Web Audio API

**File key prefixes:** `audio/`, `covers/`, `thumb/`, `video/`, `images/`

---

## Live Preview

Edit screens include a **mobile phone preview pane** (iPhone mockup) on the right side. As admins fill in content fields, the preview updates in real-time showing exactly how the content will appear in the mobile app.

Components: `PreviewPane.jsx` → `PhoneFrame.jsx` → `PlaylistCard.jsx` / `VideoCard.jsx` / `UpdateCard.jsx`

---

## State Management

Context-based (no Redux/Zustand):

| Context | Purpose |
|---|---|
| **AuthContext** (`lib/auth.jsx`) | Global auth state: user, session, isAdmin, signIn/signOut |
| **PreviewContext** (`lib/preview.jsx`) | Live preview data while editing content |
| **ToastContext** (`components/Toast.jsx`) | Toast notifications (success/error/info, auto-dismiss) |

Preview pane open/closed state is persisted to `localStorage`.

---

## Design Tokens

```css
--ec-bg:              #F2EBE3    /* warm cream background */
--ec-card:            #FFFFFF    /* white cards */
--ec-gold:            #D8A657    /* primary accent */
--ec-gold-hover:      #C4943F    /* darker gold */
--ec-forest:          #2D6A4F    /* green */
--ec-forest-dark:     #1B4332    /* darker green */
--ec-rust:            #9C4A1A    /* warnings/destructive */
--ec-text:            #1F2937    /* dark text */
--ec-text-secondary:  #4B5563    /* medium gray */
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://qnowfgenfmywhimcocco.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_WORKER_URL=https://ec-media-worker.britton-beckham.workers.dev
```

---

## Local Development

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

---

## Deployment

Pushes to `main` trigger GitHub Actions:

1. Install Node v20 + dependencies (`npm ci`)
2. Build with Vite → `dist/`
3. Deploy to Cloudflare Pages via `wrangler pages deploy`

**GitHub Secrets required:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
