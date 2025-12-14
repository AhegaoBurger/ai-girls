const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

module.exports = {
  apps: [{
    name: 'ai-girls',
    script: './backend/dist/index.js',
    cwd: '/root/projects/ai-girls',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      FRONTEND_URL: 'http://localhost:5173',
      BACKEND_URL: 'http://localhost:3001',
    },
  }],
};
