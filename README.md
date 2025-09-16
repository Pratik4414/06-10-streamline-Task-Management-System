# Project Management Platform

A full-stack role-based project & task management application with authentication, team management, reporting dashboard, and modern dark-themed UI.

## Tech Stack

### Frontend (client)
- React 19 + Vite
- React Router
- Context API for Auth
- Axios
- Recharts (dashboard charts)
- Lucide Icons
- Framer Motion (potential animations)
- Custom dark theme CSS

### Backend (server)
- Node.js + Express (ES Modules)
- MongoDB + Mongoose
- Passport (Google OAuth ready)
- JSON Web Tokens (JWT)
- Argon2id password hashing (upgraded from bcrypt)
- CORS enabled for dev

## Features
- User registration & secure login (JWT)
- Role-based access: employee / manager
- Google OAuth skeleton (extendable)
- Project creation & membership management
- Task tracking with status & priority
- Team listing (manager only endpoints)
- Dashboard stats & reporting endpoints
- Strong client-side validation (password strength, restricted email domains)
- Dark theme UI for auth pages
- Forgot Password workflow (frontend + backend stub)

## Monorepo Structure
```
client/        # React frontend
server/        # Express API server
```

## Environment Variables
Create a `.env` file in `server/` (not committed). Example:
```
MONGO_URI=mongodb://localhost:27017/project_manager
PORT=5000
JWT_SECRET=replace_this_with_a_long_random_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

(Optional) You can add an `.env.example` to document required fields.

## Install & Run
### 1. Install dependencies
```
cd client && npm install
cd ../server && npm install
```

### 2. Start development servers (two terminals)
```
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```
Frontend dev server: http://localhost:5173  
Backend API: http://localhost:5000

## Available NPM Scripts
### Client
- `npm run dev` - Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - ESLint

### Server
- `npm run dev` - Nodemon dev server
- `npm start` - Run server once

## API Routes (Summary)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/forgot-password | Forgot password (stub) |
| GET  | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET  | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| GET  | /api/team | List team members |
| POST | /api/team/add | Add team member |
| GET  | /api/reports/dashboard-stats | Dashboard stats |

(Protected routes require `Authorization: Bearer <token>`)

## Forgot Password Workflow
Current implementation: 
- Frontend sends email to `/api/auth/forgot-password`
- Backend simulates processing (logs) and returns success regardless of email existence (security-friendly)
Future extension:
1. Generate reset token
2. Store with expiration in DB
3. Send email (SendGrid / SES / etc.)
4. Add `/reset-password/:token` route & page

## Validation Rules
### Registration
- Name: 2–50 chars, letters/spaces/hyphens/apostrophes
- Email: Must belong to a curated list of popular providers (Gmail, Outlook, Yahoo, iCloud, etc., plus .edu support)
- Password: 8+ chars, upper, lower, number, special char
- Role: employee | manager

### Login
- Same email provider restrictions

## Security Notes
- JWT secret must be long & random
- Add rate limiting & helmet for production
- Implement HTTPS & secure cookies if deploying behind a proxy
- Passwords hashed with Argon2id (memory-hard; safer vs GPU cracking than bcrypt). Legacy bcrypt hashes are auto-upgraded on successful login.

## Password Hashing Migration (bcrypt -> Argon2id)
The project originally used bcrypt. It now uses Argon2id via the `argon2` npm package.

Why Argon2id?
1. Memory-hard: significantly raises cost of large-scale GPU/ASIC cracking.
2. Side-channel resistant design (id variant combines Argon2i & Argon2d strengths).
3. Encoded parameters in hash string allow future tuning without schema changes.

Migration Strategy:
1. New / updated passwords are hashed with Argon2id during `User` model pre-save.
2. During login, hash prefix inspection is performed:
	- `$argon2` => verify with Argon2
	- `$2a$`, `$2b$`, `$2y$` => legacy bcrypt verify then transparently re-hash with Argon2id
3. After successful legacy verification, the stored hash is replaced (zero-downtime rolling upgrade).

Operational Notes:
- If you still have many legacy bcrypt hashes and want to FORCE upgrade, you can script a batch rehash (not included).
- Tune memory/time cost via environment variables if needed for production hardware.
- Dynamic bcrypt import is used only if a legacy hash is encountered, keeping Argon2 the primary dependency.

## Production Build
```
# Build client
cd client
npm run build
# Serve client via a static host (Netlify / Vercel) or behind your Node server (additional wiring needed)
```

## Suggested Next Improvements
- Password reset full implementation
- Email verification flow
- Role-based UI gating (conditional rendering)
- Add tests (Jest + React Testing Library / Supertest for API)
- Add Docker compose for Mongo + services
- Add pagination for large project/task sets
- Implement refresh tokens & logout invalidation

## License
MIT (see LICENSE file if added)

## Contributing
PRs welcome. Open issues for feature discussion.

## Author
Your Name (replace in README). Add contact or portfolio link.

---
Happy building! 🚀
