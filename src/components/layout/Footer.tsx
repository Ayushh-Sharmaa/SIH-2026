'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { m, type Variants } from 'framer-motion';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { EASE } from '@/components/motion/tokens';
import { Container, Modal, useToast } from '@/components/ui';
import { CONTACTS, Contact } from '@/config/contacts';

const LINK_GROUPS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Problem Tracks', href: '/tracks' },
      { label: 'Browse Teammates', href: '/team-formation/browse-teammates' },
      { label: 'Browse Teams', href: '/team-formation/browse-teams' },
      { label: 'Browse Mentors', href: '/team-formation/browse-mentors' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Get Started',
    links: [
      { label: 'Create Account', href: '/login' },
      { label: 'Sign In', href: '/login' },
      { label: 'Build a Team', href: '/team-formation/create-team' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Top 50 Projects (Last Year)', href: 'https://docs.google.com/spreadsheets/d/1GjTmrLD_gnBtdqy7vNJiGcsjQ5cZuKRs3EWpa88zJUk/edit?usp=sharing' },
      { label: 'Winning Playbook', href: 'https://app.notion.com/p/Smart-India-Hackathon-Winning-Playbook-from-Ex-Google-Microsoft-EY-SIH-Hackathon-accelerator-Winn-3b417556013080bf8499c9d348a1f206?source=copy_link' },
    ],
  },
];

const SOCIALS = [
  {
    label: 'Website',
    href: 'https://www.glbajajgroup.org',
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.7 3.8 6.3 3.8 10S14.5 19.3 12 22m0-20C9.5 4.7 8.2 8.3 8.2 12S9.5 19.3 12 22M2.5 9h19M2.5 15h19',
  },
  {
    label: 'Email',
    href: 'mailto:iic@glbajajgroup.org',
    path: 'M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Zm0 .5 9 6 9-6',
  },
];

const cardVariants: Variants = {
  initial: { y: 0, scale: 1, boxShadow: 'none' },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 8px 30px rgba(114, 56, 61, 0.06)',
    transition: { duration: 0.25, ease: 'easeOut' }
  }
};

