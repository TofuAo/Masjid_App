# MyMasjidApp API Documentation

**Version:** 1.0  
**Date:** January 12, 2025  
**Base URL:** `http://localhost:5000/api` (Development)  
**Base URL:** `https://yourdomain.com/api` (Production)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Student Management Endpoints](#student-management-endpoints)
3. [Teacher Management Endpoints](#teacher-management-endpoints)
4. [Class Management Endpoints](#class-management-endpoints)
5. [Attendance Endpoints](#attendance-endpoints)
6. [Exam Management Endpoints](#exam-management-endpoints)
7. [Results Management Endpoints](#results-management-endpoints)
8. [Fee Management Endpoints](#fee-management-endpoints)
9. [Admin Management Endpoints](#admin-management-endpoints)
10. [Settings Endpoints](#settings-endpoints)
11. [Announcements Endpoints](#announcements-endpoints)
12. [Other Endpoints](#other-endpoints)

---

## Authentication Endpoints

### POST /api/auth/register

**Description:**  
Registers a new student user. Creates a user account with student role. Password is optional for student registration.

**Authentication:**  
Not required

**Request Body:**
```json
{
  "nama": "Ahmad Zulkifli",
  "ic_number": "051003060229",
  "email": "ahmad@example.com",
  "password": "123456",
  "confirmPassword": "123456",
  "telefon": "0123456789",
  "umur": 20
}
```

**Request Body Schema:**
- `nama` (string, required) - User full name (2-100 characters)
- `ic_number` (string, required) - IC number (12 digits, format: XXXXXX-XX-XXXX or without hyphens)
- `email` (string, optional) - Email address (must be valid format if provided)
- `password` (string, optional) - Password (minimum 6 characters if provided)
- `confirmPassword` (string, optional) - Password confirmation (must match password)
- `telefon` (string, optional) - Phone number (1-20 characters)
- `umur` (integer, optional) - Age (1-150)

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "ic": "051003060229",
    "nama": "Ahmad Zulkifli",
    "email": "ahmad@example.com",
    "role": "student"
  }
}
```

**Error Responses:**

**Status Code:** `400 Bad Request`

**Response Body:**
```json
{
  "success": false,
  "message": "Format IC tidak sah. Sila masukkan 12 digit nombor IC.",
  "errors": []
}
```

**Status Code:** `400 Bad Request` (Duplicate IC)

**Response Body:**
```json
{
  "success": false,
  "message": "Nombor IC ini sudah didaftarkan sebagai pelajar. Sila log masuk atau hubungi pentadbir jika anda memerlukan bantuan.",
  "accountStatus": "already_registered"
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Ahmad Zulkifli",
    "ic_number": "051003060229",
    "email": "ahmad@example.com",
    "password": "123456",
    "confirmPassword": "123456",
    "telefon": "0123456789",
    "umur": 20
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/auth/register', {
  nama: 'Ahmad Zulkifli',
  ic_number: '051003060229',
  email: 'ahmad@example.com',
  password: '123456',
  confirmPassword: '123456',
  telefon: '0123456789',
  umur: 20
});
```

**Notes:**
- IC number is normalized (hyphens removed) before storage
- Password is optional for student registration
- Email must be unique if provided
- Rate limiting: 3 registrations per hour per IP address
- Student role is automatically assigned

**Related Endpoints:**
- `POST /api/auth/login` - Log in after registration
- `GET /api/auth/profile` - Get user profile information
- `PUT /api/auth/profile` - Update user profile

---

### POST /api/auth/login

**Description:**  
Authenticates a user with IC number and password. Returns a JWT token and user information upon successful authentication.

**Authentication:**  
Not required

**Request Body:**
```json
{
  "icNumber": "051003060229",
  "password": "123456"
}
```

**Request Body Schema:**
- `icNumber` (string, required) - User IC number (12 digits, with or without hyphens)
- `password` (string, required) - User password

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "ic": "051003060229",
      "nama": "Ahmad Zulkifli",
      "email": "ahmad@example.com",
      "role": "student",
      "roles": ["student"],
      "activeRole": "student"
    }
  }
}
```

**Error Responses:**

**Status Code:** `401 Unauthorized`

**Response Body:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "success": false,
  "message": "Too many authentication attempts from this IP, please try again after 15 minutes."
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "icNumber": "051003060229",
    "password": "123456"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/auth/login', {
  icNumber: '051003060229',
  password: '123456'
});
```

**Notes:**
- Token expires after 24 hours
- Rate limiting: 5 login attempts per 15 minutes per IP address
- Account lockout after 5 failed attempts (30-minute lockout period)
- IC number is normalized before authentication
- Password is hashed using bcrypt (12 rounds)

**Related Endpoints:**
- `POST /api/auth/register` - Register new user account
- `GET /api/auth/profile` - Get authenticated user profile
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/change-password` - Change user password

---

### GET /api/auth/profile

**Description:**  
Retrieves the authenticated user's profile information.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": {
    "ic": "051003060229",
    "nama": "Ahmad Zulkifli",
    "email": "ahmad@example.com",
    "telefon": "0123456789",
    "umur": 20,
    "role": "student",
    "roles": ["student"],
    "activeRole": "student",
    "status": "aktif"
  }
}
```

**Error Responses:**

**Status Code:** `401 Unauthorized`

**Response Body:**
```json
{
  "success": false,
  "message": "Token not provided or invalid"
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Requires valid JWT token
- Returns user information based on authenticated user's IC number

**Related Endpoints:**
- `POST /api/auth/login` - Authenticate to get token
- `PUT /api/auth/profile` - Update user profile information
- `PUT /api/auth/change-password` - Change user password

---

## Student Management Endpoints

### GET /api/students

**Description:**  
Retrieves a list of students with optional filtering and pagination. Teachers can only see students in their assigned classes.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 1000, max: 1000)
- `search` (string, optional) - Search term (searches in name and IC number)
- `kelas_id` (integer, optional) - Filter by class ID

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "ic": "051003060229",
      "nama": "Ahmad Zulkifli",
      "umur": 20,
      "email": "ahmad@example.com",
      "telefon": "0123456789",
      "role": "student",
      "status": "aktif",
      "kelas_id": 1,
      "nama_kelas": "Al-Quran Asas",
      "tarikh_daftar": "2025-01-15"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1000,
    "total": 50,
    "totalPages": 1
  }
}
```

**Error Responses:**

**Status Code:** `401 Unauthorized`

**Response Body:**
```json
{
  "success": false,
  "message": "Token not provided or invalid"
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/students?page=1&limit=50&search=Ahmad" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/students', {
  params: {
    page: 1,
    limit: 50,
    search: 'Ahmad'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Teachers can only see students in their assigned classes
- Admins can see all students
- Search works on name and IC number
- Results are paginated

**Related Endpoints:**
- `GET /api/students/:ic` - Get detailed student information
- `POST /api/students` - Create new student record
- `GET /api/classes` - Get list of classes for student assignment
- `GET /api/attendance?student_ic={ic}` - Get student attendance records

---

### GET /api/students/:ic

**Description:**  
Retrieves detailed information about a specific student by IC number.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `ic` (string, required) - Student IC number (12 digits, with or without hyphens)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": {
    "ic": "051003060229",
    "nama": "Ahmad Zulkifli",
    "umur": 20,
    "email": "ahmad@example.com",
    "telefon": "0123456789",
    "alamat": "Kampung Baru, Kuala Lumpur",
    "role": "student",
    "status": "aktif",
    "kelas_id": 1,
    "nama_kelas": "Al-Quran Asas",
    "tarikh_daftar": "2025-01-15",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

**Status Code:** `404 Not Found`

**Response Body:**
```json
{
  "success": false,
  "message": "Student not found"
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET http://localhost:5000/api/students/051003060229 \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/students/051003060229', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- IC number is normalized before query
- Returns detailed student information including class details
- Teachers can only access students in their classes

**Related Endpoints:**
- `GET /api/students` - Get list of all students
- `PUT /api/students/:ic` - Update student information
- `GET /api/attendance?student_ic={ic}` - Get student attendance history
- `GET /api/results?student_ic={ic}` - Get student exam results
- `GET /api/fees?student_ic={ic}` - Get student fee records

---

### POST /api/students

**Description:**  
Creates a new student record. Only admins can create students.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama": "Ahmad Zulkifli",
  "ic": "051003060229",
  "umur": 20,
  "email": "ahmad@example.com",
  "telefon": "0123456789",
  "alamat": "Kampung Baru, Kuala Lumpur",
  "kelas_id": 1
}
```

**Request Body Schema:**
- `nama` (string, required) - Student name (2-100 characters)
- `ic` (string, required) - IC number (12 digits, format: XXXXXX-XX-XXXX)
- `umur` (integer, optional) - Age (5-100)
- `email` (string, optional) - Email address (valid format)
- `telefon` (string, optional) - Phone number (valid format)
- `alamat` (string, optional) - Address (10-500 characters)
- `kelas_id` (integer, optional) - Class ID

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "ic": "051003060229",
    "nama": "Ahmad Zulkifli",
    "umur": 20,
    "email": "ahmad@example.com",
    "telefon": "0123456789",
    "role": "student",
    "status": "aktif"
  }
}
```

**Error Responses:**

**Status Code:** `400 Bad Request` (Validation Error)

**Response Body:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "nama",
      "message": "Name must be between 2 and 100 characters"
    }
  ]
}
```

**Status Code:** `403 Forbidden`

**Response Body:**
```json
{
  "success": false,
  "message": "Insufficient permissions. Admin role required."
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Ahmad Zulkifli",
    "ic": "051003060229",
    "umur": 20,
    "email": "ahmad@example.com",
    "telefon": "0123456789",
    "alamat": "Kampung Baru, Kuala Lumpur",
    "kelas_id": 1
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/students', {
  nama: 'Ahmad Zulkifli',
  ic: '051003060229',
  umur: 20,
  email: 'ahmad@example.com',
  telefon: '0123456789',
  alamat: 'Kampung Baru, Kuala Lumpur',
  kelas_id: 1
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can create students
- IC number must be unique
- IC number is normalized before storage
- Email must be unique if provided
- Creates user record and student record

**Related Endpoints:**
- `GET /api/students/:ic` - Get created student details
- `GET /api/students` - List all students
- `PUT /api/students/:ic` - Update student information
- `GET /api/classes` - Get available classes for assignment

---

### PUT /api/students/:ic

**Description:**  
Updates an existing student record. Only admins can update students.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `ic` (string, required) - Student IC number (12 digits, with or without hyphens)

**Request Body:**
```json
{
  "nama": "Ahmad Zulkifli Updated",
  "umur": 21,
  "email": "ahmad.updated@example.com",
  "telefon": "0123456789",
  "alamat": "New Address",
  "kelas_id": 2
}
```

**Request Body Schema:**
- `nama` (string, optional) - Student name (2-100 characters)
- `umur` (integer, optional) - Age (5-100)
- `email` (string, optional) - Email address (valid format)
- `telefon` (string, optional) - Phone number (valid format)
- `alamat` (string, optional) - Address (10-500 characters)
- `kelas_id` (integer, optional) - Class ID

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "ic": "051003060229",
    "nama": "Ahmad Zulkifli Updated",
    "umur": 21,
    "email": "ahmad.updated@example.com"
  }
}
```

**Error Responses:**

**Status Code:** `404 Not Found`

**Response Body:**
```json
{
  "success": false,
  "message": "Student not found"
}
```

**Example Request:**

**cURL:**
```bash
curl -X PUT http://localhost:5000/api/students/051003060229 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Ahmad Zulkifli Updated",
    "umur": 21,
    "email": "ahmad.updated@example.com"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.put('/api/students/051003060229', {
  nama: 'Ahmad Zulkifli Updated',
  umur: 21,
  email: 'ahmad.updated@example.com'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can update students
- IC number cannot be changed
- Email must be unique if provided
- Only provided fields are updated

**Related Endpoints:**
- `GET /api/students/:ic` - Get student details before updating
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `DELETE /api/students/:ic` - Delete student record

---

### DELETE /api/students/:ic

**Description:**  
Deletes a student record. Only admins can delete students.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `ic` (string, required) - Student IC number (12 digits, with or without hyphens)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

**Error Responses:**

**Status Code:** `404 Not Found`

**Response Body:**
```json
{
  "success": false,
  "message": "Student not found"
}
```

**Example Request:**

**cURL:**
```bash
curl -X DELETE http://localhost:5000/api/students/051003060229 \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.delete('/api/students/051003060229', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can delete students
- Deletion is cascaded (related records in attendance, results, fees are also deleted)
- IC number is normalized before deletion
- Action is logged for audit purposes

**Related Endpoints:**
- `GET /api/students/:ic` - Get student details before deletion
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/admin-actions` - View admin action history (including deletions)

---

## Teacher Management Endpoints

### GET /api/teachers

**Description:**  
Retrieves a list of teachers with optional filtering and pagination.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `search` (string, optional) - Search term (searches in name and IC number)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "ic": "820503060229",
      "nama": "Ustaz Rahim",
      "umur": 42,
      "email": "rahim@example.com",
      "telefon": "0172233445",
      "role": "teacher",
      "status": "aktif",
      "kepakaran": ["Al-Quran", "Tajwid"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

**Error Responses:**

**Status Code:** `401 Unauthorized`

**Response Body:**
```json
{
  "success": false,
  "message": "Token not provided or invalid"
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/teachers?page=1&limit=50" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/teachers', {
  params: {
    page: 1,
    limit: 50
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Returns list of all teachers
- Search works on name and IC number
- Results are paginated
- Kepakaran (expertise) is returned as JSON array

**Related Endpoints:**
- `GET /api/teachers/:ic` - Get detailed teacher information
- `POST /api/teachers` - Create new teacher record
- `GET /api/classes?guru_ic={ic}` - Get classes assigned to teacher

---

### POST /api/teachers

**Description:**  
Creates a new teacher record. Only admins can create teachers.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama": "Ustaz Rahim",
  "ic": "820503060229",
  "umur": 42,
  "email": "rahim@example.com",
  "telefon": "0172233445",
  "alamat": "Bangi, Selangor",
  "kepakaran": ["Al-Quran", "Tajwid"]
}
```

**Request Body Schema:**
- `nama` (string, required) - Teacher name (2-100 characters)
- `ic` (string, required) - IC number (12 digits)
- `umur` (integer, optional) - Age (5-100)
- `email` (string, optional) - Email address (valid format)
- `telefon` (string, optional) - Phone number (valid format)
- `alamat` (string, optional) - Address (10-500 characters)
- `kepakaran` (array, optional) - Array of expertise/specializations

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "ic": "820503060229",
    "nama": "Ustaz Rahim",
    "role": "teacher",
    "status": "aktif",
    "kepakaran": ["Al-Quran", "Tajwid"]
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/teachers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Ustaz Rahim",
    "ic": "820503060229",
    "umur": 42,
    "email": "rahim@example.com",
    "telefon": "0172233445",
    "kepakaran": ["Al-Quran", "Tajwid"]
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/teachers', {
  nama: 'Ustaz Rahim',
  ic: '820503060229',
  umur: 42,
  email: 'rahim@example.com',
  telefon: '0172233445',
  kepakaran: ['Al-Quran', 'Tajwid']
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can create teachers
- IC number must be unique
- Kepakaran is stored as JSON array
- Creates user record and teacher record

**Related Endpoints:**
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/:ic` - Get created teacher details
- `POST /api/classes` - Assign teacher to class
- `GET /api/classes?guru_ic={ic}` - View teacher's assigned classes

---

## Class Management Endpoints

### GET /api/classes

**Description:**  
Retrieves a list of classes with optional filtering and pagination.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `search` (string, optional) - Search term (searches in class name)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_kelas": "Al-Quran Asas",
      "level": "Asas",
      "jadual": "Isnin & Rabu 5:00AM-6:30AM",
      "sessions": ["Isnin", "Rabu"],
      "yuran": 150.00,
      "guru_ic": "820503060229",
      "guru_nama": "Ustaz Rahim",
      "kapasiti": 20,
      "status": "aktif",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/classes?page=1&limit=50" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/classes', {
  params: {
    page: 1,
    limit: 50
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Sessions is stored as JSON array
- Returns teacher information if assigned
- Results are paginated

**Related Endpoints:**
- `GET /api/classes/:id` - Get detailed class information
- `POST /api/classes` - Create new class
- `GET /api/students?kelas_id={id}` - Get students in class
- `GET /api/attendance?class_id={id}` - Get class attendance records

---

### POST /api/classes

**Description:**  
Creates a new class. Only admins can create classes.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama_kelas": "Al-Quran Asas",
  "level": "Asas",
  "jadual": "Isnin & Rabu 5:00AM-6:30AM",
  "sessions": ["Isnin", "Rabu"],
  "yuran": 150.00,
  "guru_ic": "820503060229",
  "kapasiti": 20,
  "status": "aktif"
}
```

**Request Body Schema:**
- `nama_kelas` (string, required) - Class name (1-100 characters)
- `level` (string, optional) - Class level
- `jadual` (string, optional) - Schedule description
- `sessions` (array, optional) - Array of session days (e.g., ["Isnin", "Rabu"])
- `yuran` (decimal, optional) - Monthly fee amount (default: 0)
- `guru_ic` (string, optional) - Teacher IC number
- `kapasiti` (integer, optional) - Class capacity (default: 20)
- `status` (string, optional) - Class status: "aktif", "tidak_aktif", "penuh" (default: "aktif")

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "id": 1,
    "nama_kelas": "Al-Quran Asas",
    "level": "Asas",
    "yuran": 150.00,
    "kapasiti": 20,
    "status": "aktif"
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_kelas": "Al-Quran Asas",
    "level": "Asas",
    "jadual": "Isnin & Rabu 5:00AM-6:30AM",
    "sessions": ["Isnin", "Rabu"],
    "yuran": 150.00,
    "guru_ic": "820503060229",
    "kapasiti": 20
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/classes', {
  nama_kelas: 'Al-Quran Asas',
  level: 'Asas',
  jadual: 'Isnin & Rabu 5:00AM-6:30AM',
  sessions: ['Isnin', 'Rabu'],
  yuran: 150.00,
  guru_ic: '820503060229',
  kapasiti: 20
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can create classes
- Sessions must be valid JSON array
- Teacher IC must exist if provided
- Yuran (fee) is stored as DECIMAL(10,2)

**Related Endpoints:**
- `GET /api/classes` - List all classes
- `GET /api/classes/:id` - Get created class details
- `GET /api/teachers` - Get available teachers for assignment
- `POST /api/students` - Assign students to class

---

## Attendance Endpoints

### GET /api/attendance

**Description:**  
Retrieves attendance records with optional filtering by student, class, and date range.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `student_ic` (string, optional) - Filter by student IC number
- `class_id` (integer, optional) - Filter by class ID
- `start_date` (date, optional) - Start date (format: YYYY-MM-DD)
- `end_date` (date, optional) - End date (format: YYYY-MM-DD)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_ic": "051003060229",
      "student_nama": "Ahmad Zulkifli",
      "class_id": 1,
      "class_nama": "Al-Quran Asas",
      "tarikh": "2025-01-15",
      "status": "Hadir",
      "catatan": null,
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/attendance?class_id=1&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/attendance', {
  params: {
    class_id: 1,
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Teachers can only see attendance for their classes
- Admins can see all attendance records
- Date filtering is inclusive
- Status values: "Hadir", "Tidak Hadir", "Cuti"

**Related Endpoints:**
- `POST /api/attendance` - Create new attendance record
- `GET /api/attendance/student/:student_ic` - Get student attendance history
- `GET /api/students/:ic` - Get student details
- `GET /api/classes/:id` - Get class information

---

### POST /api/attendance

**Description:**  
Creates a new attendance record. Teachers and admins can create attendance records.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Teacher or Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "student_ic": "051003060229",
  "class_id": 1,
  "tarikh": "2025-01-15",
  "status": "Hadir",
  "catatan": "Hadir tepat pada masanya"
}
```

**Request Body Schema:**
- `student_ic` (string, required) - Student IC number (12 digits)
- `class_id` (integer, required) - Class ID
- `tarikh` (date, required) - Attendance date (format: YYYY-MM-DD)
- `status` (string, required) - Attendance status: "Hadir", "Tidak Hadir", "Cuti"
- `catatan` (string, optional) - Notes/comments

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "data": {
    "id": 1,
    "student_ic": "051003060229",
    "class_id": 1,
    "tarikh": "2025-01-15",
    "status": "Hadir",
    "catatan": "Hadir tepat pada masanya"
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ic": "051003060229",
    "class_id": 1,
    "tarikh": "2025-01-15",
    "status": "Hadir",
    "catatan": "Hadir tepat pada masanya"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/attendance', {
  student_ic: '051003060229',
  class_id: 1,
  tarikh: '2025-01-15',
  status: 'Hadir',
  catatan: 'Hadir tepat pada masanya'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Teachers can only create attendance for their classes
- Admins can create attendance for any class
- Date format must be YYYY-MM-DD
- Duplicate attendance for same student/class/date will update existing record

**Related Endpoints:**
- `GET /api/attendance` - Get attendance records
- `GET /api/students/:ic` - Verify student exists
- `GET /api/classes/:id` - Verify class exists
- `PUT /api/attendance/:id` - Update existing attendance record

---

## Exam Management Endpoints

### GET /api/exams

**Description:**  
Retrieves a list of exams with optional filtering by class.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `class_id` (integer, optional) - Filter by class ID

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "class_id": 1,
      "class_nama": "Al-Quran Asas",
      "subject": "Tilawah Al-Quran",
      "tarikh_exam": "2025-09-15",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/exams?class_id=1" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/exams', {
  params: {
    class_id: 1
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Returns exams with class information
- Results are paginated
- Can filter by class ID

**Related Endpoints:**
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get detailed exam information
- `GET /api/results?exam_id={id}` - Get results for exam
- `GET /api/classes/:id` - Get class information

---

### POST /api/exams

**Description:**  
Creates a new exam. Only admins can create exams.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "class_id": 1,
  "subject": "Tilawah Al-Quran",
  "tarikh_exam": "2025-09-15"
}
```

**Request Body Schema:**
- `class_id` (integer, required) - Class ID
- `subject` (string, required) - Exam subject/title
- `tarikh_exam` (date, required) - Exam date (format: YYYY-MM-DD, ISO 8601)

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "id": 1,
    "class_id": 1,
    "subject": "Tilawah Al-Quran",
    "tarikh_exam": "2025-09-15"
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "subject": "Tilawah Al-Quran",
    "tarikh_exam": "2025-09-15"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/exams', {
  class_id: 1,
  subject: 'Tilawah Al-Quran',
  tarikh_exam: '2025-09-15'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can create exams
- Class ID must exist
- Date format must be ISO 8601 (YYYY-MM-DD)

**Related Endpoints:**
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get created exam details
- `GET /api/classes/:id` - Verify class exists
- `POST /api/results` - Create results for exam

---

## Results Management Endpoints

### GET /api/results

**Description:**  
Retrieves exam results with optional filtering by student, exam, and grade.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `student_ic` (string, optional) - Filter by student IC number
- `exam_id` (integer, optional) - Filter by exam ID
- `gred` (string, optional) - Filter by grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_ic": "051003060229",
      "student_nama": "Ahmad Zulkifli",
      "exam_id": 1,
      "exam_subject": "Tilawah Al-Quran",
      "markah": 88,
      "gred": "A",
      "status": "lulus",
      "slip_img": "uploads/slip_ahmad.png",
      "catatan": "Prestasi cemerlang",
      "created_at": "2025-09-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 50,
    "totalPages": 1
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/results?student_ic=051003060229&exam_id=1" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/results', {
  params: {
    student_ic: '051003060229',
    exam_id: 1
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Students can only see their own results
- Teachers can see results for their classes
- Admins can see all results
- Grade is automatically calculated based on markah (marks) and grade ranges
- Status is automatically determined: "lulus" (pass) or "gagal" (fail)

**Related Endpoints:**
- `POST /api/results` - Create new exam result
- `GET /api/results/:id` - Get detailed result information
- `GET /api/exams/:id` - Get exam details
- `GET /api/students/:ic` - Get student information

---

### POST /api/results

**Description:**  
Creates a new exam result. Teachers and admins can create results.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Teacher or Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "student_ic": "051003060229",
  "exam_id": 1,
  "markah": 88,
  "gred": "A",
  "slip_img": "uploads/slip_ahmad.png",
  "catatan": "Prestasi cemerlang"
}
```

**Request Body Schema:**
- `student_ic` (string, required) - Student IC number (format: XXXXXX-XX-XXXX)
- `exam_id` (integer, required) - Exam ID
- `markah` (integer, required) - Marks (0-100)
- `gred` (string, optional) - Grade: A+, A, A-, B+, B, B-, C+, C, C-, D, F (auto-calculated if not provided)
- `slip_img` (string, optional) - Result slip image path
- `catatan` (string, optional) - Notes/comments
- `status` (string, optional) - Status: "lulus" or "gagal" (auto-determined if not provided)

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Result created successfully",
  "data": {
    "id": 1,
    "student_ic": "051003060229",
    "exam_id": 1,
    "markah": 88,
    "gred": "A",
    "status": "lulus"
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/results \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ic": "051003060229",
    "exam_id": 1,
    "markah": 88,
    "gred": "A",
    "catatan": "Prestasi cemerlang"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/results', {
  student_ic: '051003060229',
  exam_id: 1,
  markah: 88,
  gred: 'A',
  catatan: 'Prestasi cemerlang'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Grade can be auto-calculated based on markah if not provided
- Status is auto-determined: "lulus" (pass) if grade is A+, A, A-, B+, B, B-, C+, C, C- or "gagal" (fail) if grade is D or F
- Teachers can only create results for exams in their classes
- Admins can create results for any exam

**Related Endpoints:**
- `GET /api/results` - List all results
- `GET /api/results/:id` - Get created result details
- `GET /api/exams/:id` - Verify exam exists
- `GET /api/students/:ic` - Verify student exists
- `GET /api/settings/grade-ranges` - Get grade range configuration

---

## Fee Management Endpoints

### GET /api/fees

**Description:**  
Retrieves fee records with optional filtering by student, status, month, and year.

**Authentication:**  
Required (Bearer token)

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number for pagination (default: 1)
- `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)
- `student_ic` (string, optional) - Filter by student IC number
- `status` (string, optional) - Filter by status: "Bayar", "Belum Bayar", "terbayar", "tunggak", "pending"
- `bulan` (string, optional) - Filter by month (e.g., "Januari", "Februari")
- `tahun` (integer, optional) - Filter by year

**Success Response:**

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_ic": "051003060229",
      "student_nama": "Ahmad Zulkifli",
      "jumlah": 150.00,
      "status": "terbayar",
      "tarikh": "2025-02-01",
      "tarikh_bayar": "2025-02-01",
      "bulan": "Februari",
      "tahun": 2025,
      "cara_bayar": "Tunai",
      "no_resit": "R001",
      "resit_img": "uploads/resit_ahmad.png",
      "created_at": "2025-02-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/fees?student_ic=051003060229&status=tunggak" \
  -H "Authorization: Bearer {token}"
```

**JavaScript (Axios):**
```javascript
const response = await axios.get('/api/fees', {
  params: {
    student_ic: '051003060229',
    status: 'tunggak'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Students can only see their own fees
- Admins and PIC users can see all fees
- Status values: "Bayar", "Belum Bayar", "terbayar", "tunggak", "pending"
- Results are paginated

**Related Endpoints:**
- `POST /api/fees` - Create new fee record
- `GET /api/fees/:id` - Get detailed fee information
- `PUT /api/fees/:id/mark-paid` - Mark fee as paid
- `GET /api/students/:ic` - Get student information

---

### POST /api/fees

**Description:**  
Creates a new fee record. Only admins can create fees.

**Authentication:**  
Required (Bearer token)

**Authorization:**  
Admin role required

**Required Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "student_ic": "051003060229",
  "jumlah": 150.00,
  "tarikh": "2025-02-01",
  "bulan": "Februari",
  "tahun": 2025,
  "status": "Belum Bayar"
}
```

**Request Body Schema:**
- `student_ic` (string, required) - Student IC number (12 digits)
- `jumlah` (decimal, required) - Fee amount
- `tarikh` (date, required) - Fee date (format: YYYY-MM-DD)
- `bulan` (string, optional) - Month name (e.g., "Januari", "Februari")
- `tahun` (integer, optional) - Year
- `status` (string, optional) - Fee status: "Bayar", "Belum Bayar", "terbayar", "tunggak", "pending" (default: "Belum Bayar")

**Success Response:**

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Fee created successfully",
  "data": {
    "id": 1,
    "student_ic": "051003060229",
    "jumlah": 150.00,
    "status": "Belum Bayar",
    "tarikh": "2025-02-01",
    "bulan": "Februari",
    "tahun": 2025
  }
}
```

**Example Request:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/fees \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ic": "051003060229",
    "jumlah": 150.00,
    "tarikh": "2025-02-01",
    "bulan": "Februari",
    "tahun": 2025,
    "status": "Belum Bayar"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/fees', {
  student_ic: '051003060229',
  jumlah: 150.00,
  tarikh: '2025-02-01',
  bulan: 'Februari',
  tahun: 2025,
  status: 'Belum Bayar'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notes:**
- Only admins can create fees
- Jumlah (amount) is stored as DECIMAL(10,2)
- Status defaults to "Belum Bayar" if not provided
- Fee can be marked as paid later with payment details

**Related Endpoints:**
- `GET /api/fees` - List all fees
- `GET /api/fees/:id` - Get created fee details
- `PUT /api/fees/:id/mark-paid` - Mark fee as paid
- `GET /api/students/:ic` - Verify student exists
- `POST /api/fees/generate-monthly` - Generate monthly fees for all students

---

## General Notes

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

Tokens are obtained via the `/api/auth/login` endpoint and expire after 24 hours.

### Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Registration endpoints**: 3 requests per hour per IP
- **General API endpoints**: 1000 requests per 15 minutes per IP

### Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field-name",
      "message": "Field-specific error message"
    }
  ]
}
```

### Pagination

Paginated responses include a `pagination` object:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Date Formats

All dates should be in ISO 8601 format: `YYYY-MM-DD` (e.g., `2025-01-15`)

### IC Number Format

IC numbers should be 12 digits. They can be provided with or without hyphens:
- With hyphens: `051003-06-0229`
- Without hyphens: `051003060229`

The system normalizes IC numbers (removes hyphens) before storage and queries.

### Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2025  
**Maintained By:** MyMasjidApp Development Team