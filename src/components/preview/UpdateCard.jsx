const MOBILE = {
  cardBg: '#F2EBE3',
  textOnLight: '#2C2C2C',
  textOnLightSecondary: '#5A5A5A',
  textOnLightMuted: '#8A8A8A',
  gold: '#D8A657',
  forest: '#2D6A4F',
  borderLight: '#E0DAD2',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
  } catch (e) {
    return ''
  }
}

export default function UpdateCard({ title, body, publishedAt }) {
  const displayTitle = title || 'Untitled Update'
  // Strip markdown formatting for the preview body
  const plainBody = (body || '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\d+\.\s/g, '')
    .trim()

  return (
    <div
      style={{
        borderRadius: 12,
        background: MOBILE.cardBg,
        border: '1px solid ' + MOBILE.borderLight,
        overflow: 'hidden',
      }}
    >
      {/* Gold accent bar */}
      <div style={{ height: 4, background: MOBILE.gold }} />

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Header row: icon + title + heart */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: MOBILE.gold + '19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* Campaign / megaphone icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill={MOBILE.gold}>
              <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 3V6L5 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
            </svg>
          </div>
          <div style={{ flex: 1, marginLeft: 10 }}>
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
          </div>
          {/* Heart icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={MOBILE.textOnLightMuted}
            strokeWidth="1.5"
            style={{ flexShrink: 0, marginLeft: 8, marginTop: 2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>

        {/* Body preview (truncated to 4 lines) */}
        {plainBody && (
          <div
            style={{
              marginTop: 12,
              color: MOBILE.textOnLightSecondary,
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {plainBody}
          </div>
        )}

        {/* Date + Read more row */}
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              color: MOBILE.textOnLightMuted,
              fontSize: 11,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {formatDate(publishedAt)}
          </span>
          <span
            style={{
              color: MOBILE.forest,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {'Read more \u2192'}
          </span>
        </div>
      </div>
    </div>
  )
}
