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
  Users,
  ArrowUpRight,
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

function LinkedInIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 fill-current`} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const CATEGORIES = [
  { id: 'all', label: 'All Contacts' },
  { id: 'spoc', label: 'SIH SPOC' },
  { id: 'faculty', label: 'Faculty Coordinators' },
  { id: 'students', label: 'Student Coordinators & Leads' },
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
                  Connect with the Single Point of Contact (SPOC), department faculty coordinators, and student platform leads at GL Bajaj Group of Institutions for internal evaluations, problem statements, and mentorship guidance.
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

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {spocContact.phone && (
                      <div className="flex items-center gap-2 rounded-2xl border border-[rgba(209,199,189,0.85)] bg-white/80 p-2 shadow-xs">
                        <span className="font-mono text-sm font-bold text-foreground px-3">
                          {spocContact.phone}
                        </span>
                        <a
                          href={`tel:${cleanPhone(spocContact.phone)}`}
                          className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-accent transition-transform hover:scale-105"
                          title="Call SPOC"
                        >
                          <Phone className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(spocContact.phone!, 'Phone number', 'spoc-phone')}
                          className="flex size-9 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-white text-body hover:text-primary transition-colors"
                          title="Copy phone"
                        >
                          {copiedKey === 'spoc-phone' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                    )}

                    {spocContact.email && (
                      <a
                        href={`mailto:${spocContact.email}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                      >
                        <Mail className="size-4" />
                        <span>Email SPOC</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* ── 2. DEPARTMENT FACULTY COORDINATORS ── */}
          {showFaculty && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[rgba(209,199,189,0.7)] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <GraduationCap className="size-4" />
                    <span>Department Mentors</span>
                  </div>
                  <h2 className="text-heading text-foreground font-black tracking-tight mt-1">
                    Department Faculty Coordinators
                  </h2>
                </div>
                <p className="text-xs text-muted max-w-md sm:text-right">
                  Reach out to your department faculty coordinator for internal verification, review rounds, and problem statement mapping.
                </p>
              </div>

              {/* MBA Coordinator */}
              {mbaContacts.filter(matchesQuery).length > 0 && (
                <div className="space-y-4">
                  <span className="inline-block text-[11px] font-black uppercase tracking-[0.14em] text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-3 py-1 rounded-full">
                    Department of Management Studies (MBA)
                  </span>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {mbaContacts.filter(matchesQuery).map((fc) => (
                      <FacultyCard key={fc.name} contact={fc} copiedKey={copiedKey} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}

              {/* BTech 3rd & 4th Year Coordinators */}
              {btechSeniorContacts.filter(matchesQuery).length > 0 && (
                <div className="space-y-4">
                  <span className="inline-block text-[11px] font-black uppercase tracking-[0.14em] text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-3 py-1 rounded-full">
                    B.Tech 3rd &amp; 4th Year (CSE &amp; Allied Branches)
                  </span>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {btechSeniorContacts.filter(matchesQuery).map((fc) => (
                      <FacultyCard key={fc.name} contact={fc} copiedKey={copiedKey} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}

              {/* BTech 2nd Year Coordinators */}
              {btechJuniorContacts.filter(matchesQuery).length > 0 && (
                <div className="space-y-4">
                  <span className="inline-block text-[11px] font-black uppercase tracking-[0.14em] text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-3 py-1 rounded-full">
                    B.Tech 2nd Year (CSE &amp; Allied Branches)
                  </span>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {btechJuniorContacts.filter(matchesQuery).map((fc) => (
                      <FacultyCard key={fc.name} contact={fc} copiedKey={copiedKey} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. STUDENT TECHNICAL LEADS & COORDINATORS ── */}
          {showStudents && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[rgba(209,199,189,0.7)] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <UserCheck className="size-4" />
                    <span>Technical Architecture &amp; Operations</span>
                  </div>
                  <h2 className="text-heading text-foreground font-black tracking-tight mt-1">
                    Student Coordinators &amp; Platform Leads
                  </h2>
                </div>
                <p className="text-xs text-muted max-w-md sm:text-right">
                  Get in touch for platform bug reports, portal onboarding, password/login assistance, team formation queries, or technical guidance.
                </p>
              </div>

              <RevealGroup className="grid gap-6 sm:grid-cols-2" stagger={0.1}>
                {filteredStudents.map((lead) => (
                  <RevealItem key={lead.name}>
                    <SpotlightCard className="h-full rounded-3xl" intensity={0.18}>
                      <div className="surface-raised rounded-3xl p-7 h-full flex flex-col justify-between border border-[rgba(209,199,189,0.7)] shadow-e2 hover:shadow-e4 transition-all duration-300">
                        <div className="space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-2.5 py-0.5 rounded-full">
                                {lead.title}
                              </span>
                              <h3 className="text-2xl font-black text-foreground mt-2 tracking-tight">
                                {lead.name}
                              </h3>
                              <p className="text-xs font-semibold text-muted">
                                {lead.role} · GL Bajaj Group of Institutions
                              </p>
                            </div>

                            <a
                              href={lead.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex size-10 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-white/70 text-primary hover:bg-primary/10 transition-transform hover:scale-105"
                              title="LinkedIn Profile"
                            >
                              <LinkedInIcon className="size-4" />
                            </a>
                          </div>

                          <div className="space-y-2 pt-2 text-xs border-t border-[rgba(209,199,189,0.4)]">
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/60 border border-[rgba(209,199,189,0.5)]">
                              <span className="flex items-center gap-2 font-mono text-foreground font-bold">
                                <Phone className="size-3.5 text-primary" />
                                {lead.phone}
                              </span>
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${cleanPhone(lead.phone)}`}
                                  className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                                >
                                  Call
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhone(lead.phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1"
                                >
                                  <MessageCircle className="size-3" />
                                  <span>WhatsApp</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(lead.phone, `${lead.name}'s phone`, `lead-phone-${lead.name}`)}
                                  className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white px-2 py-1 text-[11px] font-bold text-body hover:text-foreground transition-colors"
                                >
                                  {copiedKey === `lead-phone-${lead.name}` ? <Check className="size-3 text-emerald-600" /> : 'Copy'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/60 border border-[rgba(209,199,189,0.5)]">
                              <span className="flex items-center gap-2 text-foreground font-medium truncate">
                                <Mail className="size-3.5 text-primary shrink-0" />
                                <span className="truncate">{lead.email}</span>
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                                >
                                  Email
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(lead.email, `${lead.name}'s email`, `lead-email-${lead.name}`)}
                                  className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white px-2 py-1 text-[11px] font-bold text-body hover:text-foreground transition-colors"
                                >
                                  {copiedKey === `lead-email-${lead.name}` ? <Check className="size-3 text-emerald-600" /> : 'Copy'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[rgba(209,199,189,0.4)] flex items-center justify-between text-xs">
                          <a
                            href={lead.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                          >
                            <LinkedInIcon className="size-3.5" />
                            <span>Connect on LinkedIn</span>
                            <ArrowUpRight className="size-3" />
                          </a>
                          <span className="text-[10px] text-muted uppercase font-bold">NexaSphere Core</span>
                        </div>
                      </div>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          )}

          {/* ── 4. CAMPUS LOCATION & HELPDESK ── */}
          {showLocation && (
            <div className="grid gap-6 md:grid-cols-2">
              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-7 border border-[rgba(209,199,189,0.7)] space-y-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                      <MapPin className="size-4" />
                      <span>Campus Helpdesk Location</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      GL Bajaj Group of Institutions
                    </h3>
                    <p className="text-xs text-muted mt-1 font-semibold">
                      NH# 19, Mathura-Delhi Road, PO-Chaumuhan, Mathura, UP - 281406
                    </p>
                    <p className="text-xs text-body mt-3 leading-relaxed">
                      For offline registration inquiries, physical team workspace access, and hardware project labs, visit the SIH Technical Operations Room in the Academic Block.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[rgba(209,199,189,0.4)] flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">Lab Timing</span>
                    <span className="font-bold text-primary">09:00 AM – 05:00 PM IST</span>
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-7 border border-[rgba(209,199,189,0.7)] space-y-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                      <Building className="size-4" />
                      <span>Behind the Build</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      Engineered by NexaSphere
                    </h3>
                    <p className="text-xs text-muted mt-1 font-semibold">
                      Autonomous Developer Tools &amp; Student Hackathon Portals
                    </p>
                    <p className="text-xs text-body mt-3 leading-relaxed">
                      The SIH@GLBGOI platform was engineered by NexaSphere to automate team matching, mentor oversight, and progressive registrations for GL Bajaj.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[rgba(209,199,189,0.4)] flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">Supported By</span>
                    <span className="font-bold text-foreground">GLBGOI Mathura</span>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function FacultyCard({
  contact,
  copiedKey,
  onCopy,
}: {
  contact: FacultyContact;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}) {
  const cleanPhone = (phone?: string) => (phone ? phone.replace(/[^0-9]/g, '') : '');

  return (
    <SpotlightCard className="h-full rounded-3xl" intensity={0.14}>
      <div className="surface-raised rounded-3xl p-6 h-full flex flex-col justify-between border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-2xl bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] flex items-center justify-center text-primary font-black text-sm shrink-0">
              {contact.name.replace(/^(Dr\.|Mr\.|Ms\.|Er\.)\s*/, '')[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-foreground truncate">{contact.name}</h3>
              <p className="text-xs font-semibold text-primary">{contact.role}</p>
              <p className="text-[11px] text-muted truncate mt-0.5">{contact.department}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[rgba(209,199,189,0.4)]">
            {contact.phone && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/60 border border-[rgba(209,199,189,0.5)]">
                <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  {contact.phone}
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${cleanPhone(contact.phone)}`}
                    className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Call
                  </a>
                  <button
                    type="button"
                    onClick={() => onCopy(contact.phone!, `${contact.name}'s phone`, `faculty-phone-${contact.name}`)}
                    className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white px-2 py-0.5 text-[10px] font-bold text-body hover:text-foreground transition-colors"
                  >
                    {copiedKey === `faculty-phone-${contact.name}` ? <Check className="size-3 text-emerald-600" /> : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/60 border border-[rgba(209,199,189,0.5)]">
                <span className="text-xs font-medium text-foreground truncate flex items-center gap-1.5 min-w-0">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`mailto:${contact.email}`}
                    className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Email
                  </a>
                  <button
                    type="button"
                    onClick={() => onCopy(contact.email!, `${contact.name}'s email`, `faculty-email-${contact.name}`)}
                    className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white px-2 py-0.5 text-[10px] font-bold text-body hover:text-foreground transition-colors"
                  >
                    {copiedKey === `faculty-email-${contact.name}` ? <Check className="size-3 text-emerald-600" /> : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(209,199,189,0.35)] flex items-center justify-between text-[10px] text-muted font-semibold">
          <span>{contact.designation}</span>
          <span>GLBGOI</span>
        </div>
      </div>
    </SpotlightCard>
  );
}
