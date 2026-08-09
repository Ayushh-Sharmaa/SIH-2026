'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui';
import { Field, SelectField, PremiumButton } from '@/components/motion';

interface RecruitmentNoticeModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  openSeats: number;
  onSuccess: () => void;
}

export default function RecruitmentNoticeModal({
  open,
  onClose,
  teamId,
  openSeats,
  onSuccess,
}: RecruitmentNoticeModalProps) {
  const [role, setRole] = useState('');
  const [gender, setGender] = useState('OPEN');
  const [abilitiesText, setAbilitiesText] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role.trim()) {
      setError('Target role is required (e.g. Frontend Developer).');
      return;
    }

    const abilities = abilitiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (abilities.length === 0) {
      setError('Please list at least one required ability or skill (comma separated).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/teams/recruitment-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          role: role.trim(),
          gender,
          abilities,
          requirements: requirements.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post notice');

      setRole('');
      setGender('OPEN');
      setAbilitiesText('');
      setRequirements('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while posting recruitment notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post Team Recruitment Notice" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <p className="text-xs text-muted">
          Looking for a specific teammate? Describe the role and requirements. You have{' '}
          <strong className="text-foreground">{openSeats} open seat(s)</strong> remaining in your team.
        </p>

        <Field
          label="Role Needed"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          hint="e.g. Fullstack Developer / UI Designer"
        />

        <SelectField
          label="Gender Preference"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="OPEN">Open to Anyone</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </SelectField>

        <Field
          label="Required Abilities / Tech Stack (comma separated)"
          required
          value={abilitiesText}
          onChange={(e) => setAbilitiesText(e.target.value)}
          hint="e.g. React, Next.js, Python, Figma"
        />

        <label className="block">
          <span className="mb-1.5 block text-label uppercase text-muted">
            Team Requirements / Expectations
          </span>
          <textarea
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe what this member will work on and any specific expectations..."
            className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-[rgba(248,246,242,0.95)]"
          />
        </label>

        {error && (
          <p className="text-xs font-bold text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/60 px-4 py-2 text-xs font-bold text-foreground hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <PremiumButton type="submit" loading={submitting} size="sm">
            Post Notice
          </PremiumButton>
        </div>
      </form>
    </Modal>
  );
}
