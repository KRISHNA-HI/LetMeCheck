# LetMeCheck

A modern manga discovery and reading-management web app for discovering manga, organizing a personal library, tracking reading progress, and managing favorites and notes.

## Overview

LetMeCheck is built around a simple idea: make it easy to discover manga and keep track of what you are reading.

The app supports guest browsing for discovery while account-based features provide personalized and persistent data.

### Main Experience

```text
Guest User
    ↓
Discover Manga
    ↓
Search & Explore
    ↓
View Manga Details
    ↓
Sign In / Create Account
    ↓
Personal Library
    ├── Favorites
    ├── Reading Status
    ├── Reading Progress
    └── Personal Notes
```

---

## Features

### Manga Discovery

- Browse and discover manga
- Search for manga
- View manga details
- View covers, titles, genres, descriptions, and available catalog information
- Dynamic featured manga based on the user's recent activity and preferences
- Responsive interface for desktop and mobile devices

### Personal Library

Users can organize manga into their personal library and manage their reading activity.

Supported functionality includes:

- Reading
- Pending / planned reading
- Completed
- Favorites
- Reading progress
- Personal notes

### Favorites

Users can:

- Add manga to favorites
- Remove manga from favorites
- View their favorite manga
- Keep favorites synchronized with their account

### Reading Progress

Users can track their progress and continue from where they left off.

Progress is associated with the authenticated user and is designed to survive:

- Page refreshes
- Sign-out/sign-in
- Future sessions

### User Accounts

Authentication is handled through Supabase Auth.

Users can:

- Create an account
- Sign in
- Sign out
- Confirm their email
- Use multiple independent accounts
- Maintain separate personal data for each account

Guest users can browse the application without creating an account. Account authentication is required only for features that need personal data storage.

---

## Data Persistence

Supabase PostgreSQL is the primary persistent data source for user-specific information.

The application may also use browser storage as a local cache where appropriate.

The intended data flow is:

```text
User Action
     ↓
React Application State
     ↓
Persistence / Sync Layer
     ↓
Supabase PostgreSQL
     ↓
User-specific Data
```

On application startup:

```text
Application
     ↓
Authentication Session
     ↓
Identify Current User
     ↓
Load User Data
     ↓
Hydrate Application State
     ↓
Display Personal Library
```

User data must always remain isolated by the authenticated user's ID.

A user's:

- Favorites
- Library
- Reading status
- Reading progress
- Notes

must never appear in another user's account.

---

## Authentication

LetMeCheck uses Supabase Authentication.

The authentication system supports:

- Email/password registration
- Email/password sign-in
- Email confirmation
- Session persistence
- Sign-out
- Multiple user accounts
- User-specific data

The application must never hardcode a specific user's:

- Email address
- Password
- User ID
- UUID
- Profile

Every account is handled through the authenticated Supabase session.

### Email Confirmation

When email confirmation is enabled:

```text
Sign Up
   ↓
Supabase creates account
   ↓
Confirmation required
   ↓
User confirms email
   ↓
Account becomes confirmed
   ↓
User can sign in
```

Authentication email redirects must be environment-aware and must not depend on a production `localhost` URL.

---

## Security

Security is handled primarily through Supabase Authentication and PostgreSQL Row Level Security (RLS).

Important principles:

- User-specific records must be associated with the authenticated user.
- RLS should restrict users to their own data.
- Authentication must not be bypassed.
- No privileged Supabase service-role key should be exposed in frontend code.
- Public Supabase configuration may be used where appropriate.
- Secrets must never be committed to the repository.
- Guest users must not be given access to private user data.

The frontend should never rely on hiding UI elements as the only security mechanism. Database-level authorization must protect user data.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| TypeScript | Application development |
| Vite | Development and production build |
| Tailwind CSS | Styling |
| Supabase Auth | Authentication |
| Supabase PostgreSQL | Persistent database |
| Browser Storage | Local caching where appropriate |
| GitHub | Source control and project backup |

---

## Project Structure

