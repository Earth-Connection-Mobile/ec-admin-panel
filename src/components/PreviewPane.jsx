import { useState, useEffect } from 'react'
import { usePreview } from '../lib/preview'
import PhoneFrame from './preview/PhoneFrame'
import PlaylistCard from './preview/PlaylistCard'
import VideoCard from './preview/VideoCard'
import UpdateCard from './preview/UpdateCard'

const STORAGE_KEY = 'ec-preview-open'

function getInitialOpen() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === 'true'
  } catch (e) {
    // localStorage unavailable
  }
  return true
}

export function PreviewToggle({ isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-[var(--ec-card-border)] bg-white px-3 py-2 text-sm font-medium font-body transition-colors hover:bg-gray-50"
      style={{ color: isOpen ? 'var(--ec-gold)' : 'var(--ec-text-secondary)' }}
      title={isOpen ? 'Hide preview' : 'Show preview'}
    >
      {/* Eye icon */}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {isOpen ? (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        )}
      </svg>
      Preview
    </button>
  )
}

export function usePreviewPaneState() {
  const [isOpen, setIsOpen] = useState(getInitialOpen)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    } catch (e) {
      // localStorage unavailable
    }
  }, [isOpen])

  return { isOpen, toggle: function() { setIsOpen(function(prev) { return !prev }) } }
}

export default function PreviewPane() {
  const { previewData } = usePreview()

  const handleRefreshTokens = function() {
    // Placeholder: will fetch design_tokens.json from GitHub API
    alert('Refresh Tokens: will fetch design_tokens.json from GitHub API (not yet wired)')
  }

  // Render preview content based on type
  var renderPreviewContent = function() {
    if (!previewData) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: 20,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8A8A"
            strokeWidth="1.5"
            style={{ marginBottom: 12, opacity: 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
          <span
            style={{
              color: '#8A8A8A',
              fontSize: 13,
              fontFamily: "'Libre Franklin', sans-serif",
            }}
          >
            Edit a playlist, video, or update to see the mobile preview.
          </span>
        </div>
      )
    }

    switch (previewData.type) {
      case 'playlist':
        return (
          <PlaylistCard
            title={previewData.data.title}
            description={previewData.data.description}
            phaseTag={previewData.data.phaseTag}
            coverArtUrl={previewData.data.coverArtUrl}
            trackCount={previewData.data.trackCount}
          />
        )
      case 'video':
        return (
          <VideoCard
            title={previewData.data.title}
            description={previewData.data.description}
            thumbnailUrl={previewData.data.thumbnailUrl}
            duration={previewData.data.duration}
          />
        )
      case 'update':
        return (
          <UpdateCard
            title={previewData.data.title}
            body={previewData.data.body}
            publishedAt={previewData.data.publishedAt}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className="hidden lg:flex flex-col items-center"
      style={{
        width: 320,
        flexShrink: 0,
        padding: '16px 16px 16px 0',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Refresh tokens button */}
      <button
        onClick={handleRefreshTokens}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--ec-card-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--ec-text-secondary)] font-body hover:bg-gray-50 hover:text-[var(--ec-gold)] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
        Refresh Tokens
      </button>

      {/* Phone frame */}
      <PhoneFrame>
        {/* Feed header inside the phone */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              color: '#2C2C2C',
              fontSize: 18,
              fontWeight: 300,
              letterSpacing: 1.2,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Feed
          </div>
          <div
            style={{
              width: 32,
              height: 3,
              background: '#D8A657',
              marginTop: 4,
              borderRadius: 1.5,
            }}
          />
        </div>
        {renderPreviewContent()}
      </PhoneFrame>
    </div>
  )
}
