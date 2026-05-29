import { prisma } from './lib/prisma';

async function main() {
  const stalls = await prisma.stall.findMany({
    include: { events: true }
  });
  console.log('All stalls:', stalls.length);
  const available = stalls.filter(s => s.events.length === 0);
  console.log('Available stalls:', available.length);
  console.log(JSON.stringify(stalls, null, 2));
}
main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
