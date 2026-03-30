const MOBILE = {
  cardBg: '#F2EBE3',
  textOnLight: '#2C2C2C',
  textOnLightMuted: '#8A8A8A',
  gold: '#D8A657',
  rust: '#B85C3A',
  borderLight: '#E0DAD2',
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return mins + ':' + secs.toString().padStart(2, '0')
}

export default function VideoCard({ title, description, thumbnailUrl, duration }) {
  const displayTitle = title || 'Untitled Video'

  return (
    <div
      style={{
        borderRadius: 12,
        background: MOBILE.cardBg,
        border: `1px solid ${MOBILE.borderLight}`,
        overflow: 'hidden',
      }}
    >
      {/* Rust-to-gold gradient accent bar */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(to right, ${MOBILE.rust}, ${MOBILE.gold})`,
        }}
      />

      {/* Thumbnail area */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          position: 'relative',
          overflow: 'hidden',
          background: MOBILE.borderLight,
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A60" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Center play button overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.47)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </div>

        {/* Duration badge */}
        {duration > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              padding: '3px 7px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 4,
              color: '#fff',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: MOBILE.textOnLight,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.3,
              }}
            >
              {displayTitle}
            </div>
            {description && (
              <div
                style={{
                  marginTop: 4,
                  color: MOBILE.textOnLightMuted,
                  fontSize: 12,
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </div>
            )}
          </div>
          {/* Heart icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={MOBILE.textOnLightMuted}
            strokeWidth="1.5"
            style={{ marginLeft: 8, flexShrink: 0, marginTop: 2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
