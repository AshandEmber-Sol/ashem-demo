import type { Metadata } from 'next'
import Hearth from '@/components/hearth/Hearth'

export const metadata: Metadata = {
  title: 'The Hearth — $ASHEM',
  description:
    'The live pulse of $ASHEM: how close the burn is to its endgame, burns as they happen, and the community verifying — all on-chain.',
}

export default function Page() {
  return <Hearth />
}
