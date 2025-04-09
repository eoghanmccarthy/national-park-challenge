# National Parks Voting App

An interactive web application for voting on and ranking US National Parks using the ELO ranking system.

![National Parks Voting App](attached_assets/Screenshot%202025-04-09%20at%2017.00.35_1744185691579.png)

## About the App

This application allows users to:

- Vote between pairs of randomly selected National Parks in a head-to-head competition
- View current park rankings updated in real-time based on voting results
- Track recent voting activity
- Explore a comprehensive list of US National Parks with details and images

The ranking system uses a chess-inspired ELO algorithm, which dynamically adjusts park ratings based on win/loss outcomes and the relative strength (current rating) of each competitor.

## Key Features

- **Head-to-Head Voting**: Simple interface for choosing between two parks at a time
- **Real-time Rankings**: See how parks move up and down in the rankings after each vote
- **Park Details**: View information about each park including location, establishment date, and description
- **Persistent Rankings**: Database-backed storage ensures rankings persist between sessions
- **Visual Park Categories**: Color-coded by park type (forest, mountain, canyon, etc.)

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

## Data Sources

The application uses data about US National Parks from authoritative sources, including:
- Park names, locations, and establishment dates
- Park descriptions and types
- Park images from Wikipedia and other public domain sources

## Getting Started

1. The application is already running at the provided URL
2. Vote between the two parks presented by clicking "Choose This Park"
3. View current rankings and recent votes on the main page
4. Enjoy exploring America's beautiful National Parks!

## How the ELO Rating System Works

The ELO rating system works by:
1. Each park starts with a base rating (1500)
2. When parks compete, the winning park gains points and the losing park loses points
3. The amount of points transferred depends on the expected outcome:
   - If a highly-rated park beats a lower-rated park (expected outcome), few points are transferred
   - If a lower-rated park beats a higher-rated park (unexpected outcome), many points are transferred
4. Over time, this creates a statistically significant ranking of parks based on user preferences

## License

This project is for educational purposes only. National Parks data and images are from public sources.