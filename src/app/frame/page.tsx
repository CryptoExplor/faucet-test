
import type { Metadata } from 'next';
import FarcasterFrameClient from './client';

const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:9002';
const baseUrl = process.env.NEXT_PUBLIC_HOST || VERCEL_URL;

export const metadata: Metadata = {
  title: 'Superchain Faucet Frame',
  description: 'A Farcaster Frame for the Superchain Faucet',
  openGraph: {
    title: 'Superchain Faucet Frame',
    description: 'A Farcaster Frame for the Superchain Faucet',
    images: [`${baseUrl}/frame-image.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${baseUrl}/frame-image.png`,
    'fc:frame:button:1': 'Open Mini App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `${baseUrl}/`,
  },
};

export default function FarcasterFramePage() {
  return <FarcasterFrameClient />;
}
