-- CreateIndex
CREATE INDEX "StudentProfile_teamId_idx" ON "StudentProfile"("teamId");

-- CreateIndex
CREATE INDEX "StudentProfile_teamStatus_isDemo_idx" ON "StudentProfile"("teamStatus", "isDemo");

-- CreateIndex
CREATE INDEX "MentorProfile_verified_idx" ON "MentorProfile"("verified");

-- CreateIndex
CREATE INDEX "Team_trackId_idx" ON "Team"("trackId");

-- CreateIndex
CREATE INDEX "Team_leaderId_idx" ON "Team"("leaderId");

-- CreateIndex
CREATE INDEX "Team_mentorId_idx" ON "Team"("mentorId");

-- CreateIndex
CREATE INDEX "TeamInvite_studentId_status_idx" ON "TeamInvite"("studentId", "status");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_status_idx" ON "TeamInvite"("teamId", "status");

-- CreateIndex
CREATE INDEX "JoinRequest_studentId_status_idx" ON "JoinRequest"("studentId", "status");

-- CreateIndex
CREATE INDEX "JoinRequest_teamId_status_idx" ON "JoinRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "MentorRequest_mentorId_status_idx" ON "MentorRequest"("mentorId", "status");

-- CreateIndex
CREATE INDEX "MentorRequest_teamId_status_idx" ON "MentorRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Message_teamId_createdAt_idx" ON "Message"("teamId", "createdAt");
