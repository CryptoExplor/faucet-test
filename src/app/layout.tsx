
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Providers from './providers';
import { PassportProvider } from '@/lib/passport/Provider';

const VERCEL_URL = process.env.VERCEL_URL || 'localhost:9002';
const baseUrl = process.env.NEXT_PUBLIC_HOST ? process.env.NEXT_PUBLIC_HOST : `https://${VERCEL_URL}`;


export const metadata: Metadata = {
  title: 'Superchain Faucet',
  description: 'A multi-chain Superchain faucet for Sepolia testnets.',
  metadataBase: new URL(baseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <PassportProvider>
            {children}
          </PassportProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
