/**
 * Generates the Tailwind `@theme` block in global.css from the tokens in this folder.
 *
 * Tailwind 4 defines its theme in CSS rather than a JavaScript config (ADR-20), which would
 * normally mean hand-writing hex values into a stylesheet and letting them drift from the
 * app's own constants. This script removes that risk: `src/theme/` stays the single source
 * of truth and the stylesheet is derived from it.
 *
 * Run it after changing any token:
 *
 *   node src/theme/build-css.mjs
 *
 * Node 22.6+ strips the types off the .ts imports natively, so this needs no build step and
 * no extra dependency. Two details are deliberate:
 *
 *   - This file is .mjs, not .ts, so it stays outside the tsconfig `include` globs and does
 *     not drag a `@types/node` dependency into the app for the sake of a build script.
 *   - Its imports carry explicit .ts extensions because Node does not do extensionless
 *     resolution. Only modules with no relative imports of their own are pulled in, so the
 *     extension convention does not leak into application code.
 *
 * Everything between the BEGIN and END markers in global.css is overwritten; edit the
 * tokens, never the generated block.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colors } from './colors.ts';
import { radius } from './radius.ts';
import { spacing } from './spacing.ts';
import { fontFamily, fontSize, lineHeight } from './typography.ts';

const BEGIN = '/* BEGIN generated theme — produced by src/theme/build-css.mjs. Do not edit. */';
const END = '/* END generated theme */';

const kebab = (value) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function buildTheme() {
  const lines = ['@theme {', '  /* colours */'];

  for (const [name, value] of Object.entries(colors)) {
    lines.push(`  --color-${kebab(name)}: ${value};`);
  }

  lines.push('', '  /* spacing */');
  for (const [name, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${name}: ${value}px;`);
  }

  lines.push('', '  /* radius */');
  for (const [name, value] of Object.entries(radius)) {
    lines.push(`  --radius-${name}: ${value}px;`);
  }

  lines.push('', '  /* type */');
  for (const [name, value] of Object.entries(fontFamily)) {
    lines.push(`  --font-${kebab(name)}: ${value};`);
  }
  for (const [name, value] of Object.entries(fontSize)) {
    lines.push(`  --text-${kebab(name)}: ${value}px;`);
    lines.push(`  --text-${kebab(name)}--line-height: ${lineHeight[name]}px;`);
  }

  lines.push('}');
  return lines.join('\n');
}

const cssPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../global.css');
const current = readFileSync(cssPath, 'utf8');
const block = `${BEGIN}\n${buildTheme()}\n${END}`;

const beginAt = current.indexOf(BEGIN);
const endAt = current.indexOf(END);

const next =
  beginAt !== -1 && endAt !== -1
    ? `${current.slice(0, beginAt)}${block}${current.slice(endAt + END.length)}`
    : `${current.trimEnd()}\n\n${block}\n`;

if (next === current) {
  console.log('global.css already up to date');
} else {
  writeFileSync(cssPath, next, 'utf8');
  console.log(`global.css theme block written (${Object.keys(colors).length} colours)`);
}
