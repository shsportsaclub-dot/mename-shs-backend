import dotenv from 'dotenv';

// Render-injected values win; Neon writes .env.local when .env does not exist.
dotenv.config({ path: ['.env.local', '.env'], quiet: true });
