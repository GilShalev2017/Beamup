import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://beamup:beamup_secret@localhost:5432/beamup_db?schema=public',
  },
});
