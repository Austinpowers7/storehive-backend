# Storehive Backend API

A robust backend API service for the Storehive inventory platform built with Fastify, TypeScript, and Prisma.

## Features

- 🔐 **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (Admin, Owner, Cashier)
  - User registration and login
  - Admin management system

- 🏪 **Store Management**

  - Store creation and management
  - Multi-store support
  - Business profile management

- 📦 **Product Management**

  - Product CRUD operations
  - Inventory management
  - Product categorization

- 💳 **Checkout System**

  - Order processing
  - Payment integration
  - Session-based transactions

- 👥 **User Management**
  - User roles and permissions
  - Profile management
  - Store association

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Database ORM**: Prisma
- **Documentation**: Swagger/OpenAPI
- **Authentication**: JWT
- **API Security**: CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=7500
DATABASE_URL="postgresql://user:password@localhost:5432/storehive"
JWT_SECRET="your-jwt-secret"
INIT_ADMIN_EMAIL="admin@example.com"
INIT_ADMIN_PASSWORD="admin-password"
GEMINI_API_KEY="your-gemini-api-key"
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/storehive-backend.git
   cd storehive-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Bootstrap admin user if admin priviledges is required:

   ```bash
   npx ts-node -r tsconfig-paths/register src/scripts/bootstrap-admin.ts
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:7500/docs
```

## API Endpoints

- **Authentication**

  - POST `/api/auth/register` - Register a new user
  - POST `/api/auth/login` - User login
  - POST `/api/auth/session` - Create cashier session

- **Admin Management**

  - POST `/api/admins` - Create admin user
  - GET `/api/admins` - List admins
  - PUT `/api/admins/:id` - Update admin
  - DELETE `/api/admins/:id` - Delete admin

- **Store Management**

  - POST `/api/stores` - Create store
  - GET `/api/stores` - List stores
  - GET `/api/stores/:id` - Get store details

- **Product Management**

  - POST `/api/products` - Create product
  - GET `/api/products` - List products
  - GET `/api/products/:id` - Get product details

- **User Management**

  - GET `/api/users/:id` - Get user details
  - PUT `/api/users/:id` - Update user profile

- **Checkout**
  - POST `/api/checkout` - Process checkout

## Security

- JWT authentication for protected routes
- CORS enabled for specified origins
- Role-based access control
- Request validation using JSON Schema
- Secure password hashing with bcrypt

## Project Structure

```
src/
├── app.ts              # App configuration
├── server.ts           # Server startup
├── config/             # Configuration files
├── constants/          # Constant definitions
├── controllers/        # Request handlers
├── lib/               # Shared libraries
├── plugins/           # Fastify plugins
├── prisma/            # Database schema and migrations
├── repositories/      # Data access layer
├── routes/            # API routes
├── scripts/           # Utility scripts
├── services/          # Business logic
└── types/             # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Support

For support, email support@storehive.com or create an issue in the repository.
