/**
 * API Server Entry Point
 *
 * Starts both the legacy API server and the new Unified Workflow API.
 */

import 'dotenv/config';
import { apiServer } from './server.js';
import { startUnifiedWorkflowServer } from './UnifiedWorkflowAPI.js';

// Check which mode to run
const mode = process.argv[2] ?? 'unified';

async function main() {
    if (mode === 'legacy') {
        // Legacy API Server
        const PORT = 3001;
        console.log('🌐 Starting Legacy TrustBot API Server...');
        apiServer.start(PORT);

        console.log(`
📡 Legacy API Endpoints:
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
`);
    } else {
        // New Unified Workflow API (default)
        console.log('🚀 Starting Unified Workflow API Server...\n');
        const port = parseInt(process.env.PORT ?? '3003');
        const { masterKey, supabase } = await startUnifiedWorkflowServer(port);

        console.log(`
═══════════════════════════════════════════════════════════════════
                    TRUSTBOT UNIFIED WORKFLOW API
═══════════════════════════════════════════════════════════════════

📊 DASHBOARD ENDPOINTS:
   GET  /dashboard/today          - "Completed Today" summary
   GET  /dashboard/aggressiveness - Current autonomy settings
   POST /dashboard/aggressiveness - Set aggressiveness slider (0-100)

📋 TASK PIPELINE:
   GET  /tasks                    - List all tasks
   POST /tasks                    - Create new task
   POST /tasks/:id/assign         - Assign task to agent
   POST /tasks/:id/complete       - Mark task completed
   POST /tasks/:id/fail           - Mark task failed

✅ HITL APPROVALS:
   GET  /approvals                - Pending human approvals
   POST /approvals/:id            - Approve or reject task

🔒 SECURITY:
   POST /auth/human               - Get human operator token
   GET  /security/audit           - View audit log
   GET  /trust/stats              - Trust system statistics

📦 ARTIFACTS:
   GET  /api/artifacts            - List artifacts (with filters)
   POST /api/artifacts            - Create artifact (JSON or multipart)
   GET  /api/artifacts/:id        - Get artifact metadata
   GET  /api/artifacts/:id/content - Download artifact content
   PUT  /api/artifacts/:id        - Update artifact metadata
   DELETE /api/artifacts/:id      - Delete artifact
   POST /api/artifacts/:id/versions - Create new version
   GET  /api/artifacts/:id/versions - Get version history
   POST /api/artifacts/:id/review - Approve/reject artifact

🔑 MASTER KEY: ${masterKey}
   (Use this to authenticate as human operator)

💾 DATABASE: ${supabase ? 'Supabase (Postgres)' : 'File-based'}

═══════════════════════════════════════════════════════════════════
`);
    }
}

main().catch(console.error);
