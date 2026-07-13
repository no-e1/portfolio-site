import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('test', {
    type: argon2.argon2id,
  });

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

  console.log('Seeded login user: test');
}

main().finally(async () => {
  await prisma.$disconnect();
});
