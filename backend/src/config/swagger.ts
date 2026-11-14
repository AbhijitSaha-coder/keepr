export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Keepr API',
    version: '1.0.0',
    description: 'Keepr — Everything important, kept in one place. Personal and Household Operations Platform API.'
  },
  servers: [
    {
      url: '/api',
      description: 'Main API server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          '200': { description: 'Healthy system status' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        responses: { '201': { description: 'Account registered' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        responses: { '200': { description: 'Logged in successfully' } }
      }
    },
    '/workspaces': {
      get: { summary: 'List user workspaces' },
      post: { summary: 'Create new household workspace' }
    },
    '/bills': {
      get: { summary: 'List workspace bills' },
      post: { summary: 'Create new bill with recurrence' }
    },
    '/bills/{billId}/pay': {
      post: { summary: 'Record payment for bill' }
    },
    '/subscriptions': {
      get: { summary: 'List active and paused subscriptions' },
      post: { summary: 'Create subscription record' }
    },
    '/documents': {
      get: { summary: 'List vault documents with signed URLs' }
    },
    '/documents/upload': {
      post: { summary: 'Upload private document to vault' }
    },
    '/inventory': {
      get: { summary: 'List household inventory items' },
      post: { summary: 'Create new inventory item' }
    },
    '/tasks': {
      get: { summary: 'List household tasks' },
      post: { summary: 'Create new household task' }
    },
    '/analytics/dashboard': {
      get: { summary: 'Fetch real aggregated workspace analytics' }
    },
    '/notifications': {
      get: { summary: 'Fetch user notifications' }
    },
    '/activity': {
      get: { summary: 'Fetch workspace audit logs' }
    }
  }
};
