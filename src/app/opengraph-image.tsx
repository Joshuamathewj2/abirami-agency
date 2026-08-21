import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Abirami Agency - Authorised Parryware Sanitaryware Dealers in Chennai';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#0c1a2e',
          position: 'relative',
          padding: '80px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Sky blue accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '12px',
            height: '630px',
            background: '#0091FF',
          }}
        />

        {/* Content Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '680px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 145, 255, 0.1)',
              border: '1.5px solid rgba(0, 145, 255, 0.2)',
              borderRadius: '100px',
              padding: '8px 20px',
              marginBottom: '28px',
              color: '#38bdf8',
              fontSize: '18px',
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            <span>Authorised Parryware Wholesaler</span>
          </div>

          {/* Business name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontSize: '84px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Abirami Agency
            </span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#38bdf8',
                lineHeight: 1.1,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '10px',
              }}
            >
              Parryware
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#94a3b8',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Premium Sanitaryware &amp; Bath Experiences at Wholesale Prices. Fast Delivery in Chennai.
          </div>
        </div>

        {/* Right side graphical representation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '280px',
            height: '280px',
            borderRadius: '40px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span
            style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 800,
              marginTop: '16px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            ABIRAMI
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
