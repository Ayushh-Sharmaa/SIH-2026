'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself.
 *
 * Because the root layout has failed, this must render its own <html> and
 * <body>, and it cannot rely on globals.css having been applied — so the
 * styling here is deliberately inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#EFE9E1',
          color: '#322D29',
          fontFamily: "Inter, ui-sans-serif, system-ui, 'Segoe UI', sans-serif",
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: '#72383D',
            }}
          >
            Application error
          </p>

          <h1
            style={{
              margin: '16px 0 0',
              fontSize: 'clamp(2rem, 1.5rem + 2vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '-0.032em',
              lineHeight: 1.08,
            }}
          >
            The application failed to load.
          </h1>

          <p
            style={{
              margin: '20px 0 0',
              fontSize: '17px',
              lineHeight: 1.6,
              color: '#514840',
            }}
          >
            Reloading usually clears this. If it persists, please contact the SIH cell at
            GL Bajaj.
          </p>

          {error.digest && (
            <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#877B6F' }}>
              Reference: {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '36px',
              border: 'none',
              borderRadius: '999px',
              backgroundColor: '#72383D',
              color: '#FBF7F4',
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload the application
          </button>
        </div>
      </body>
    </html>
  );
}
