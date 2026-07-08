import { NextResponse } from 'next/server'

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Edunura Events Manager API',
      description: 'REST API for managing educational events, communities, stalls, volunteers, registrations, and more. All endpoints require API key authentication via the x-api-key header.',
      version: '1.0.0',
      contact: { name: 'Edunura', url: 'https://edunura.com' },
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Name is required' },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 50 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 2 },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'E-M1ABC-XYZ' },
            name: { type: 'string', example: 'Science Fest 2026' },
            communityId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'] },
            description: { type: 'string', nullable: true },
            isPublicRegistrationEnabled: { type: 'boolean' },
          },
        },
        Community: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'GRFIELD' },
            name: { type: 'string', example: 'Greenfield Apartments' },
            location: { type: 'string', example: 'Bangalore' },
            status: { type: 'string', enum: ['ACTIVE', 'UPCOMING', 'INACTIVE'] },
            contactPerson: { type: 'string' },
          },
        },
        Stall: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'ST-MATHS' },
            name: { type: 'string', example: 'Maths Mania' },
            status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
            metrics: { type: 'array', items: { type: 'string' } },
          },
        },
        Volunteer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
            status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'ON_LEAVE'] },
          },
        },
        Registration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            registrationCode: { type: 'string', example: 'REG-M1ABC-XYZ' },
            qrToken: { type: 'string', example: 'A3F7B2D1' },
            status: { type: 'string', enum: ['REGISTERED', 'IN_PROGRESS', 'COMPLETED'] },
            student: { $ref: '#/components/schemas/Student' },
            event: { $ref: '#/components/schemas/Event' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            rollNumber: { type: 'string', example: 'EDU-GF-0001' },
            name: { type: 'string', example: 'Rahul Kumar' },
            grade: { type: 'string', example: '5' },
            age: { type: 'integer', nullable: true },
          },
        },
        CreateEvent: {
          type: 'object',
          required: ['name', 'communityId', 'date'],
          properties: {
            name: { type: 'string', example: 'Science Fest 2026' },
            communityId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'] },
            description: { type: 'string' },
            code: { type: 'string' },
          },
        },
        CreateRegistration: {
          type: 'object',
          required: ['eventId'],
          properties: {
            eventId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid', description: 'Use existing student OR provide name/grade/phone/parentName' },
            name: { type: 'string', description: 'Student name (required if studentId not provided)' },
            grade: { type: 'string', description: 'Student grade (required if studentId not provided)' },
            phoneNumber: { type: 'string', description: 'Parent phone (required if studentId not provided)' },
            parentName: { type: 'string', description: 'Parent name (required if studentId not provided)' },
            age: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            notes: { type: 'string' },
            registeredBy: { type: 'string', default: 'API' },
          },
        },
        CreateStallVisit: {
          type: 'object',
          required: ['registrationId', 'stallId', 'studentId'],
          properties: {
            registrationId: { type: 'string', format: 'uuid' },
            stallId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
          },
        },
        CreatePerformance: {
          type: 'object',
          required: ['stallVisitId', 'volunteerId', 'score', 'grade'],
          properties: {
            stallVisitId: { type: 'string', format: 'uuid' },
            volunteerId: { type: 'string', format: 'uuid' },
            score: { type: 'number', minimum: 0, maximum: 10, example: 8.5 },
            grade: { type: 'string', example: 'A' },
            remarks: { type: 'string' },
            creativity: { type: 'integer', minimum: 1, maximum: 5 },
            problemSolving: { type: 'integer', minimum: 1, maximum: 5 },
            communication: { type: 'integer', minimum: 1, maximum: 5 },
            learningAbility: { type: 'integer', minimum: 1, maximum: 5 },
            metricScores: { type: 'object', additionalProperties: { type: 'number' } },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/events': {
        get: {
          tags: ['Events'],
          summary: 'List events',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'] } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by event name' },
          ],
          responses: {
            '200': { description: 'List of events with pagination', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Event' } }, meta: { $ref: '#/components/schemas/PaginationMeta' } } } } } },
          },
        },
        post: {
          tags: ['Events'],
          summary: 'Create event',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEvent' } } } },
          responses: {
            '201': { description: 'Event created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Event' } } } } } },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/events/{id}': {
        get: {
          tags: ['Events'],
          summary: 'Get event by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Event details with stalls and counts' },
            '404': { description: 'Event not found' },
          },
        },
        put: {
          tags: ['Events'],
          summary: 'Update event',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, status: { type: 'string' }, description: { type: 'string' } } } } } },
          responses: { '200': { description: 'Event updated' } },
        },
        delete: {
          tags: ['Events'],
          summary: 'Delete event',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'Event deleted' }, '400': { description: 'Cannot delete (has registrations)' } },
        },
      },
      '/communities': {
        get: {
          tags: ['Communities'],
          summary: 'List communities',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by name or location' },
          ],
          responses: { '200': { description: 'List of communities' } },
        },
        post: {
          tags: ['Communities'],
          summary: 'Create community',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code', 'name', 'location', 'contactPerson'], properties: { code: { type: 'string' }, name: { type: 'string' }, location: { type: 'string' }, contactPerson: { type: 'string' }, zone: { type: 'string' }, contactEmail: { type: 'string' }, contactPhone: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' } } } } } },
          responses: { '201': { description: 'Community created' } },
        },
      },
      '/communities/{id}': {
        get: { tags: ['Communities'], summary: 'Get community', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Community details' }, '404': { description: 'Not found' } } },
        put: { tags: ['Communities'], summary: 'Update community', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Community updated' } } },
        delete: { tags: ['Communities'], summary: 'Delete community', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Community deleted' }, '400': { description: 'Cannot delete (has events)' } } },
      },
      '/stalls': {
        get: { tags: ['Stalls'], summary: 'List stalls', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of stalls' } } },
        post: { tags: ['Stalls'], summary: 'Create stall', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } }, maxVolunteers: { type: 'integer' }, icon: { type: 'string' }, status: { type: 'string' } } } } } }, responses: { '201': { description: 'Stall created' } } },
      },
      '/stalls/{id}': {
        get: { tags: ['Stalls'], summary: 'Get stall', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Stall details' } } },
        put: { tags: ['Stalls'], summary: 'Update stall', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Stall updated' } } },
        delete: { tags: ['Stalls'], summary: 'Delete stall', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Stall deleted' } } },
      },
      '/volunteers': {
        get: { tags: ['Volunteers'], summary: 'List volunteers', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'role', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of volunteers (passwords excluded)' } } },
        post: { tags: ['Volunteers'], summary: 'Create volunteer', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, phoneNumber: { type: 'string' }, role: { type: 'string', enum: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] } } } } } }, responses: { '201': { description: 'Volunteer created' } } },
      },
      '/volunteers/{id}': {
        get: { tags: ['Volunteers'], summary: 'Get volunteer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Volunteer details' } } },
        put: { tags: ['Volunteers'], summary: 'Update volunteer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Volunteer updated' } } },
        delete: { tags: ['Volunteers'], summary: 'Delete volunteer', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Volunteer deleted' } } },
      },
      '/users': {
        get: { tags: ['Users'], summary: 'List admin/manager users', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'role', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of users' } } },
        post: { tags: ['Users'], summary: 'Create user', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['ADMIN', 'MANAGER'] }, phoneNumber: { type: 'string' } } } } } }, responses: { '201': { description: 'User created' } } },
      },
      '/users/{id}': {
        get: { tags: ['Users'], summary: 'Get user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User details' } } },
        put: { tags: ['Users'], summary: 'Update user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User updated' } } },
        delete: { tags: ['Users'], summary: 'Delete user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User deleted' }, '400': { description: 'Cannot delete last admin' } } },
      },
      '/registrations': {
        get: { tags: ['Registrations'], summary: 'List registrations', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'eventId', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by student name, roll number, or registration code' }], responses: { '200': { description: 'List of registrations' } } },
        post: { tags: ['Registrations'], summary: 'Create registration', description: 'Register a student for an event. Either provide studentId (existing student) or name+grade+phoneNumber+parentName (creates new student).', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRegistration' } } } }, responses: { '201': { description: 'Registration created with QR token' }, '409': { description: 'Already registered' } } },
      },
      '/registrations/{id}': {
        get: { tags: ['Registrations'], summary: 'Get registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Registration with student, event, stall visits' } } },
        put: { tags: ['Registrations'], summary: 'Update registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['REGISTERED', 'IN_PROGRESS', 'COMPLETED'] }, notes: { type: 'string' } } } } } }, responses: { '200': { description: 'Registration updated' } } },
        delete: { tags: ['Registrations'], summary: 'Delete registration', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Registration deleted (cascades to visits/performances)' } } },
      },
      '/students': {
        get: { tags: ['Students'], summary: 'List students', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by name or roll number' }], responses: { '200': { description: 'List of students' } } },
      },
      '/students/{id}': {
        get: { tags: ['Students'], summary: 'Get student', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Student with registrations' } } },
        put: { tags: ['Students'], summary: 'Update student', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Student updated' } } },
      },
      '/stall-visits': {
        get: { tags: ['Stall Visits'], summary: 'List stall visits', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'registrationId', in: 'query', schema: { type: 'string' } }, { name: 'stallId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of stall visits' } } },
        post: { tags: ['Stall Visits'], summary: 'Create stall visit', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStallVisit' } } } }, responses: { '201': { description: 'Stall visit created' }, '409': { description: 'Already visited' } } },
      },
      '/stall-visits/{id}': {
        get: { tags: ['Stall Visits'], summary: 'Get stall visit', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Stall visit with performance' } } },
      },
      '/performances': {
        get: { tags: ['Performances'], summary: 'List performances', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'volunteerId', in: 'query', schema: { type: 'string' } }, { name: 'stallVisitId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of performances' } } },
        post: { tags: ['Performances'], summary: 'Create performance evaluation', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePerformance' } } } }, responses: { '201': { description: 'Performance created' }, '409': { description: 'Already evaluated' } } },
      },
      '/performances/{id}': {
        get: { tags: ['Performances'], summary: 'Get performance', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Performance with stall visit and student' } } },
      },
      '/analytics/overview': {
        get: { tags: ['Analytics'], summary: 'Overview analytics', description: 'Returns total visits, completion rate, active stalls, visit trends, and performance by grade', responses: { '200': { description: 'Overview stats' } } },
      },
      '/analytics/communities': {
        get: { tags: ['Analytics'], summary: 'Community analytics', description: 'Returns per-community stats: participants, completion rate', responses: { '200': { description: 'Community stats' } } },
      },
      '/analytics/stalls': {
        get: { tags: ['Analytics'], summary: 'Stall analytics', description: 'Returns per-stall stats: visit count, volunteer count', responses: { '200': { description: 'Stall stats' } } },
      },
      '/analytics/volunteers': {
        get: { tags: ['Analytics'], summary: 'Volunteer analytics', description: 'Returns per-volunteer stats: evaluations, avg rating, assignments', responses: { '200': { description: 'Volunteer stats' } } },
      },
      '/api-keys': {
        get: { tags: ['API Keys'], summary: 'List API keys (masked)', responses: { '200': { description: 'List of masked API keys' } } },
        post: { tags: ['API Keys'], summary: 'Generate new API key', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', description: 'Friendly name for the key' } } } } } }, responses: { '201': { description: 'API key created (key shown once)' } } },
      },
      '/api-keys/{id}': {
        delete: { tags: ['API Keys'], summary: 'Revoke API key', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'API key revoked' } } },
      },
    },
    tags: [
      { name: 'Events', description: 'Manage educational events' },
      { name: 'Communities', description: 'Manage residential communities and schools' },
      { name: 'Stalls', description: 'Manage activity stalls' },
      { name: 'Volunteers', description: 'Manage event volunteers' },
      { name: 'Users', description: 'Manage admin and manager accounts' },
      { name: 'Registrations', description: 'Register students for events' },
      { name: 'Students', description: 'Manage student records' },
      { name: 'Stall Visits', description: 'Track student stall visits' },
      { name: 'Performances', description: 'Record performance evaluations' },
      { name: 'Analytics', description: 'Event and community analytics' },
      { name: 'API Keys', description: 'Manage API keys' },
    ],
  }

  return NextResponse.json(spec)
}
