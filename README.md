LetMeCheck

A modern manga/manhwa tracking web app for discovering titles and managing a personal reading library.

Features

Browse and discover manga/manhwa

Search titles and authors

View detailed manga information

Add titles to personal library

Mark titles as:

Reading

Pending

Completed

Dropped


Add/remove favorites

Track reading progress

User authentication

Persistent user data with Supabase

Library data remains available after refresh and sign-in again

Responsive interface for desktop and mobile

Local storage fallback for supported data when appropriate

Online synchronization through Supabase


Tech Stack

Frontend: React + TypeScript

Build Tool: Vite

Styling: CSS

Database: Supabase / PostgreSQL

Authentication: Supabase Auth

Manga Data: Manga API service

Testing: Playwright

Deployment/Development: GitHub Codespaces / Vite


Project Structure

LetMeCheck/
├── public/
├── src/
│   ├── components/
│   │   └── manga/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   ├── mangaApi.ts
│   │   ├── storage.ts
│   │   ├── supabase.ts
│   │   └── sync.ts
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── ...
├── run-e2e-test.js
├── verify-fix.js
├── E2E_TEST_GUIDE.md
├── package.json
└── README.md

Data Persistence

User library and favorite data are designed to persist through Supabase.

The application follows this general flow:

User Action
    ↓
Supabase Operation
    ↓
Check Success / Failure
    ↓
Update UI State
    ↓
Update Local Storage Fallback

Supabase operations are checked before updating the application's persistent state. Failed operations should not incorrectly make the UI appear as though data was successfully saved.

Authentication

Users can register and sign in using Supabase authentication.

After signing out and signing back in, the application should retrieve the user's saved library and favorites from Supabase.

Development

Install dependencies:

npm install

Start the development server:

npm run dev

The Vite development server normally runs at:

http://localhost:3000

Testing

The project contains end-to-end testing utilities using Playwright.

Example:

node run-e2e-test.js

Additional verification scripts are included for checking data-persistence behavior.

Current Development Focus

The current version is focused on stabilizing:

1. Favorite button interactions


2. Library status controls


3. Reading/Pending/Completed filtering


4. Mobile responsive layout


5. Library section positioning and overflow


6. Supabase data persistence


7. Refresh and sign-out/sign-in persistence


8. Error handling for failed Supabase operations



Important Development Rule

UI fixes should not unnecessarily modify:

Supabase authentication

Database schema

RLS policies

Persistence service logic

Synchronization logic

Existing data models


Unless a bug is proven to originate there.

The priority is to make the existing UI interactions and responsive layout work correctly while preserving the working data-persistence implementation.

License

This project is currently a personal development project.
