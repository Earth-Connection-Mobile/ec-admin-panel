export default function PhoneFrame({ children }) {
  return (
    <div
      style={{
        width: 280,
        height: 600,
        borderRadius: 40,
        border: '3px solid #333',
        background: '#EAEAEA',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        position: 'relative',
      }}
    >
      {/* Status bar / notch */}
      <div
        style={{
          height: 44,
          background: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
          9:41
        </span>
        {/* Notch */}
        <div
          style={{
            width: 80,
            height: 24,
            background: '#333',
            borderRadius: '0 0 16px 16px',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        {/* Status icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Signal bars */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#fff" />
            <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#fff" />
            <rect x="9" y="2" width="3" height="10" rx="0.5" fill="#fff" />
            <rect x="13" y="0" width="3" height="12" rx="0.5" fill="#fff" opacity="0.4" />
          </svg>
          {/* Battery */}
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke="#fff" strokeWidth="1" />
            <rect x="2" y="2" width="12" height="8" rx="1" fill="#fff" />
            <rect x="19.5" y="3.5" width="2" height="5" rx="1" fill="#fff" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 16,
        }}
      >
        {children}
      </div>

      {/* Home indicator bar */}
      <div
        style={{
          height: 28,
          background: '#EAEAEA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 100,
            height: 4,
            background: '#333',
            borderRadius: 2,
            opacity: 0.3,
          }}
        />
      </div>
    </div>
  )
}
