-- Public, human-readable team identifiers start at SIH100.
CREATE SEQUENCE IF NOT EXISTS "team_code_seq" START WITH 100;

ALTER TABLE "Team" ADD COLUMN "teamCode" TEXT;

WITH numbered AS (
  SELECT "id", 100 + ROW_NUMBER() OVER (ORDER BY "id") - 1 AS n
  FROM "Team"
)
UPDATE "Team" AS t
SET "teamCode" = 'SIH' || numbered.n
FROM numbered
WHERE t."id" = numbered."id";

SELECT setval(
  '"team_code_seq"',
  GREATEST(COALESCE((SELECT MAX(CAST(SUBSTRING("teamCode" FROM 4) AS INTEGER)) FROM "Team" WHERE "teamCode" IS NOT NULL), 99) + 1, 100),
  false
);

ALTER TABLE "Team" ALTER COLUMN "teamCode" SET NOT NULL;
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");
