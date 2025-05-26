# National Parks Voting App

An interactive web application for voting on and ranking US National Parks using the ELO ranking system.

## About the App

This application allows users to:

- Vote between pairs of randomly selected National Parks in a head-to-head competition
- View current park rankings updated in real-time based on voting results
- Track recent voting activity
- Explore a comprehensive list of US National Parks with details and images

The ranking system uses a chess-inspired ELO algorithm, which dynamically adjusts park ratings based on win/loss outcomes and the relative strength (current rating) of each competitor.

## Technology Stack

### Frontend
- **React**: UI component library
- **TypeScript**: Type-safe JavaScript
- **TanStack Query (React Query)**: Data fetching and state management
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library based on Radix UI
- **Wouter**: Lightweight routing library

### Backend
- **Express.js**: Web server framework
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe JavaScript

### Database
- **PostgreSQL**: Relational database for persistent storage
- **Drizzle ORM**: TypeScript-first ORM for database interactions
- **Zod**: Schema validation for type safety

### Algorithms
- **ELO Rating System**: Chess-inspired algorithm for ranking parks based on voting outcomes

### Development Tools
- **Vite**: Fast build tooling
- **tsx**: TypeScript execution environment
- **Replit**: Hosting and development environment

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: UI components
  - `/src/pages`: Page components
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions

- `/server`: Backend Express application
  - `/routes.ts`: API endpoints
  - `/storage.ts`: Data access layer
  - `/db.ts`: Database connection
  - `/elo.ts`: ELO rating system implementation
  - `/parks.ts`: National Parks data

- `/shared`: Code shared between frontend and backend
  - `/schema.ts`: Database schema definitions

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
- Ensure PostgreSQL is running and create a database
- Set the `DATABASE_URL` environment variable to your database connection string
- Run database migrations:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://0.0.0.0:5000`

## License

This project is for educational purposes only. National Parks data and images are from public sources.
