import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  // Query logs include parameters (emails, hashes, report content): development only.
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});
