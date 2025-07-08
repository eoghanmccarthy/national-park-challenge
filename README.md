# National Parks Voting App

An interactive web application for voting on and ranking US National Parks using the ELO ranking system.

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