const arrowVariants: Variants = {
  initial: { x: 0 },
  hover: {
    x: 4,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

export default function Footer() {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard!`, 'success');
  };

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[rgba(209,199,189,0.6)] bg-gradient-to-b from-[rgba(217,217,217,0.35)] to-[rgba(239,233,225,0.95)]">
      {/* Floating glow anchored to the footer's top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[52rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(172,156,141,0.32),transparent_68%)] blur-2xl"
      />

      <Container width="wide" className="relative pb-10 pt-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.5fr]">
          <Reveal direction="up">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/60 p-1.5">
                <Image
                  src="/Logo/GL-BAJAJ-LOGO-3.png"
                  alt="GL Bajaj Group of Institutions"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-gradient-luxe text-lg font-extrabold tracking-tight">
                  SIH@GLBGOI
                </span>
                <span className="mt-1.5 text-label uppercase text-muted">
                  Powered by NexaSphere
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              The official Smart India Hackathon internal portal of GL Bajaj Group of
              Institutions, Mathura — where teams form, mentors connect, and ideas take flight.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((s) => (
                <m.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3, scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.25, ease: EASE.outExpo }}
                  className="flex size-10 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/50 text-muted transition-colors duration-250 hover:border-[rgba(114,56,61,0.3)] hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
                    <path
                      d={s.path}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </m.a>
              ))}
            </div>
          </Reveal>

          {LINK_GROUPS.map((group, i) => (
            <RevealGroup key={group.title} delay={0.08 * (i + 1)} stagger={0.05}>
              <RevealItem>
                <h2 className="text-label uppercase text-body">
                  {group.title}
                </h2>
              </RevealItem>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <RevealItem key={link.href} as="li">
                    <Link
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-250 hover:text-primary"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="size-3 -translate-x-1 opacity-0 transition-all duration-250 group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </RevealItem>
                ))}
              </ul>
            </RevealGroup>
          ))}
        </div>

        {/* Behind the Build Section */}
        <Reveal direction="up" delay={0.05} className="mt-16 border-t border-[rgba(209,199,189,0.55)] pt-12 pb-2">
          <div className="grid gap-8 lg:grid-cols-[1fr_2.5fr] items-start">
            <div>
              <h3 className="text-gradient-luxe text-xl font-extrabold tracking-tight">
                Behind the Build
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted max-w-sm">
                Have a question about SIH, found an issue, or need help with the portal? Get in touch with the student leads or view the institutional coordinator directory.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors duration-250 hover:underline"
              >
                <span>View Full Contact Directory</span>
                <svg viewBox="0 0 24 24" fill="none" className="size-3">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACTS.map((contact) => (
                <m.button
                  key={contact.name}
                  onClick={() => setSelectedContact(contact)}
                  variants={cardVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-start rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-5 text-left transition-colors duration-250 hover:bg-white/80 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <span className="text-label uppercase text-primary font-bold">
                    {contact.role}
                  </span>
                  <span className="mt-1 text-base font-bold text-foreground">
                    {contact.name}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted font-medium hover:text-primary">
                    View Contact Info
                    <m.span variants={arrowVariants} className="inline-flex">
                      <svg viewBox="0 0 24 24" fill="none" className="size-3">
                        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </m.span>
                  </span>
                </m.button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.1} className="mt-14">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(172,156,141,0.55)] to-transparent" />
          <div className="flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row">
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} GL Bajaj Group of Institutions, Mathura.
            </p>
            <p className="text-label uppercase text-muted">
              Crafted by NexaSphere
            </p>
          </div>
        </Reveal>
      </Container>

      {/* Coordinator Contact Modal */}
      <Modal
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="SIH Coordinator Contact"
        size="sm"
      >
        {selectedContact && (
          <div className="flex flex-col gap-5 py-2">
            <div className="rounded-xl bg-gradient-to-br from-[rgba(239,233,225,0.7)] to-[rgba(217,217,217,0.3)] p-4 border border-[rgba(209,199,189,0.5)]">
              <h4 className="text-lg font-extrabold text-foreground">{selectedContact.name}</h4>
              <p className="text-xs uppercase font-medium text-primary mt-1 tracking-wider">{selectedContact.role}</p>
            </div>

            <div className="space-y-3.5">
              {/* LinkedIn Button */}
              <m.a
                href={selectedContact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-between rounded-xl border border-[rgba(209,199,189,0.7)] bg-white p-3.5 text-sm text-foreground transition-all hover:bg-slate-50 hover:border-primary/30 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <svg className="size-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span className="font-semibold">Connect on LinkedIn</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" className="size-4 text-muted">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </m.a>

              {/* Email Section */}
              <div className="flex gap-2">
                <m.a
                  href={`mailto:${selectedContact.email}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.7)] bg-white p-3.5 text-sm text-foreground hover:bg-slate-50 transition-all cursor-pointer overflow-hidden"
                >
                  <svg className="size-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted">Email</span>
                    <span className="font-semibold text-xs mt-0.5 truncate w-full">
                      {selectedContact.email}
                    </span>
                  </div>
                </m.a>
                <m.button
                  onClick={() => handleCopy(selectedContact.email, 'Email')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Copy email to clipboard"
                  className="flex items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-white px-4 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <svg className="size-5 text-muted hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                  </svg>
                </m.button>
              </div>

              {/* WhatsApp Section */}
              <div className="flex gap-2">
                <m.a
                  href={`https://wa.me/${selectedContact.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.7)] bg-white p-3.5 text-sm text-foreground hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <svg className="size-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.001 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.908c0 1.748.458 3.45 1.321 4.956L2 22l5.251-1.378a9.837 9.837 0 0 0 4.732 1.207h.004c5.454 0 9.901-4.449 9.906-9.909a9.847 9.847 0 0 0-2.892-7.012zm-7.009 15.281a8.12 8.12 0 0 1-4.148-1.139l-.298-.177-3.087.81.825-3.012-.194-.308a8.145 8.145 0 0 1-1.247-4.355c0-4.49 3.655-8.145 8.148-8.145 2.173 0 4.217.846 5.753 2.385a8.093 8.093 0 0 1 2.386 5.766c-.005 4.493-3.66 8.147-8.138 8.147zm4.469-6.104c-.245-.122-1.447-.714-1.67-.796-.223-.081-.385-.122-.547.122-.162.244-.629.796-.771.959-.142.162-.284.183-.529.061-.244-.122-1.03-.379-1.961-1.21-.724-.647-1.213-1.447-1.355-1.69-.142-.244-.015-.376.107-.497.111-.11.244-.284.365-.427.122-.142.162-.244.244-.407.081-.162.041-.305-.02-.427-.061-.122-.547-1.32-.75-1.808-.198-.477-.398-.413-.547-.421-.142-.008-.305-.008-.467-.008a.895.895 0 0 0-.649.305c-.223.244-.852.833-.852 2.031 0 1.198.873 2.356.995 2.518.122.162 1.717 2.622 4.16 3.673.581.25 1.035.4 1.388.513.585.186 1.116.16 1.536.097.469-.07 1.447-.591 1.65-1.163.203-.572.203-1.062.142-1.163-.06-.102-.223-.163-.468-.285z"/>
                  </svg>
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted">WhatsApp / Phone</span>
                    <span className="font-semibold text-xs mt-0.5 truncate w-full">
                      {selectedContact.phone}
                    </span>
                  </div>
                </m.a>
                <m.button
                  onClick={() => handleCopy(selectedContact.phone, 'Phone number')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Copy phone number to clipboard"
                  className="flex items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-white px-4 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <svg className="size-5 text-muted hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                  </svg>
                </m.button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </footer>
  );
}
