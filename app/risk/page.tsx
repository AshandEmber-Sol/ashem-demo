// /risk — no duplicated content. Redirects to the Risk Disclaimer section (Section 2)
// of the single Terms page. The URL fragment is preserved in the 307 Location header,
// so the browser scrolls to #risk-disclaimer on arrival.

import { redirect } from 'next/navigation';

export default function RiskPage() {
  redirect('/terms#risk-disclaimer');
}
