-- Mentor guidance is intentionally unbounded. The relationship count is
-- derived from Team.mentorId, so the old denormalized fields cannot drift.
ALTER TABLE "MentorProfile" DROP COLUMN "capacity";
ALTER TABLE "MentorProfile" DROP COLUMN "currentLoad";

-- Every successfully allocated public code gets a permanent ledger row.
CREATE TABLE "TeamCodeReservation" (
    "code" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamCodeReservation_pkey" PRIMARY KEY ("code")
);

INSERT INTO "TeamCodeReservation" ("code")
SELECT "teamCode" FROM "Team"
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "Team"
ADD CONSTRAINT "Team_teamCode_fkey"
FOREIGN KEY ("teamCode") REFERENCES "TeamCodeReservation"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- The application never needs to mutate or delete a retired allocation. The
-- trigger turns that policy into a database guarantee, including for manual
-- SQL and future code paths.
CREATE OR REPLACE FUNCTION prevent_team_code_reservation_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Team code reservations are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TeamCodeReservation_immutable"
BEFORE UPDATE OR DELETE ON "TeamCodeReservation"
FOR EACH ROW EXECUTE FUNCTION prevent_team_code_reservation_mutation();

-- Prevent duplicate live requests even when two submissions race between an
-- application-level lookup and insert.
CREATE UNIQUE INDEX "MentorRequest_active_team_mentor_key"
ON "MentorRequest" ("teamId", "mentorId")
WHERE "status" IN ('pending', 'keep_pending', 'meeting_requested');

CREATE UNIQUE INDEX "JoinRequest_active_team_student_key"
ON "JoinRequest" ("teamId", "studentId")
WHERE "status" IN ('pending', 'on_hold', 'meeting_requested');

CREATE UNIQUE INDEX "TeamInvite_active_team_student_key"
ON "TeamInvite" ("teamId", "studentId")
WHERE "status" IN ('pending', 'on_hold', 'waitlist');

CREATE INDEX "Team_status_memberCount_idx" ON "Team"("status", "memberCount");
