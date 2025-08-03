
import { headers } from 'next/headers';
import type { Metadata } from 'next';

// This function generates the metadata for the page, including Farcaster frame tags.
export async function generateMetadata(): Promise<Metadata> {
    const host = headers().get('host');
    const protocol = headers().get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const frameMetadata = {
        'fc:frame': 'vNext',
        'fc:frame:image': `${baseUrl}/frame-image.png`,
        'fc:frame:button:1': 'Claim Sepolia Testnet ETH',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `${baseUrl}`,
        'fc:frame:post_url': `${baseUrl}/api/frame`,
    };

    return {
        title: 'SepoliaDrop Faucet - Farcaster Frame',
        description: 'A multi-chain faucet for Sepolia testnets. Claim test ETH with Gitcoin Passport verification.',
        openGraph: {
            title: 'SepoliaDrop Faucet',
            description: 'A multi-chain faucet for Sepolia testnets.',
            images: [`${baseUrl}/frame-image.png`],
        },
        other: {
            ...frameMetadata,
        },
    };
}


// This is the page component that renders the fallback HTML for the frame.
export default function FramePage() {
    const host = headers().get('host');
    const protocol = headers().get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>SepoliaDrop Faucet - Farcaster Frame</title>
                <style>{`
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #F5EEFC;
                        margin: 0;
                        padding: 20px;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        background: white;
                        border-radius: 12px;
                        padding: 32px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                        max-width: 450px;
                        width: 100%;
                        border: 1px solid #EAE2F3;
                    }
                    .icon {
                        width: 64px;
                        height: 64px;
                        background: #9D4EDD;
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                        color: white;
                        font-size: 32px;
                    }
                    h1 {
                        color: #1a0a2e;
                        margin: 0 0 8px;
                        font-size: 28px;
                        font-weight: 700;
                    }
                    .subtitle {
                        color: #6c5f7e;
                        margin: 0 0 24px;
                        font-size: 16px;
                    }
                    .features {
                        text-align: left;
                        margin: 32px 0;
                        padding-left: 20px;
                    }
                    .feature {
                        display: flex;
                        align-items: center;
                        margin: 16px 0;
                        color: #3e2d53;
                        font-size: 16px;
                    }
                    .feature-icon {
                        width: 24px;
                        height: 24px;
                        background: #EE4266;
                        border-radius: 50%;
                        margin-right: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        color: white;
                        font-weight: bold;
                    }
                    .button {
                        background: #9D4EDD;
                        color: white;
                        padding: 14px 28px;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        margin-top: 24px;
                        transition: background-color 0.2s ease;
                    }
                    .button:hover {
                        background: #8e44cc;
                    }
                    .footer {
                        margin-top: 32px;
                        padding-top: 20px;
                        border-top: 1px solid #EAE2F3;
                        color: #8e809f;
                        font-size: 14px;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <div className="icon">💧</div>
                    <h1>SepoliaDrop</h1>
                    <p className="subtitle">A Multi-Chain Faucet for Sepolia Testnets</p>
                    
                    <div className="features">
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <span>0.01 ETH per claim</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <span>Gitcoin Passport verified</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <span>10 Sepolia testnets supported</span>
                        </div>
                         <div className="feature">
                            <div className="feature-icon">✓</div>
                            <span>24-hour rate limiting</span>
                        </div>
                    </div>
                    
                    <button className="button" onClick={() => window.open('${baseUrl}', '_blank')}>
                        Open Web App
                    </button>
                    
                    <div className="footer">
                        <small>Works in Farcaster as a Frame</small>
                    </div>
                </div>
            </body>
        </html>
    );
}

