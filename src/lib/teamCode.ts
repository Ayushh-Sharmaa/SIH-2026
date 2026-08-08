import type { Prisma } from '@prisma/client';

/** Allocate the next public team code from the database sequence. */
export async function nextTeamCode(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`
    SELECT nextval('"team_code_seq"')
  `;
  const next = rows[0]?.nextval;
  if (next === undefined) throw new Error('Could not allocate a team code.');
  return `SIH${next.toString()}`;
}
