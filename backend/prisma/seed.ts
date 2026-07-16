import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const [passwordHash, adminPasswordHash] = await Promise.all([
    argon2.hash('test', {
      type: argon2.argon2id,
    }),
    argon2.hash('admin', {
      type: argon2.argon2id,
    }),
  ]);

  await prisma.user.upsert({
    where: { username: 'test' },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      username: 'test',
      passwordHash,
    },
  });

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
    },
  });

  console.log('Seeded login users: test, admin');
}

main().finally(async () => {
  await prisma.$disconnect();
});
