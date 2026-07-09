# Edunura Events Manager — API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Authentication:** API Key via `x-api-key` header

---

## Quick Start

### Get an API Key

1. Login to the admin panel
2. Go to **Settings → API**
3. Click **Create API Key**
4. Copy the key (shown once)

### Make a Request

```bash
curl -H "x-api-key: YOUR_API_KEY" https://your-domain.com/api/v1/events
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 50, "total": 100, "totalPages": 2 }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Name is required" }
}
```

---

## Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number (default: 1) | `?page=2` |
| `limit` | Items per page (default: 50, max: 100) | `?limit=25` |
| `q` | Search query | `?q=john` |
| `status` | Filter by status | `?status=LIVE` |
| `role` | Filter by role | `?role=VOLUNTEER` |
| `eventId` | Filter by event ID | `?eventId=uuid` |

---

## Endpoints

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | List events |
| `POST` | `/events` | Create event |
| `GET` | `/events/:id` | Get event details |
| `PUT` | `/events/:id` | Update event |
| `DELETE` | `/events/:id` | Delete event |

#### List Events

```
GET /api/v1/events?page=1&limit=50&status=LIVE&q=fest
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "E-ABC123",
      "name": "Science Fest 2026",
      "status": "LIVE",
      "date": "2026-07-15T10:00:00Z",
      "community": { "name": "Greenfield", "location": "Bangalore" },
      "_count": { "registrations": 45, "stalls": 5 }
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 10, "totalPages": 1 }
}
```

#### Create Event

```
POST /api/v1/events
Content-Type: application/json

{
  "name": "Science Fest 2026",
  "communityId": "uuid",
  "date": "2026-07-15T10:00:00Z",
  "description": "Annual science festival"
}
```

**Required:** `name`, `communityId`, `date`  
**Optional:** `code`, `endDate`, `status`, `description`, `isPublicRegistrationEnabled`

#### Get Event

```
GET /api/v1/events/:id
```

Returns event with community, stalls, assignments, and registration count.

#### Update Event

```
PUT /api/v1/events/:id
Content-Type: application/json

{ "name": "Updated Name", "status": "LIVE" }
```

All fields optional.

#### Delete Event

```
DELETE /api/v1/events/:id
```

Fails if registrations exist.

---

### Communities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/communities` | List communities |
| `POST` | `/communities` | Create community |
| `GET` | `/communities/:id` | Get community |
| `PUT` | `/communities/:id` | Update community |
| `DELETE` | `/communities/:id` | Delete community |

#### Create Community

```json
{
  "code": "GRFIELD",
  "name": "Greenfield Apartments",
  "location": "Bangalore",
  "contactPerson": "John Doe",
  "zone": "South",
  "contactEmail": "john@email.com",
  "contactPhone": "+919876543210"
}
```

**Required:** `code`, `name`, `location`, `contactPerson`

---

### Stalls

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stalls` | List stalls |
| `POST` | `/stalls` | Create stall |
| `GET` | `/stalls/:id` | Get stall |
| `PUT` | `/stalls/:id` | Update stall |
| `DELETE` | `/stalls/:id` | Delete stall |

#### Create Stall

```json
{
  "name": "Maths Mania",
  "metrics": ["Accuracy", "Problem solving", "Speed"],
  "maxVolunteers": 5
}
```

**Required:** `name`

---

### Volunteers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/volunteers` | List volunteers |
| `POST` | `/volunteers` | Create volunteer |
| `GET` | `/volunteers/:id` | Get volunteer |
| `PUT` | `/volunteers/:id` | Update volunteer |
| `DELETE` | `/volunteers/:id` | Delete volunteer |

#### Create Volunteer

```json
{
  "name": "Jane Smith",
  "email": "jane@email.com",
  "password": "SecurePass123!",
  "phoneNumber": "+919876543210",
  "role": "VOLUNTEER"
}
```

**Required:** `name`, `email`, `password`  
**Roles:** `VOLUNTEER`, `LEAD_EVALUATOR`, `COORDINATOR`

---

### Users (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List users |
| `POST` | `/users` | Create user |
| `GET` | `/users/:id` | Get user |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |

#### Create User

```json
{
  "name": "Admin User",
  "email": "admin@company.com",
  "password": "SecurePass123!",
  "role": "ADMIN"
}
```

**Roles:** `ADMIN`, `MANAGER`

---

### Registrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/registrations` | List registrations |
| `POST` | `/registrations` | Create registration |
| `GET` | `/registrations/:id` | Get registration |
| `PUT` | `/registrations/:id` | Update registration |
| `DELETE` | `/registrations/:id` | Delete registration |

#### Create Registration

**Option 1: With existing student**
```json
{
  "eventId": "uuid",
  "studentId": "uuid"
}
```

