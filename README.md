# Hospital Management System Backend

A comprehensive hospital management system backend built with Node.js, Express, MongoDB, and Mongoose. The system facilitates appointment scheduling between patients and doctors, manages user profiles, and handles doctor availability.

## Features

### User Management

- Role-based authentication system (Patient, Doctor, Admin)
- JWT-based authentication
- User registration and login
- Profile management for patients and doctors
- Admin dashboard for user management

### Doctor Management

- Doctor profile management
- Specialty and location tracking
- Availability slot management
- Calendar-based scheduling system
- Double-booking prevention

### Appointment System

- Appointment scheduling
- Slot availability checking
- Appointment rescheduling and cancellation
- Appointment history tracking
- Appointment status management

### Admin Features

- User approval system
- System monitoring
- Role management
- Access control

## Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **API Documentation**: Coming soon

## Project Structure

```
src/
├── @types/              # TypeScript type definitions
├── app/
│   ├── config/         # Application configuration
│   ├── constants/      # Constants and enums
│   ├── cronjobs/       # Scheduled tasks
│   ├── errors/         # Custom error classes
│   ├── middlewares/    # Express middlewares
│   ├── modules/        # Feature modules (auth, user, patient)
│   ├── routes/         # API routes
│   └── shared/         # Shared utilities
├── defaults/           # Default data for seeding
└── uploads/            # File upload directory
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/hospital-management-backend.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

Coming soon...

## Authentication

The system uses JWT (JSON Web Tokens) for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run seed`: Seed the database with initial data
- `npm test`: Run tests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
