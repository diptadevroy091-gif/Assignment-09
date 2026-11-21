# Equipora - Equipment Rental Platform

## Project Overview

Equipora is a modern equipment rental platform that connects equipment owners with customers who need equipment for their projects. Customers can explore equipment, make rental bookings, manage favorites, and complete online payments.

The platform supports three user roles: Customer, Owner, and Admin. Each role has dedicated dashboard features and permissions.

## Project Purpose

The purpose of Equipora is to make equipment renting simple, accessible, and convenient. It helps customers rent equipment without purchasing it and allows owners to earn money by renting out their equipment.

## Live Website

- **Live URL:** https://assignment-09-wheat.vercel.app/
- **GitHub Repository:** https://github.com/diptadevroy091-gif/Assignment-09
- **Frontend Repository Folder:** https://github.com/diptadevroy091-gif/Assignment-09/tree/main/client
- **Backend Repository Folder:** https://github.com/diptadevroy091-gif/Assignment-09/tree/main/server

## Key Features

- Email and password authentication.
- Google OAuth authentication.
- GitHub OAuth authentication.
- Role-based access control for Customer, Owner, and Admin.
- Browse and search approved equipment.
- Filter and sort equipment by category, rental type, price, and availability.
- View detailed equipment information.
- Add and remove favorite equipment.
- Book equipment with rental dates and quantity.
- Stripe payment integration.
- Customer dashboard for rentals and favorites.
- Owner dashboard to add, update, and manage equipment.
- Admin dashboard to manage users and equipment approvals.
- User profile management.
- Responsive design for desktop, tablet, and mobile.
- Dark and light theme support.
- Toast notifications for user actions.

## User Roles

### Customer
- Browse available equipment.
- Search and filter equipment.
- Add equipment to favorites.
- Book equipment and make payments.
- View rental history.
- Manage profile information.

### Owner
- Add new equipment.
- Manage listed equipment.
- Update and delete equipment.
- Manage equipment rental information.
- Monitor rental activities.

### Admin
- Manage registered users.
- Change user roles.
- Approve or reject equipment listings.
- Manage equipment records.
- Monitor platform activities.

## Technologies Used

### Frontend
- Next.js 16
- React 19
- Tailwind CSS 4
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- Passport.js

### Authentication and Payment
- Google OAuth 2.0
- GitHub OAuth 2.0
- Stripe

## NPM Packages

### Client Dependencies
- next
- react
- react-dom

### Client Development Dependencies
- @tailwindcss/turbopack
- eslint
- eslint-config-next
- tailwindcss

### Server Dependencies
- bcryptjs
- cors
- dotenv
- express
- express-session
- jsonwebtoken
- mongoose
- passport
- passport-github2
- passport-google-oauth20
- stripe

### Server Development Dependencies
- nodemon

## Project Structure

```text
Assignment-09/
├── client/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── package.json
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- MongoDB database
- Stripe account for test payments
- Google OAuth credentials (if using Google login)
- GitHub OAuth credentials (if using GitHub login)

### 1. Clone the Repository

```bash
git clone https://github.com/diptadevroy091-gif/Assignment-09.git
cd Assignment-09
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure the required environment variables for MongoDB, JWT, OAuth, Stripe, and frontend URL.

Never commit your `.env` file or expose secret keys.

Start the backend development server:

```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal from the project root:

```bash
cd client
npm install
```

Create a `.env.local` file inside the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

### 4. Open the Application

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5000
```

## Deployment

- **Frontend:** Deployed on Vercel.
- **Backend:** Deployed on Render.
- **Database:** MongoDB.

## Security Notes

- Never commit `.env` or `.env.local` files.
- Keep database credentials and API keys private.
- Use environment variables for sensitive configuration.
- Protected routes require authentication and appropriate user roles.

## Author

**Dipta Dev Roy**

Equipora - Equipment Rental Platform

© 2026 Equipora. All rights reserved.