const MOBILE = {
  cardBg: '#F2EBE3',
  textOnLight: '#2C2C2C',
  textOnLightSecondary: '#5A5A5A',
  textOnLightMuted: '#8A8A8A',
  gold: '#D8A657',
  forest: '#2D6A4F',
  borderLight: '#E0DAD2',
}

const PHASE_LABELS = {
  preparation: 'Preparation',
  ceremony_night: 'Ceremony Night',
  integration: 'Integration',
}

export default function PlaylistCard({ title, description, phaseTag, coverArtUrl, trackCount }) {
  const phaseLabel = PHASE_LABELS[phaseTag] || phaseTag || 'Preparation'
  const displayTitle = title || 'Untitled Playlist'

  return (
    <div
      style={{
        borderRadius: 12,
        background: MOBILE.cardBg,
        border: `1px solid ${MOBILE.borderLight}`,
        overflow: 'hidden',
      }}
    >
      {/* Green-to-gold gradient accent bar */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(to right, ${MOBILE.forest}, ${MOBILE.gold})`,
        }}
      />

      {/* Cover art */}
      {coverArtUrl ? (
        <div style={{ width: '100%', aspectRatio: '2.2', overflow: 'hidden' }}>
          <img
            src={coverArtUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '2.2',
            background: MOBILE.borderLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={MOBILE.textOnLightMuted} strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Phase tag badge */}
            <span
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                background: `${MOBILE.forest}1A`,
                borderRadius: 12,
                color: MOBILE.forest,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {phaseLabel}
            </span>

            {/* Title */}
            <div
              style={{
                marginTop: 10,
                color: MOBILE.textOnLight,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.3,
              }}
            >
              {displayTitle}
            </div>

            {/* Track count */}
            <div
              style={{
                marginTop: 4,
                color: MOBILE.textOnLightMuted,
                fontSize: 12,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {trackCount != null ? trackCount : 0} tracks
            </div>
          </div>

          {/* Play button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, paddingTop: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: MOBILE.gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1510">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>

            {/* Heart icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={MOBILE.textOnLightMuted}
              strokeWidth="1.5"
              style={{ marginLeft: 2 }}
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
    </div>
  )
}
