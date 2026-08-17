'use client';

import { useState } from 'react';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Search,
  Award,
  ShieldCheck,
  GraduationCap,
  Building,
  UserCheck,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Container, useToast } from '@/components/ui';
import {
  Aurora,
  Reveal,
  RevealGroup,
  RevealItem,
  SplitText,
  SpotlightCard,
  PremiumButton,
  SPRING,
  DURATION,
  EASE,
} from '@/components/motion';
import { FACULTY_CONTACTS, STUDENT_LEADS, type FacultyContact, type StudentLead } from '@/config/contacts';

const CATEGORIES = [
  { id: 'all', label: 'All Contacts' },
  { id: 'spoc', label: 'SIH SPOC' },
  { id: 'faculty', label: 'Faculty Coordinators' },
  { id: 'students', label: 'Student Leads' },
  { id: 'location', label: 'Campus & Helpdesk' },
] as const;

export default function ContactPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof CATEGORIES)[number]['id']>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast(`${label} copied to clipboard`, 'success');
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const cleanPhone = (phone?: string) => (phone ? phone.replace(/[^0-9]/g, '') : '');

  const q = searchQuery.toLowerCase().trim();

  const spocContact = FACULTY_CONTACTS.find((f) => f.isSpoc);
  const mbaContacts = FACULTY_CONTACTS.filter((f) => f.category === 'MBA');
  const btechSeniorContacts = FACULTY_CONTACTS.filter((f) => f.category === 'BTech 3rd & 4th Year');
  const btechJuniorContacts = FACULTY_CONTACTS.filter((f) => f.category === 'BTech 2nd Year');

  const matchesQuery = (c: { name: string; role?: string; department?: string; phone?: string; email?: string }) => {
    if (!q) return true;
    const qCleanPhone = q.replace(/[^0-9]/g, '');
    const cCleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
    return (
      c.name.toLowerCase().includes(q) ||
      (c.role && c.role.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (qCleanPhone.length >= 3 && cCleanPhone.includes(qCleanPhone)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  };

  const filteredFaculty = FACULTY_CONTACTS.filter((f) => !f.isSpoc && matchesQuery(f));
  const filteredStudents = STUDENT_LEADS.filter(matchesQuery);
  const showSpoc = (!q || (spocContact && matchesQuery(spocContact))) && (activeTab === 'all' || activeTab === 'spoc');
  const showFaculty = (activeTab === 'all' || activeTab === 'faculty') && filteredFaculty.length > 0;
  const showStudents = (activeTab === 'all' || activeTab === 'students') && filteredStudents.length > 0;
  const showLocation = (activeTab === 'all' || activeTab === 'location') && !q;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* ── HERO SECTION ── */}
        <section className="section-warm relative overflow-hidden border-b border-[rgba(209,199,189,0.7)] pt-12 pb-16">
          <Aurora variant="warm" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <Container width="wide" className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal direction="down">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.08)] px-3.5 py-1 text-xs font-bold text-primary shadow-sm mb-4">
                  <ShieldCheck className="size-3.5" />
                  <span>Official SIH-2026 Institutional Directory</span>
                </div>
              </Reveal>

              <SplitText
                as="h1"
                text="Get in Touch with the SIH Team."
                className="text-display text-foreground font-black tracking-tight"
                delay={0.06}
              />

              <Reveal delay={0.2} className="mt-4">
                <p className="text-base sm:text-lg leading-relaxed text-body max-w-2xl mx-auto">
                  Connect with the Single Point of Contact (SPOC), department faculty coordinators, and student technical leads at GL Bajaj Group of Institutions for internal evaluations, problem statements, and mentorship guidance.
                </p>
              </Reveal>

              {/* Search & Filter Bar */}
              <Reveal delay={0.3} className="mt-8">
                <div className="relative mx-auto max-w-xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coordinator by name, department, or mobile number..."
                    aria-label="Search contacts"
                    className="w-full rounded-2xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.85)] py-3.5 pl-12 pr-10 text-sm text-foreground outline-none shadow-sm transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.98)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.12)]"
                  />
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-primary"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveTab(cat.id)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-primary text-on-accent shadow-[0_4px_14px_rgba(114,56,61,0.25)]'
                            : 'border border-[rgba(209,199,189,0.8)] bg-white/50 text-muted hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <Container width="wide" className="pt-12 space-y-16">
          {/* ── 1. SIH SPOC HERO SPOTLIGHT ── */}
          {showSpoc && spocContact && (
            <Reveal direction="up">
              <div className="relative overflow-hidden rounded-3xl border border-[rgba(114,56,61,0.3)] bg-gradient-to-br from-[rgba(248,246,242,0.95)] via-[rgba(239,233,225,0.7)] to-[rgba(209,199,189,0.35)] p-6 sm:p-10 shadow-e2">
                <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(114,56,61,0.12),transparent_70%)] pointer-events-none blur-2xl" />

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="flex items-start gap-5">
                    <div className="flex size-16 sm:size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/10 text-primary shadow-sm">
                      <Award className="size-8 sm:size-10" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-0.5 text-caption font-extrabold uppercase tracking-wider text-primary">
                        <Sparkles className="size-3" /> Institutional SPOC
                      </div>
                      <h2 className="text-title text-foreground font-black tracking-tight">
                        {spocContact.name}
                      </h2>
                      <p className="text-sm font-semibold text-primary">
                        {spocContact.role}
                      </p>
                      <p className="text-xs text-muted flex items-center gap-1.5">
                        <Building className="size-3.5 shrink-0" />
                        <span>GL Bajaj Group of Institutions, Mathura</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
                    {spocContact.phone && (
                      <>
                        <a
                          href={`tel:${cleanPhone(spocContact.phone)}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-accent shadow-[0_4px_14px_rgba(114,56,61,0.25)] transition-all hover:bg-[var(--primary-hover)] active:scale-98"
                        >
                          <Phone className="size-3.5" />
                          <span>Call SPOC</span>
                        </a>

                        <a
                          href={`https://wa.me/${cleanPhone(spocContact.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600/30 bg-green-50 px-3.5 py-2.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}

                    {spocContact.email && (
                      <a
                        href={`mailto:${spocContact.email}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-on-accent transition-colors"
                      >
                        <Mail className="size-3.5" />
                        <span>Email</span>
                      </a>
                    )}

                    {spocContact.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(spocContact.phone!, 'SPOC Contact', 'spoc-phone')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/80 px-3 py-2.5 text-xs font-bold text-body hover:text-primary transition-colors cursor-pointer"
                        title="Copy mobile number"
                      >
                        {copiedKey === 'spoc-phone' ? (
                          <>
                            <Check className="size-3.5 text-green-600" />
                            <span className="text-green-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>{spocContact.phone}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* ── 2. FACULTY COORDINATORS ── */}
          {showFaculty && (
            <section className="space-y-8">
              <div className="border-b border-[rgba(209,199,189,0.7)] pb-4">
                <span className="text-label uppercase text-primary font-bold tracking-wider">
                  Academic Mentors &amp; Branch Incharges
                </span>
                <h2 className="mt-1 text-heading text-foreground font-black">
                  Faculty Coordinators
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Department-wise faculty coordinators responsible for student eligibility, idea screening, and domain guidance.
                </p>
              </div>

              {/* MBA Section */}
              {(activeTab === 'all' || activeTab === 'faculty') && mbaContacts.some(matchesQuery) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary" />
                    <h3 className="text-feature text-foreground font-bold">
                      Department of Management Studies (MBA)
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mbaContacts.filter(matchesQuery).map((faculty) => (
                      <FacultyCard
                        key={faculty.name}
                        faculty={faculty}
                        copiedKey={copiedKey}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* B.Tech 3rd & 4th Year Section */}
              {(activeTab === 'all' || activeTab === 'faculty') && btechSeniorContacts.some(matchesQuery) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary" />
                    <h3 className="text-feature text-foreground font-bold">
                      B.Tech 3rd Year &amp; 4th Year Coordinators
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {btechSeniorContacts.filter(matchesQuery).map((faculty) => (
                      <FacultyCard
                        key={faculty.name}
                        faculty={faculty}
                        copiedKey={copiedKey}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* B.Tech 2nd Year Section */}
              {(activeTab === 'all' || activeTab === 'faculty') && btechJuniorContacts.some(matchesQuery) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary" />
                    <h3 className="text-feature text-foreground font-bold">
                      B.Tech 2nd Year Coordinators
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {btechJuniorContacts.filter(matchesQuery).map((faculty) => (
                      <FacultyCard
                        key={faculty.name}
                        faculty={faculty}
                        copiedKey={copiedKey}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── 3. STUDENT LEADS (AYUSH FIRST, THEN TANISHK) ── */}
          {showStudents && (
            <section className="space-y-6">
              <div className="border-b border-[rgba(209,199,189,0.7)] pb-4">
                <span className="text-label uppercase text-primary font-bold tracking-wider">
                  Student Technical &amp; Operational Leads
                </span>
                <h2 className="mt-1 text-heading text-foreground font-black">
                  Student Coordinators &amp; Platform Leads
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Get in touch with student leads for portal support, team formation assistance, rule clarifications, or system feedback.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredStudents.map((student, idx) => (
                  <StudentLeadCard
                    key={student.name}
                    student={student}
                    index={idx}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── 4. CAMPUS LOCATION & INSTITUTIONAL HELPDESK ── */}
          {showLocation && (
            <section className="rounded-3xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.6)] p-6 sm:p-10 shadow-e1">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-3">
                  <span className="text-label uppercase text-primary font-bold">
                    Campus Location
                  </span>
                  <h3 className="text-feature text-foreground font-bold">
                    GL Bajaj Group of Institutions
                  </h3>
                  <p className="text-xs leading-relaxed text-body">
                    NH-19, Mathura-Delhi Road, Akbarpur, Mathura, Uttar Pradesh 281406
                  </p>
                  <a
                    href="https://maps.google.com/?q=GL+Bajaj+Group+of+Institutions+Mathura"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
                  >
                    <MapPin className="size-3.5" />
                    <span>View on Google Maps</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="space-y-3 border-t border-[rgba(209,199,189,0.6)] pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                  <span className="text-label uppercase text-primary font-bold">
                    Hackathon Helpdesk
                  </span>
                  <h3 className="text-feature text-foreground font-bold">
                    Office &amp; Support Hours
                  </h3>
                  <p className="text-xs leading-relaxed text-body">
                    Monday to Saturday: 9:00 AM – 5:00 PM IST
                  </p>
                  <p className="text-xs text-muted">
                    For emergency team changes or SPOC approvals during active evaluation cycles, reach out via the official WhatsApp channels.
                  </p>
                </div>

                <div className="space-y-3 border-t border-[rgba(209,199,189,0.6)] pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                  <span className="text-label uppercase text-primary font-bold">
                    Official Inquiries
                  </span>
                  <h3 className="text-feature text-foreground font-bold">
                    Institutional Email
                  </h3>
                  <p className="text-xs leading-relaxed text-body">
                    Email queries directly to the internal SIH coordination team:
                  </p>
                  <a
                    href="mailto:iic@glbajajgroup.org"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Mail className="size-3.5" />
                    <span>iic@glbajajgroup.org</span>
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* No results fallback */}
          {q && !showSpoc && !showFaculty && !showStudents && (
            <div className="text-center py-16 space-y-3">
              <p className="text-base font-bold text-foreground">
                No coordinators matched “{searchQuery}”.
              </p>
              <p className="text-xs text-muted">
                Try searching by first name, last name, branch (MBA, CSE), or mobile number.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-accent"
              >
                Clear Search
              </button>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * SUBCOMPONENTS
 * ──────────────────────────────────────────────────────────── */

function FacultyCard({
  faculty,
  copiedKey,
  onCopy,
}: {
  faculty: FacultyContact;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}) {
  const cleanPhone = faculty.phone ? faculty.phone.replace(/[^0-9]/g, '') : '';
  const phoneCopyKey = `fac-phone-${faculty.name}`;
  const emailCopyKey = `fac-email-${faculty.name}`;

  return (
    <SpotlightCard className="h-full rounded-2xl">
      <div className="surface-raised rounded-2xl p-5 border border-[rgba(209,199,189,0.7)] flex flex-col justify-between h-full space-y-4 shadow-sm hover:border-primary/40 transition-colors">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider text-primary rounded-md bg-[rgba(114,56,61,0.08)] px-2 py-0.5">
              <UserCheck className="size-3" />
              {faculty.category}
            </span>
          </div>

          <h4 className="text-base font-black text-foreground">
            {faculty.name}
          </h4>

          <p className="text-xs font-semibold text-primary">
            {faculty.designation}
          </p>

          <p className="text-xs text-muted leading-relaxed">
            {faculty.department}
          </p>
        </div>

        {faculty.phone || faculty.email ? (
          <div className="space-y-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            {faculty.phone && (
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-on-accent transition-colors"
                >
                  <Phone className="size-3" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="size-3" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => onCopy(faculty.phone!, `${faculty.name}'s phone`, phoneCopyKey)}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[rgba(209,199,189,0.7)] bg-white/80 px-2 py-1 text-[11px] font-semibold text-body hover:text-primary transition-colors cursor-pointer"
                  title="Copy phone"
                >
                  {copiedKey === phoneCopyKey ? (
                    <Check className="size-3 text-green-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{faculty.phone}</span>
                </button>
              </div>
            )}

            {faculty.email && (
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <a
                  href={`mailto:${faculty.email}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline truncate"
                >
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{faculty.email}</span>
                </a>

                <button
                  type="button"
                  onClick={() => onCopy(faculty.email!, `${faculty.name}'s email`, emailCopyKey)}
                  className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors cursor-pointer"
                  title="Copy email"
                >
                  {copiedKey === emailCopyKey ? (
                    <Check className="size-3 text-green-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <span className="text-[11px] text-muted italic">
              Available via Department Incharge Desk
            </span>
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}

function StudentLeadCard({
  student,
  copiedKey,
  onCopy,
}: {
  student: StudentLead;
  index?: number;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}) {
  const cleanPhone = student.phone.replace(/[^0-9]/g, '');
  const phoneKey = `student-phone-${student.name}`;
  const emailKey = `student-email-${student.name}`;

  return (
    <SpotlightCard className="h-full rounded-3xl">
      <div className="surface-raised rounded-3xl p-6 sm:p-7 border border-[rgba(209,199,189,0.75)] flex flex-col justify-between h-full space-y-5 shadow-sm hover:border-primary/40 transition-colors">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-black text-foreground">
              {student.name}
            </h3>
            <p className="text-xs font-bold text-primary mt-0.5">
              {student.title}
            </p>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Leading internal hackathon operations, team registration systems, and mentor matching for Smart India Hackathon 2026.
          </p>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-[rgba(209,199,189,0.6)]">
          {/* LinkedIn Button */}
          <a
            href={student.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-white hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg className="size-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>Connect on LinkedIn</span>
            </span>
            <ExternalLink className="size-3 text-muted" />
          </a>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-accent shadow-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Phone className="size-3.5" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-green-600/30 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Copyable Quick Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => onCopy(student.phone, `${student.name}'s phone`, phoneKey)}
              className="inline-flex items-center gap-1 text-caption text-muted hover:text-primary transition-colors cursor-pointer"
            >
              {copiedKey === phoneKey ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{student.phone}</span>
            </button>

            <button
              type="button"
              onClick={() => onCopy(student.email, `${student.name}'s email`, emailKey)}
              className="inline-flex items-center gap-1 text-caption text-muted hover:text-primary transition-colors cursor-pointer truncate max-w-[200px]"
            >
              {copiedKey === emailKey ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Mail className="size-3" />
              )}
              <span className="truncate">{student.email}</span>
            </button>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