**Option 2: With new student**
```json
{
  "eventId": "uuid",
  "name": "Rahul Kumar",
  "grade": "5",
  "age": 10,
  "phoneNumber": "+919876543210",
  "parentName": "Parent Name",
  "email": "parent@email.com"
}
```

**Required:** `eventId` + (`studentId` OR `name` + `grade` + `phoneNumber` + `parentName`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "registrationCode": "REG-ABC123",
    "qrToken": "A3F7B2D1",
    "status": "REGISTERED",
    "student": {
      "rollNumber": "EDU-GF-0001",
      "name": "Rahul Kumar",
      "grade": "5"
    },
    "event": {
      "name": "Science Fest 2026"
    }
  }
}
```

#### Update Registration

```json
{ "status": "COMPLETED", "notes": "Attended all stalls" }
```

**Statuses:** `REGISTERED`, `IN_PROGRESS`, `COMPLETED`

---

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/students` | List students |
| `GET` | `/students/:id` | Get student with registrations |
| `PUT` | `/students/:id` | Update student |

---

### Stall Visits

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stall-visits` | List stall visits |
| `POST` | `/stall-visits` | Create stall visit |
| `GET` | `/stall-visits/:id` | Get stall visit |

#### Create Stall Visit

```json
{
  "registrationId": "uuid",
  "stallId": "uuid",
  "studentId": "uuid"
}
```

---

### Performances

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/performances` | List performances |
| `POST` | `/performances` | Create performance |
| `GET` | `/performances/:id` | Get performance |

#### Create Performance

```json
{
  "stallVisitId": "uuid",
  "volunteerId": "uuid",
  "score": 8.5,
  "grade": "A",
  "remarks": "Excellent participation",
  "creativity": 4,
  "problemSolving": 5,
  "communication": 4,
  "learningAbility": 5,
  "metricScores": {
    "Accuracy": 9,
    "Speed": 8,
    "Problem solving": 7
  }
}
```

**Required:** `stallVisitId`, `volunteerId`, `score`, `grade`

---

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/overview` | Overview stats, visit trends, performance by grade |
| `GET` | `/analytics/communities` | Per-community stats |
| `GET` | `/analytics/stalls` | Per-stall stats |
| `GET` | `/analytics/volunteers` | Per-volunteer stats |

#### Overview Response

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalVisits": 150,
      "avgCompletion": 75.5,
      "activeStalls": 5,
      "communities": 3
    },
    "visitTrends": [
      { "time": "07-15", "visits": 45 },
      { "time": "07-16", "visits": 60 }
    ],
    "performanceByGrade": [
      {
        "grade": "5",
        "creativity": 4.2,
        "problemSolving": 3.8,
        "communication": 4.5,
        "learningAbility": 4.0
      }
    ]
  }
}
```

---

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api-keys` | List API keys (masked) |
| `POST` | `/api-keys` | Generate new API key |
| `DELETE` | `/api-keys/:id` | Revoke API key |

#### Generate API Key

```json
{ "name": "Landing Page Integration" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "a1b2c3d4e5f6...",
    "name": "Landing Page Integration",
    "message": "Save this key — it will not be shown again"
  }
}
```

---

## WhatsApp API

### Send Registration QR

```
POST /api/v1/whatsapp/send-registration
Content-Type: application/json

{ "registrationId": "uuid" }
```

Sends QR code image to parent's WhatsApp number.

### Send Report Card

```
POST /api/v1/whatsapp/send-report
Content-Type: application/json

{ "registrationId": "uuid" }
```

Sends report card summary to parent's WhatsApp number.

### Send ID Card

```
POST /api/v1/whatsapp/send-id-card
Content-Type: application/json

{ "registrationId": "uuid" }
```

Sends ID card to parent's WhatsApp number.

### Send All Reports (Batch)

```
POST /api/v1/whatsapp/send-all-reports
Content-Type: application/json

{ "eventId": "uuid" }
```

Sends report cards to all registrations for an event.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Duplicate resource |
| `ALREADY_REGISTERED` | 409 | Student already registered for event |
| `ALREADY_EXISTS` | 409 | Stall visit or performance already recorded |
| `EVENT_CANCELLED` | 410 | Event has been cancelled |
| `EVENT_COMPLETED` | 410 | Event registrations are closed |
| `ROLL_NUMBER_EXHAUSTED` | 409 | Could not generate unique roll number |

---

## Rate Limiting

- **API Key endpoints:** 100 requests per hour per IP
- **Registration endpoints:** 10 requests per hour per IP

---

## Swagger UI

Interactive API documentation available at:

```
/api/v1/docs/ui
```

Enter your API key in the header input to test endpoints directly.
