# Daily Next

`daily-next` is a Next.js rebuild of the original `daily` app with a refreshed UI.

Core workflows included:
- Todos (`/dashboard`)
- Recurring items (`/recurring`)

Removed from the original app:
- Insights
- Capture
- Grind

## Tech stack

- Next.js (App Router)
- React
- Tailwind CSS v4
- MongoDB + Mongoose
- Auth0 (`@auth0/auth0-react`)
- Theming with `next-themes` + tweakcn token sets

## Features

- Todo CRUD (create, edit, complete/uncomplete, delete)
- Recurring CRUD (create, edit, snooze, delete)
- Add recurring items to todos
- Responsive recurring view (grid on desktop, cards on mobile)
- Auth0 login and user-scoped API data via `x-user-id` header
- Style theme selector (Catppuccin, Cyberpunk, Retro Arcade)
- Light/Dark mode toggle

## Environment setup

1. Copy `.env.example` to `.env.local`
2. Fill in your real values

Required variables:

```env
MONGODB_ATLAS_CONNECTION_STRING=your_mongodb_connection_string
NEXT_PUBLIC_AUTH0_DOMAIN=your_auth0_domain
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_spa_client_id
NEXT_PUBLIC_AUTH0_AUDIENCE=your_auth0_api_audience
```

## Local development

Install dependencies and start dev server:

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173` (configured in `package.json`).

## Scripts

- `npm run dev` - start local dev server on port 5173
- `npm run lint` - run ESLint
- `npm run build` - production build
- `npm run start` - run production server

## API routes

- `GET/POST /api/todos`
- `PUT/DELETE /api/todos/:id`
- `GET/POST /api/processes`
- `PUT/DELETE /api/processes/:id`

## Data model notes

- Todos: `name`, `points` (displayed as Priority in UI), `description`, `hyperlink`, `completedAt`
- Recurring: `name`, `points` (displayed as Priority in UI), `description`, `hyperlink`, `cadence`, `lastComplete`
- Recurring status is derived from cadence + days since `lastComplete`
- `Add to todos` updates recurring `lastComplete`

## GitHub readiness checklist

- [x] `.env.local` is ignored by `.gitignore`
- [x] `.env.example` is included for safe onboarding
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Review `git status`
- [ ] Commit and push to a new GitHub repository

Example first push:

```bash
git init
git add .
git commit -m "Initial Next.js migration of daily app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
