export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Content Broadcasting System API',
    version: '1.0.0',
    description:
      'A production-grade backend API for managing educational content broadcasting. Teachers upload content, Principals approve/reject it, and Students access live broadcasts via a public API with intelligent scheduling and rotation.',
    contact: { name: 'Vaishnavi Marathe' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local Development' },
    { url: 'http://16.171.173.163:3000', description: 'AWS EC2 Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration and Login' },
    { name: 'Teacher', description: 'Teacher content upload and status' },
    { name: 'Principal', description: 'Content approval and management' },
    { name: 'Analytics', description: 'Subject-wise and overview analytics' },
    { name: 'Student (Public)', description: 'Live content broadcasting (no auth required)' },
    { name: 'Health', description: 'Server health check' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string', example: 'John Teacher' },
          email: { type: 'string', format: 'email', example: 'teacher@school.com' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          role: { type: 'string', enum: ['TEACHER', 'PRINCIPAL'], example: 'TEACHER' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'teacher@school.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['TEACHER', 'PRINCIPAL'] },
                },
              },
            },
          },
        },
      },
      RejectRequest: {
        type: 'object',
        required: ['rejectionReason'],
        properties: {
          rejectionReason: { type: 'string', minLength: 5, example: 'Content quality is not up to standard, please re-upload with better resolution.' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (Teacher or Principal)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '400': { description: 'Email already exists or validation error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/content/upload': {
      post: {
        tags: ['Teacher'],
        summary: 'Upload content (image file with metadata)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'subject', 'file'],
                properties: {
                  title: { type: 'string', example: 'Maths Chapter 1' },
                  subject: { type: 'string', example: 'Maths' },
                  description: { type: 'string', example: 'Algebra basics for Class 10' },
                  file: { type: 'string', format: 'binary', description: 'JPG, PNG, or GIF (max 10MB)' },
                  startTime: { type: 'string', format: 'date-time', example: '2026-04-01T00:00:00.000Z' },
                  endTime: { type: 'string', format: 'date-time', example: '2026-05-01T00:00:00.000Z' },
                  rotationDuration: { type: 'string', example: '5', description: 'Duration in minutes for rotation' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Content uploaded successfully (status: PENDING)' },
          '400': { description: 'Missing file or validation error' },
          '401': { description: 'Unauthorized — missing or invalid token' },
          '403': { description: 'Forbidden — requires TEACHER role' },
        },
      },
    },
    '/api/content/my-uploads': {
      get: {
        tags: ['Teacher'],
        summary: 'View all my uploaded content with status',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'List of all uploads by the authenticated teacher' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires TEACHER role' },
        },
      },
    },
    '/api/admin/content/all': {
      get: {
        tags: ['Principal'],
        summary: 'View all content (with pagination and filters)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
          { name: 'subject', in: 'query', schema: { type: 'string' } },
          { name: 'teacherId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Paginated list of all content with filters applied' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/api/admin/content/pending': {
      get: {
        tags: ['Principal'],
        summary: 'View all pending content awaiting approval',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'List of all pending content' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/api/admin/content/{id}/approve': {
      put: {
        tags: ['Principal'],
        summary: 'Approve a piece of content',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Content ID' }],
        responses: {
          '200': { description: 'Content approved successfully' },
          '400': { description: 'Content is already approved/rejected' },
          '404': { description: 'Content not found' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/api/admin/content/{id}/reject': {
      put: {
        tags: ['Principal'],
        summary: 'Reject a piece of content (with reason)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Content ID' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RejectRequest' } } },
        },
        responses: {
          '200': { description: 'Content rejected successfully' },
          '400': { description: 'Content is already approved/rejected' },
          '404': { description: 'Content not found' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/api/content/live/{teacherId}': {
      get: {
        tags: ['Student (Public)'],
        summary: 'Get currently live content for a teacher (no auth required)',
        description: 'Returns approved content that is within its scheduled time window. Supports subject filtering. Response is cached in Redis for 60 seconds.',
        parameters: [
          { name: 'teacherId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Teacher User ID' },
          { name: 'subject', in: 'query', schema: { type: 'string' }, description: 'Filter by subject (e.g., Maths)' },
        ],
        responses: {
          '200': { description: 'Currently active content for the teacher' },
          '404': { description: 'Teacher not found' },
        },
      },
    },
    '/api/admin/analytics/subjects': {
      get: {
        tags: ['Analytics'],
        summary: 'Subject-wise analytics (most active subject + breakdown)',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Subject analytics with most active subject' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/api/admin/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Overview analytics (total content, approval rate, user counts)',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'System-wide analytics overview' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — requires PRINCIPAL role' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          '200': { description: 'Server is running', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'OK' }, message: { type: 'string', example: 'Content Broadcasting System API is running.' } } } } } },
        },
      },
    },
  },
};
