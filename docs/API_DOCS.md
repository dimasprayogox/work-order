# API Documentation

## Base URL
`http://localhost:YOUR_PORT/api`

## Authentication Routes

### POST /auth/login
- **Description**: Login user.
- **Request Body**: 
  - `username`: string
  - `password`: string
- **Response**: 
  - 200 OK: Returns user data and token.
  - 401 Unauthorized: Invalid credentials.

### POST /auth/register
- **Description**: Register a new user.
- **Request Body**: 
  - `username`: string
  - `password`: string
- **Response**: 
  - 201 Created: Returns the created user data.
  - 400 Bad Request: Validation errors.

## User Details Routes

### GET /user-detail
- **Description**: Get user details.
- **Response**: 
  - 200 OK: Returns user details.

## Admin Routes

### GET /admin/users
- **Description**: Get all users.
- **Response**: 
  - 200 OK: Returns an array of users.

### POST /admin/users
- **Description**: Create a new user.
- **Request Body**: 
  - `username`: string
  - `password`: string
- **Response**: 
  - 201 Created: Returns the created user data.

### GET /admin/machine-categories
- **Description**: Get all machine categories.
- **Response**: 
  - 200 OK: Returns an array of machine categories.

### POST /admin/machines
- **Description**: Create a new machine.
- **Request Body**: 
  - `name`: string
  - `category`: string
- **Response**: 
  - 201 Created: Returns the created machine data.

## Employee Routes

### GET /employee/dashboard
- **Description**: Get employee dashboard data.
- **Response**: 
  - 200 OK: Returns dashboard data.

### GET /employee/issues
- **Description**: Get all issues reported by employees.
- **Response**: 
  - 200 OK: Returns an array of issues.

### GET /employee/machines
- **Description**: Get all machines assigned to the employee.
- **Response**: 
  - 200 OK: Returns an array of machines.

### POST /employee/work-orders
- **Description**: Create a new work order.
- **Request Body**: 
  - `description`: string
  - `machineId`: string
- **Response**: 
  - 201 Created: Returns the created work order data.

## Technician Routes

### GET /technician/dashboard
- **Description**: Get technician dashboard data.
- **Response**: 
  - 200 OK: Returns dashboard data.

### GET /technician/work-orders
- **Description**: Get all work orders assigned to the technician.
- **Response**: 
  - 200 OK: Returns an array of work orders.

### POST /technician/part-request
- **Description**: Request parts for a work order.
- **Request Body**: 
  - `workOrderId`: string
  - `partId`: string
- **Response**: 
  - 201 Created: Returns the created part request data.

## Logistics Routes

### GET /logistics/dashboard
- **Description**: Get logistics dashboard data.
- **Response**: 
  - 200 OK: Returns dashboard data.

### GET /logistics/parts
- **Description**: Get all parts available.
- **Response**: 
  - 200 OK: Returns an array of parts.

### POST /logistics/part-requests
- **Description**: Create a new part request.
- **Request Body**: 
  - `partId`: string
  - `quantity`: number
- **Response**: 
  - 201 Created: Returns the created part request data.

### GET /logistics/part-usage
- **Description**: Get part usage statistics.
- **Response**: 
  - 200 OK: Returns part usage data.

## Manager Routes

### GET /manager/dashboard
- **Description**: Get manager dashboard data.
- **Response**: 
  - 200 OK: Returns dashboard data.

### GET /manager/work-orders
- **Description**: Get all work orders.
- **Response**: 
  - 200 OK: Returns an array of work orders.

### GET /manager/schedules
- **Description**: Get all schedules.
- **Response**: 
  - 200 OK: Returns an array of schedules.