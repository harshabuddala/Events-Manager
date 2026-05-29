import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { prisma } = await import('./lib/prisma');
  try {
    const stalls = await prisma.stall.findMany({
      include: { _count: { select: { events: true } } }
    });
    console.log('Stalls query success:', stalls.length);
    const events = await prisma.event.findMany({
      include: { stalls: true }
    });
    console.log('Events query success:', events.length);
  } catch (error) {
    console.error('DB Error:', error);
  }
}
main().then(() => process.exit(0));


