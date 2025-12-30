# Cloth Backend API

A RESTful API for managing an e-commerce clothing store backend built with Node.js, Express, and MongoDB.

## Table of Contents

- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Products](#products)
  - [Users](#users)
  - [Inventory](#inventory)
  - [Cart](#cart)
  - [Orders](#orders)
- [Error Handling](#error-handling)
- [Response Format](#response-format)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see [Environment Variables](#environment-variables))

3. Start the server:
```bash
node server.js
```

The server will run on `http://localhost:3000` (or the port specified in `PORT` environment variable).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=app-name
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained by registering or logging in through the `/api/users/register` or `/api/users/login` endpoints.

**Note:** Admin-only endpoints require the user's role to be `admin`.

## API Endpoints

Base URL: `http://localhost:8080/api`

### Products

#### Get All Products
- **GET** `/products`
- **Access:** Public
- **Query Parameters:**
  - `category` (string, optional) - Filter by category
  - `search` (string, optional) - Search in name and description
  - `minPrice` (number, optional) - Minimum price filter
  - `maxPrice` (number, optional) - Maximum price filter
  - `page` (number, optional) - Page number (default: 1)
  - `limit` (number, optional) - Items per page (default: 10)
- **Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### Get Product by ID
- **GET** `/products/:id`
- **Access:** Public
- **Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Product Name",
    "description": "...",
    "price": 99.99,
    "image": ["url1", "url2"],
    "category": "Men",
    "subCategory": "Shirts",
    "size": ["S", "M", "L"],
    "color": ["Red", "Blue"],
    "material": ["Cotton"],
    "style": ["Casual"],
    "occasion": ["Daily"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Create Product
- **POST** `/products`
- **Access:** Admin only
- **Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "image": ["url1", "url2"],
  "category": "Men",
  "subCategory": "Shirts",
  "size": ["S", "M", "L"],
  "color": ["Red", "Blue"],
  "material": ["Cotton"],
  "style": ["Casual"],
  "occasion": ["Daily"]
}
```

#### Update Product
- **PUT** `/products/:id`
- **Access:** Admin only
- **Request Body:** Same as Create Product (all fields optional)

#### Delete Product
- **DELETE** `/products/:id`
- **Access:** Admin only

---

### Users

#### Register User
- **POST** `/users/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": 1234567890,
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "role": "user"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    },
    "token": "jwt-token-here"
  }
}
```

#### Login
- **POST** `/users/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:** Same as Register (returns user and token)

#### Get Profile
- **GET** `/users/profile`
- **Access:** Authenticated

#### Update Profile
- **PUT** `/users/profile`
- **Access:** Authenticated
- **Request Body:** (all fields optional)
```json
{
  "name": "John Doe",
  "phone": 1234567890,
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "password": "newpassword"
}
```

#### Get All Users
- **GET** `/users`
- **Access:** Admin only
- **Query Parameters:**
  - `page` (number, optional)
  - `limit` (number, optional)

#### Get User by ID
- **GET** `/users/:id`
- **Access:** Admin only

#### Update User
- **PUT** `/users/:id`
- **Access:** Admin only
- **Request Body:** Same as Update Profile (includes email, role, etc.)

#### Delete User
- **DELETE** `/users/:id`
- **Access:** Admin only

---

### Inventory

#### Get Inventory by Product ID
- **GET** `/inventory/product/:productId`
- **Access:** Public
- **Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "productId": {...},
    "quantity": 100,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get All Inventory
- **GET** `/inventory`
- **Access:** Admin only
- **Query Parameters:**
  - `page` (number, optional)
  - `limit` (number, optional)

#### Create Inventory Entry
- **POST** `/inventory`
- **Access:** Admin only
- **Request Body:**
```json
{
  "productId": "product-id-here",
  "quantity": 100
}
```

#### Update Inventory
- **PUT** `/inventory/:id`
- **Access:** Admin only
- **Request Body:**
```json
{
  "productId": "product-id-here",
  "quantity": 150
}
```

#### Update Inventory Quantity
- **PATCH** `/inventory/product/:productId`
- **Access:** Admin only
- **Request Body:**
```json
{
  "quantity": 150
}
```

---

### Cart

**All cart endpoints require authentication.**

#### Get Cart
- **GET** `/cart`
- **Access:** Authenticated
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "user-id",
      "productId": {...},
      "quantity": 2,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Add to Cart
- **POST** `/cart`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "productId": "product-id-here",
  "quantity": 2
}
```
- **Note:** If item already exists in cart, quantity is added to existing quantity

#### Update Cart Item
- **PUT** `/cart/:itemId`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove from Cart
- **DELETE** `/cart/:itemId`
- **Access:** Authenticated

#### Clear Cart
- **DELETE** `/cart`
- **Access:** Authenticated
- **Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cart cleared successfully",
    "deletedCount": 5
  }
}
```

---

### Orders

**All order endpoints require authentication.**

#### Get User Orders
- **GET** `/orders`
- **Access:** Authenticated
- **Query Parameters:**
  - `page` (number, optional)
  - `limit` (number, optional)
- **Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "...",
        "userId": "user-id",
        "productId": {...},
        "quantity": 2,
        "totalPrice": 199.98,
        "status": "pending",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

#### Get Order by ID
- **GET** `/orders/:id`
- **Access:** Authenticated (own orders) or Admin

#### Create Order
- **POST** `/orders`
- **Access:** Authenticated
- **Description:** Creates orders from all items in the user's cart. Automatically:
  - Checks inventory availability
  - Deducts quantities from inventory
  - Clears the cart after successful order creation
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "user-id",
      "productId": {...},
      "quantity": 2,
      "totalPrice": 199.98,
      "status": "pending",
      ...
    }
  ]
}
```

#### Update Order Status
- **PATCH** `/orders/:id/status`
- **Access:** Admin only
- **Request Body:**
```json
{
  "status": "shipped"
}
```
- **Valid Status Values:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

#### Get All Orders (Admin)
- **GET** `/orders/admin`
- **Access:** Admin only
- **Query Parameters:**
  - `page` (number, optional)
  - `limit` (number, optional)
  - `status` (string, optional) - Filter by status
  - `userId` (string, optional) - Filter by user ID

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here"
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Admin access required)
- `404` - Not Found
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Additional Endpoints

### Health Check
- **GET** `/health`
- **Access:** Public
- **Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Notes

- All timestamps are in ISO 8601 format
- Pagination defaults: page = 1, limit = 10
- All prices are in the base currency unit (e.g., dollars, rupees)
- Password fields are never returned in API responses
- JWT tokens expire after 7 days
- Rate limiting is applied to all endpoints (default: 100 requests per 15 minutes per IP)

