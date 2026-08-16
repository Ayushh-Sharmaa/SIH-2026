import type { Prisma } from '@prisma/client';

/** Allocate the next public team code from the database sequence. */
export async function nextTeamCode(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`
    SELECT nextval('"team_code_seq"')
  `;
  const next = rows[0]?.nextval;
  if (next === undefined) throw new Error('Could not allocate a team code.');
  const code = `GLB${next.toString()}`;

  // The sequence is non-transactional (so a failed transaction still burns
  // the number) while this durable row survives every later team deletion.
  await tx.teamCodeReservation.create({ data: { code } });
  return code;
}
