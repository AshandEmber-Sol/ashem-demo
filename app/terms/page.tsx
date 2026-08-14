// /terms — Terms of Use, Safety Guide & Risk Disclaimer.
//
// SINGLE SOURCE OF TRUTH: the text is NOT written by hand here. It's rendered from
// content/terms-and-risk-disclaimer.md, which is a verbatim copy of the canonical,
// legally-reviewed document at:
//   AshandEmber-Sol/-ASHEM · docs/TERMS-AND-RISK-DISCLAIMER.md
// To update: replace that .md (copy it over from -ASHEM) and bump the version/date line
// at the top of the document. No code changes needed — the page re-renders the markdown.
//
// The file is read at build time, so /terms is a static page (no runtime fetch).
// /risk redirects here to #risk-disclaimer (see app/risk/page.tsx).

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Risk Disclaimer — $ASHEM',
  description:
    'Terms of Use, Safety Guide and Risk Disclaimer for $ASHEM. Informational only — not financial advice.',
};

const source = fs.readFileSync(
  path.join(process.cwd(), 'content/terms-and-risk-disclaimer.md'),
  'utf8',
);

// Flatten React children to plain text (to derive stable heading ids).
function textOf(node: React.ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
}

// "2. Risk Disclaimer" -> "risk-disclaimer"  (drops the leading section number so
// /risk can link to #risk-disclaimer with a clean, stable anchor).
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <a
        href="/"
        className="mb-10 inline-block text-sm text-muted transition-colors hover:text-accent"
      >
        ← Back to the dApp
      </a>

      <article className="terms-doc">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1
                id={slugify(textOf(children))}
                className="scroll-mt-24 text-2xl font-bold tracking-tight text-text sm:text-3xl"
              >
                {children}
              </h1>
            ),
            // Section headings stay neutral (accent is reserved for brand/action, per the
            // design system) — hierarchy comes from the top border + weight, not color.
            h2: ({ children }) => (
              <h2
                id={slugify(textOf(children))}
                className="scroll-mt-24 mt-12 border-t border-edge pt-10 text-xl font-semibold text-text sm:text-2xl"
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                id={slugify(textOf(children))}
                className="scroll-mt-24 mt-8 text-base font-semibold text-text"
              >
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mt-4 leading-relaxed text-text/85">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-text/85 marker:text-accent/60">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mt-4 list-decimal space-y-2 pl-6 text-text/85 marker:text-muted">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold text-text">{children}</strong>
            ),
            a: ({ href, children }) => {
              const external = !!href && /^https?:\/\//.test(href);
              return (
                <a
                  href={href}
                  className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {children}
                </a>
              );
            },
            code: ({ children }) => (
              <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[0.85em] text-text">
                {children}
              </code>
            ),
            hr: () => <hr className="mt-10 border-edge" />,
            input: (props) => (
              // GFM task-list checkboxes (- [x]); render disabled, tinted with the accent.
              <input {...props} disabled readOnly className="mr-2 accent-[var(--accent)]" />
            ),
            table: ({ children }) => (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm text-text/85">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-edge px-3 py-2 text-left font-semibold text-text">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-edge px-3 py-2 align-top">{children}</td>
            ),
          }}
        >
          {source}
        </ReactMarkdown>
      </article>
    </main>
  );
}
