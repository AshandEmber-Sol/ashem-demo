// Global site footer — rendered on every page via app/layout.tsx.
//
// Previously this markup lived inline at the bottom of app/page.tsx (home only). It was
// lifted here so the "Terms & Risk Disclaimer" link (and the social links) appear on
// every route, including /terms. The home page's inline <footer> was removed to avoid
// duplication.

import Link from 'next/link';
import { ExternalLink } from '@/components/ExternalLink';

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-16 pt-4 text-center sm:px-6">
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(234,88,12,0.2), transparent)' }}
      />
      <p className="text-xs leading-relaxed text-muted">
        This site is a Solana Devnet demo of the{' '}
        <span style={{ color: 'rgba(240,236,228,0.75)' }}>$ASHEM</span>{' '}token&apos;s Token-2022
        mechanics. The devnet tokens here have zero monetary value and no claim on any mainnet asset.
      </p>

      {/* Social / profile links + legal */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <ExternalLink site="x" href="https://x.com/ashembersol" className="text-xs text-muted">
          @ashembersol
        </ExternalLink>
        <ExternalLink site="github" href="https://github.com/AshandEmber-Sol" className="text-xs text-muted">
          AshandEmber-Sol
        </ExternalLink>
        <Link
          href="/terms"
          className="text-xs text-muted underline decoration-transparent underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
        >
          Terms &amp; Risk Disclaimer
        </Link>
      </div>

      <p className="mono text-xs" style={{ color: 'rgba(234,88,12,0.4)' }}>
        Built with Token-2022 · Solana Devnet · GitHub Actions
      </p>
    </footer>
  );
}
