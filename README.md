# Society Maintenance Tracker

A comprehensive web application for managing residential society maintenance complaints and notices. It provides a split-view system where residents can log, track, and manage their complaints, while administrators get a high-level dashboard to review metrics, escalate priorities, post important notices, and resolve issues efficiently. The app features a premium dark-mode, glassmorphic UI powered by WebGL 3D elements for a high-end experience.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database ORM:** Prisma
- **Database:** Neon Postgres (Serverless)
- **File Storage:** Cloudinary (for complaint photos)
- **Email:** Brevo Transactional Email
- **Styling:** Tailwind CSS (Dark Mode / Glassmorphism)
- **Animation & 3D:** framer-motion, three.js, @react-three/fiber, @react-three/drei

## Setup Guide

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd <repo-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory and populate it with the variables described in the `.env.example` section below.

4. **Database Setup**
   Ensure your Neon Postgres instance is running and your connection strings are set.
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to the database
   npx prisma db push
   
   # (Optional) Seed the database with an admin user
   npx prisma db seed
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## `.env.example`

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@host/db"
DIRECT_URL="postgresql://user:password@host/db" # Optional for some setups/seed scripts

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Brevo (Email Notifications)
BREVO_API_KEY="your_brevo_api_key"
EMAIL_FROM="updates@yoursocietyapp.com" # Must be a verified Brevo sender
```

## API Documentation

### Auth
- **`POST /api/auth/register`**
  - **Auth:** None
  - **Body:** `{ name, email, password, flatNumber }`
  - **Response:** `{ token, user }` (Sets HttpOnly cookie)
- **`POST /api/auth/login`**
  - **Auth:** None
  - **Body:** `{ email, password }`
  - **Response:** `{ token, user }` (Sets HttpOnly cookie)
- **`GET /api/auth/me`**
  - **Auth:** Any authenticated user
  - **Response:** `{ user }`
- **`POST /api/auth/logout`**
  - **Auth:** None
  - **Response:** `{ success: true }` (Clears HttpOnly cookie)

### Complaints
- **`GET /api/complaints`**
  - **Auth:** Resident (sees own) / Admin (sees all)
  - **Query Params:** `status`, `category`, `page`, `limit`, `from`, `to`
  - **Response:** `{ complaints, total, page, limit }`
- **`POST /api/complaints`**
  - **Auth:** Resident / Admin
  - **Body:** `{ category, description, photoUrl, priority }`
  - **Response:** `{ complaint }`
- **`GET /api/complaints/[id]`**
  - **Auth:** Resident (if owner) / Admin
  - **Response:** `{ complaint }` (Includes resident details and history timeline)
- **`PATCH /api/complaints/[id]`**
  - **Auth:** Admin
  - **Body:** `{ status?, priority?, description?, category? }` (Admins can edit any, Residents can only edit description/category if OPEN)
  - **Response:** `{ complaint }`
- **`DELETE /api/complaints/[id]`**
  - **Auth:** Resident (if owner and OPEN) / Admin
  - **Response:** `{ success: true }`
- **`GET /api/complaints/overdue`**
  - **Auth:** Admin
  - **Response:** `{ overdue }`

### Notices
- **`GET /api/notices`**
  - **Auth:** Any authenticated user
  - **Response:** `{ notices }`
- **`POST /api/notices`**
  - **Auth:** Admin
  - **Body:** `{ title, body, isImportant }`
  - **Response:** `{ notice }`
- **`PATCH /api/notices/[id]`**
  - **Auth:** Admin
  - **Body:** `{ title, body, isImportant }`
  - **Response:** `{ notice }`
- **`DELETE /api/notices/[id]`**
  - **Auth:** Admin
  - **Response:** `{ success: true }`

### Dashboard / Stats
- **`GET /api/stats`**
  - **Auth:** Admin
  - **Response:** `{ stats: { complaints, categories, users, notices } }`

## Database Schema

- **User**: Standard user model with roles (`RESIDENT`, `ADMIN`), securely stores hashed passwords and associates with complaints/notices/history.
- **Complaint**: The core entity storing categorical data (`PLUMBING`, `ELECTRICAL`, etc.), description, photo URLs, status (`OPEN`, `IN_PROGRESS`, `RESOLVED`), and priority (`LOW`, `MEDIUM`, `HIGH`). It relates to a specific resident.
- **ComplaintHistory**: A timeline log tracking state changes and notes for individual complaints. Tracks the actor (User) who made the change.
- **Notice**: Society announcements created by Admins. Can be flagged as `isImportant` to be pinned.

## Note on Overdue Detection

Overdue detection is driven dynamically per-priority rather than relying on a flat threshold. The system calculates an SLA deadline relative to the complaint's `createdAt` timestamp:
- **HIGH Priority:** Overdue if not resolved within **24 hours**.
- **MEDIUM Priority:** Overdue if not resolved within **72 hours**.
- **LOW Priority:** Overdue if not resolved within **168 hours (7 days)**.

## Note on Email Delivery

The application uses **Brevo**'s Transactional Email API (not Resend) for delivering notifications (e.g., complaint creation and status updates). Ensure that the `EMAIL_FROM` environment variable is set to an email domain that is verified in your Brevo account, otherwise the API calls will be rejected.
