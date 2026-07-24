const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locs = await prisma.location.findMany();
  const bus = {};
  locs.forEach(l => {
    const key = l.bu || 'NULL';
    bus[key] = (bus[key] || 0) + 1;
  });
  console.log('BU counts:', bus);

  const sampleTW = locs.filter(l => {
    const nameLower = l.name.toLowerCase();
    const buUpper = (l.bu || '').toUpperCase();
    return buUpper === 'TW' || buUpper === 'HBY' || buUpper === 'HO' || nameLower.includes('ไทวัสดุ') || nameLower.includes('head office') || nameLower.includes('ho-expo');
  });

  console.log('Total TW / Head Office locations count:', sampleTW.length);
  console.log('Sample TW/HO locations:', sampleTW.slice(0, 10).map(l => ({ id: l.id, name: l.name, bu: l.bu })));

  await prisma.$disconnect();
}

main().catch(console.error);
