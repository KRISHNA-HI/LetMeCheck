# LetMeCheck

LetMeCheck is an entertainment discovery and personal tracking platform for discovering movies, TV series, anime, manga, manhwa, and other titles in one organized catalog.

The app combines a structured content catalog with personal libraries, favorites, progress tracking, regional classification, and automated catalog ingestion.

## Features

- Discover and browse entertainment titles
- Search and explore the catalog
- Support for movies, TV series, anime, manga, and manhwa
- Detailed title information
- Personal library management
- Favorites
- Watching and reading progress
- Status tracking such as Watching, Reading, Completed, and Pending
- Regional catalog organization
- Language and country classification
- Genre classification
- Mobile-friendly responsive interface
- Persistent user data
- User authentication
- Automated catalog ingestion
- Administrative database integrity diagnostics

## Catalog

The catalog stores structured information for each title, including:

- Title information
- Media type
- Region
- Country
- Language
- Genres
- Release information
- Relationships between titles and metadata

Titles are organized into regional catalogs so the application can provide a clearer view of content from different markets and languages.

## Automated Ingestion

LetMeCheck includes an automated ingestion system for expanding and maintaining the catalog.

The ingestion system supports:

- Scheduled ingestion
- Configurable daily ingestion limits
- Incremental processing
- Persistent cursor/state tracking
- Region-based processing
- Duplicate prevention
- Safe repeated execution
- Metadata and relationship processing

The system is designed to continue processing from its previous state rather than repeatedly starting from the beginning.

## Database & Integrity

The application uses **Supabase/PostgreSQL** as its primary database.

Catalog data is stored using relational connections between titles and their metadata. Administrative diagnostics are available to verify that these relationships remain consistent.

Integrity checks include:

- Title-to-language relationships
- Title-to-country relationships
- Title-to-region relationships
- Title-to-genre relationships
- Missing relationships
- Orphaned records
- Classification consistency

The goal is to maintain a reliable catalog as new content is continuously added.

## Personal Library

Users can maintain their own collection independently from the main catalog.

Library features include:

- Add or remove titles
- Track favorites
- Track watching or reading status
- Record progress
- View completed and in-progress content
- Continue from previously tracked titles

User-specific data is stored separately from the global catalog so catalog ingestion does not overwrite personal library information.

## Tech Stack

- **Frontend:** React + TypeScript
- **Build Tool:** Vite
- **Database:** Supabase / PostgreSQL
- **Authentication:** Supabase Auth
- **Testing:** Playwright
- **Development:** Google AI Studio, GitHub and Vite

## Project Structure

```text
LetMeCheck/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── package.json
└── README.md
```
## Development

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build the application

```bash
npm run build
```

## Development Principles

- Preserve existing user data.
- Keep catalog and user data logically separated.
- Fix underlying data and relationship problems instead of hardcoding results in the UI.
- Keep ingestion safe to run repeatedly.
- Avoid unnecessary database schema changes.
- Validate database relationships after significant catalog changes.
- Keep the application responsive across mobile and desktop.

## Project Status

LetMeCheck is an actively developed project. The current development focus is improving catalog reliability, automated ingestion, metadata classification, database integrity, and the overall user experience.

## License

This project is currently a personal development project.