```text
LetMeCheck/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── manga/
│   │   └── ...
│   │
│   ├── hooks/
│   │   └── ...
│   │
│   ├── pages/
│   │   └── ...
│   │
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── storage.ts
│   │   ├── sync.ts
│   │   └── ...
│   │
│   ├── types/
│   │   └── ...
│   │
│   ├── utils/
│   │   └── ...
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── supabase/
│   ├── migrations/
│   └── ...
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Development Setup

### Requirements

- Node.js
- npm
- Git
- A Supabase project

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The development server normally runs on:

```text
http://localhost:3000
```

The exact port may vary depending on the Vite configuration.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Environment Variables

Supabase configuration should be provided through environment variables.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Use the project's current Supabase public/publishable credentials.

### Never Commit

Do not commit:

```text
.env
.env.local
```

or any file containing:

- Passwords
- Service-role keys
- Private API keys
- Database credentials
- Other secrets

---

## Application Architecture

The application is divided into several major layers.

### UI Layer

React components handle:

- Pages
- Manga cards
- Manga details
- Library
- Favorites
- Progress
- Notes
- Authentication interfaces

### State Layer

React state and hooks manage:

- Current user
- Manga data
- Library state
- Favorite state
- Reading status
- Reading progress
- Loading states
- Error states

### Service Layer

Services handle communication with external systems.

Examples include:

```text
src/services/supabase.ts
src/services/storage.ts
src/services/sync.ts
```

These layers should remain separated from presentation components as much as practical.

### Database Layer

Supabase PostgreSQL stores persistent user-specific data.

The database should remain the authoritative source for durable account data.

---

## Data Ownership

The application follows a user-specific data model.

Conceptually:

```text
Supabase Auth User
        │
        │ user.id
        ↓
┌─────────────────────────┐
│ User-specific records   │
├─────────────────────────┤
│ Favorites               │
│ Library                 │
│ Reading Status          │
│ Reading Progress        │
│ Notes                   │
└─────────────────────────┘
```

For example:

```text
User A
 ├── Favorite Manga 1
 ├── Favorite Manga 2
 └── Reading Progress

User B
 ├── Favorite Manga 3
 └── Reading Progress
```

User A must never receive User B's records.

---

## Error Handling

The application distinguishes between different types of failures.

### Loading

The requested information is still being retrieved.

```text
Loading...
```

### Temporary Failure

The request may have failed because of:

- Network problems
- API timeout
- Rate limiting
- Temporary server failure
- CDN/image failure

Temporary failures should not automatically be interpreted as permanent missing data.

### Not Found

A resource should only be considered unavailable when the application has reliable confirmation that it does not exist.

For example:

```text
Loading
   ↓
API request
   ↓
Successful response
   ↓
No catalog found
   ↓
Catalog not found
```

A temporary network error should instead follow:

```text
Loading
   ↓
Temporary failure
   ↓
Retry / recovery
   ↓
Successful response
```

---

## Manga Cover Handling

Manga covers may depend on external image servers or APIs.

The application should distinguish between:

- Cover still loading
- Cover successfully loaded
- Temporary image failure
- Permanently unavailable cover

A temporary image failure should not immediately replace a previously available cover with a permanent "No cover" state.

Recovery should use sensible retry behavior without creating excessive requests.

---

## Dynamic Home Content

The Home page can display manga dynamically based on the user's recent activity and preferences.

The intended loading flow is:

```text
Home loads
     ↓
Determine session
     ↓
Load relevant user activity
     ↓
Determine featured manga
     ↓
