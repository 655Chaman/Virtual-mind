'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ backgroundColor: '#060606', color: '#ededed', padding: '20px', fontFamily: 'monospace', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 9999999 }}>
      <h2 style={{ color: '#EF4444', fontSize: '24px' }}>REACT RENDER ERROR</h2>
      <p style={{ color: '#888', marginTop: '10px' }}>The Next.js React application crashed.</p>
      <pre style={{ 
        color: '#ffaaaa', 
        backgroundColor: '#222', 
        padding: '10px', 
        borderRadius: '5px', 
        overflow: 'auto',
        marginTop: '20px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        fontSize: '12px'
      }}>
        {error.message || 'Unknown error occurred'}
        {'\n\n'}
        {error.stack || ''}
      </pre>
      <button 
        onClick={() => reset()}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#C9A84C',
          color: '#060606',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}
      >
        REBOOT
      </button>
    </div>
  );
}
