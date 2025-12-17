/**
 * API Server Entry Point
 * 
 * Starts the REST API server for the TrustBot system.
 */

import { apiServer } from './server.js';

const PORT = 3001;

console.log('🌐 Starting TrustBot API Server...');
apiServer.start(PORT);

console.log(`
📡 API Endpoints:
   GET  /api/state      - Full system state
   GET  /api/agents     - All agents
   GET  /api/agent/:id  - Single agent
   GET  /api/blackboard - Blackboard entries
   GET  /api/approvals  - Pending approvals
   GET  /api/stats      - Quick stats

   POST /api/spawn      - Spawn new agent
   POST /api/hitl       - Set HITL level
   POST /api/command    - Send command to agent
   POST /api/approve    - Approve/reject request
   POST /api/blackboard/post - Post to blackboard
   POST /api/advance-day     - Advance simulation
`);