Render featured manga
```

A default manga may be used only when the application has finished determining the user's personalized content and no suitable manga is available.

The UI should avoid displaying a default manga briefly before replacing it with personalized content.

---

## Guest Mode

LetMeCheck is designed to allow users to explore the application without immediately creating an account.

Guests can access:

- Home
- Discovery
- Search
- Manga details
- General browsing

Authentication is required for personal features such as:

- Favorites
- Library
- Reading progress
- Reading status
- Notes
- Profile

When a guest attempts to use an account-only feature, the application should provide a clear sign-in/create-account path rather than displaying a raw authentication error.

---

## Development Workflow

Before modifying an important system:

1. Reproduce the problem.
2. Identify the root cause.
3. Inspect the existing implementation.
4. Make the smallest safe change.
5. Test the affected feature.
6. Test related functionality.
7. Build the application.
8. Commit the working version to Git.

Avoid unnecessary rewrites of working systems.

In particular, do not replace:

- Authentication
- Persistence
- Database structure
- Synchronization
- API integration

without first establishing that the existing implementation cannot satisfy the requirement.

---

## Testing Checklist

Before considering a major release, test:

### Authentication

- [ ] New account registration
- [ ] Existing email registration
- [ ] Correct password sign-in
- [ ] Incorrect password sign-in
- [ ] Email confirmation
- [ ] Resend confirmation
- [ ] Sign-out
- [ ] Session restoration
- [ ] Multiple accounts
- [ ] User isolation

### Favorites

- [ ] Add favorite
- [ ] Remove favorite
- [ ] Refresh
- [ ] Sign out
- [ ] Sign in again
- [ ] Verify persistence
- [ ] Verify different users cannot see each other's favorites

### Library

- [ ] Add manga
- [ ] Remove manga
- [ ] Change reading status
- [ ] Refresh
- [ ] Sign out
- [ ] Sign in again
- [ ] Verify persistence

### Reading Progress

- [ ] Update progress
- [ ] Refresh
- [ ] Sign out
- [ ] Sign in
- [ ] Verify progress

### Notes

- [ ] Create note
- [ ] Edit note
- [ ] Delete note
- [ ] Refresh
- [ ] Sign out/sign in
- [ ] Verify persistence

### Manga Data

- [ ] Search
- [ ] Open manga details
- [ ] Load catalog
- [ ] Load covers
- [ ] Handle temporary API failures
- [ ] Handle unavailable manga correctly

### Responsive UI

- [ ] Mobile
- [ ] Tablet
- [ ] Desktop
- [ ] Touch interactions
- [ ] Navigation
- [ ] Library layout
- [ ] Manga cards
- [ ] Hero section

---

## Production Deployment

The project is intended to be deployable as a static web application.

Before production deployment:

1. Build the application.
2. Configure production environment variables.
3. Configure Supabase authentication redirect URLs.
4. Configure the production site URL in Supabase.
5. Verify email confirmation redirects.
6. Verify authentication on the production domain.
7. Verify database/RLS behavior.
8. Test multiple accounts.
9. Test persistence after refresh and re-login.
10. Verify that no development-only URLs remain in production configuration.

### Important

Development URLs such as:

```text
http://localhost:3000
```

must not be used as production authentication redirect destinations.

Authentication redirects should be configured for the actual deployed LetMeCheck domain.

---

## Current Development Status

LetMeCheck is currently under active development.

### Working

- Manga discovery
- Manga search
- Manga details
- User registration
- User sign-in
- User sign-out
- Email confirmation
- Multiple user accounts
- Favorites
- Personal library
- Reading status
- Reading progress
- Personal notes
- Persistent user data
- User-specific data isolation
- Dynamic featured manga

### Under Refinement

- Temporary manga cover loading failures
- Temporary catalog/API failures
- Error recovery and retry behavior
- Home page loading behavior
- Personalized hero loading without default-content flashing
- Production authentication redirects
- Final deployment configuration
- Mobile UI refinement

---

## Project Principles

LetMeCheck follows these core development principles:

### 1. User Data Comes First

Personal data must be persistent, reliable, and isolated between accounts.

### 2. Don't Confuse Temporary Errors With Missing Data

Network and API failures should not immediately become permanent "not found" states.

### 3. Guest-Friendly by Default

Users should be able to explore the application before being asked to create an account.

### 4. Secure by Design

Authentication and database-level authorization should protect private user data.

### 5. Minimal Changes

Working systems should not be unnecessarily rewritten.

### 6. Test Actual Behavior

A successful build does not prove that a feature works.

Important flows should be tested from the user's perspective, including refreshes, sign-outs, sign-ins, network failures, and multiple accounts.

---

## Repository

The project source code is maintained in GitHub.

Use Git as the source of truth for stable project versions and development history.

---

## License

This project is currently under development.

License and distribution terms will be defined before public release.
