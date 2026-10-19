import { defineConfig } from "@neon/config/v1";

// Postgres is included in the linked project. Preserve existing branch settings
// and authentication; this app only requests DATABASE_URL for its server.
export default defineConfig({});
