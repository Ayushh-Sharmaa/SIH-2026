/**
 * WCAG 2.1 contrast validator for the SIH@GLBGOI design system.
 *
 *   node scripts/contrast.mjs
 *
 * Exits non-zero if any shipped text token falls below its required ratio, so
 * it can be wired into CI. Run after any change to the colour tokens in
 * src/styles/tokens.css.
 */

const hex = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = hex(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
/** Flatten a translucent foreground over an opaque background. */
const over = (fg, alpha, bg) => {
  const [r1, g1, b1] = hex(fg);
  const [r2, g2, b2] = hex(bg);
  const mix = (a, b) => Math.round(a * alpha + b * (1 - alpha));
  return (
    '#' +
    [mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
};

/** Surfaces text can land on. Card surfaces are white veils over the canvas. */
const SURFACES = {
  canvas: '#EFE9E1',
  raised: '#F6F2EC',
  pearl: '#D9D9D9',
  sand: '#D1C7BD',
};

/**
 * The shipped text tokens. `min` is the ratio each must clear: 4.5 for body
 * copy, 3.0 for large text and non-text UI. `only` restricts a token to the
 * surfaces it is sanctioned for.
 */
const TOKENS = [
  { name: 'text-foreground', hex: '#322D29', min: 4.5 },
  { name: 'text-body', hex: '#514840', min: 4.5 },
  { name: 'text-accent', hex: '#72383D', min: 4.5, skip: ['sand'] },
  { name: 'text-muted', hex: '#6F645B', min: 4.5, only: ['canvas', 'raised'] },
  { name: 'text-faint', hex: '#877B6F', min: 3.0, only: ['canvas', 'raised'] },
];

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
let failures = 0;

console.log('\n  SHIPPED TEXT TOKENS — WCAG 2.1\n');
process.stdout.write(pad('', 20));
for (const s of Object.keys(SURFACES)) process.stdout.write(pad(s, 16));
console.log('\n  ' + '─'.repeat(82));

for (const t of TOKENS) {
  process.stdout.write('  ' + pad(t.name, 18));
  for (const [sName, bg] of Object.entries(SURFACES)) {
    const applicable = (!t.only || t.only.includes(sName)) && !(t.skip || []).includes(sName);
    if (!applicable) {
      process.stdout.write(pad('—', 16));
      continue;
    }
    const r = ratio(t.hex, bg);
    const ok = r >= t.min;
    if (!ok) failures++;
    process.stdout.write(pad(r.toFixed(2) + (ok ? ' ok' : ' FAIL'), 16));
  }
  console.log('');
}

const onAccent = ratio('#FBF7F4', '#72383D');
console.log('\n  text-on-accent #FBF7F4 over accent #72383D → ' + onAccent.toFixed(2) + ':1');
if (onAccent < 4.5) failures++;

/**
 * Alpha-modified text is banned by the system. This section documents why, and
 * is the reference for the replacements still queued in page markup.
 */
console.log('\n  BANNED — alpha-modified text (flattened over canvas)\n');
const BANNED = [
  ['text-muted/80', '#6F645B', 0.8],
  ['text-muted/70', '#6F645B', 0.7],
  ['text-foreground/65', '#322D29', 0.65],
  ['text-foreground/60', '#322D29', 0.6],
  ['text-foreground/55', '#322D29', 0.55],
  ['text-foreground/50', '#322D29', 0.5],
];
for (const [label, fg, a] of BANNED) {
  const flat = over(fg, a, SURFACES.canvas);
  const r = ratio(flat, SURFACES.canvas);
  console.log(
    '  ' +
      pad(label, 22) +
      flat +
      '  ' +
      pad(r.toFixed(2) + ':1', 10) +
      (r >= 4.5 ? 'passes body' : r >= 3 ? 'large text only' : 'FAILS'),
  );
}

// The colour that started all this.
const clay = ratio('#AC9C8D', SURFACES.canvas);
console.log(
  '\n  #AC9C8D as text on canvas → ' + clay.toFixed(2) + ':1 — decoration only, never text.',
);

console.log('');
if (failures > 0) {
  console.error('  ' + failures + ' shipped token(s) below their required ratio.\n');
  process.exit(1);
}
console.log('  All shipped text tokens pass.\n');
