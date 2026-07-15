const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUrls() {
  const photos = await prisma.photo.findMany({
    where: { url: { contains: 'localhost' } },
  });

  console.log(`Found ${photos.length} photos with localhost URLs`);

  for (const photo of photos) {
    const newUrl = photo.url.replace(/https?:\/\/localhost:\d+/, '');
    await prisma.photo.update({ where: { id: photo.id }, data: { url: newUrl } });
    console.log(`  Fixed: ${photo.url} → ${newUrl}`);
  }

  const users = await prisma.user.findMany({
    where: { profileImage: { contains: 'localhost' } },
  });

  console.log(`Found ${users.length} users with localhost profile images`);

  for (const user of users) {
    const newUrl = user.profileImage.replace(/https?:\/\/localhost:\d+/, '');
    await prisma.user.update({ where: { id: user.id }, data: { profileImage: newUrl } });
    console.log(`  Fixed: ${user.profileImage} → ${newUrl}`);
  }

  await prisma.$disconnect();
  console.log('Done!');
}

fixUrls().catch(console.error);
