
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const manifest = {
    // The accountAssociation object is commented out as it requires offline generation
    // of a signature. You will need to generate this using Farcaster developer tools
    // and add it to your environment variables for production.
    // accountAssociation: {
    //   token: process.env.FARCASTER_ASSOCIATION_TOKEN,
    //   signature: process.env.FARCASTER_ASSOCIATION_SIGNATURE,
    // },
    miniapp: {
      version: 'vNext',
      name: 'Superchain Faucet',
      iconUrl: `${baseUrl}/icon.svg`,
      splashImageUrl: `${baseUrl}/splash.svg`,
      homeUrl: `${baseUrl}/frame`,
      webhookUrl: null,
      description: 'A multi-chain faucet for Sepolia testnets. Claim test ETH with Gitcoin Passport verification.',
      theme: {
        backgroundColor: '#F5EEFC',
      },
    },
  };

  return NextResponse.json(manifest);
}
