# Store Rating System - Full Stack Application

A web application that allows users to submit ratings for stores registered on the platform.

## Tech Stack

- **Backend**: Express.js
- **Database**: PostgreSQL
- **Frontend**: React.js

## Features

### User Roles
1. **System Administrator** - Full system access
2. **Normal User** - Can rate stores
3. **Store Owner** - Can view ratings for their store

### Functionalities

#### System Administrator
- Add new stores, users, and admin users
- Dashboard with statistics
- View and manage stores and users
- Filter and sort listings

#### Normal User
- Sign up and login
- View all stores
- Submit and modify ratings (1-5)
- Search stores
- Update password

#### Store Owner
- View ratings for their store
- See average rating
- Update password

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your PostgreSQL credentials and JWT secret.

5. Create the database:
```bash
createdb store_rating_db
```

6. Run the database migration (the server will create tables on startup):
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Default Admin Account

After running the database setup, you can create an admin account through the registration endpoint or directly in the database. The first admin should be created manually or through the API.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### System Administrator
- `GET /api/admin/dashboard` - Get dashboard statistics
- `POST /api/admin/stores` - Add new store
- `GET /api/admin/stores` - Get all stores with filters
- `GET /api/admin/users` - Get all users with filters
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Add new user

### Normal User
- `GET /api/user/stores` - Get all stores
- `GET /api/user/stores/:id` - Get store details
- `POST /api/user/ratings` - Submit rating
- `PUT /api/user/ratings/:id` - Update rating
- `PUT /api/user/password` - Update password

### Store Owner
- `GET /api/store-owner/dashboard` - Get store dashboard
- `PUT /api/store-owner/password` - Update password

## Form Validations

- **Name**: 20-60 characters
- **Address**: Max 400 characters
- **Password**: 8-16 characters, must include uppercase and special character
- **Email**: Standard email validation