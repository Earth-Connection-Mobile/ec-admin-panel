import { createContext, useContext, useState } from 'react'

const PreviewContext = createContext(null)

export function PreviewProvider({ children }) {
  const [previewData, setPreviewData] = useState(null)
  return (
    <PreviewContext.Provider value={{ previewData, setPreviewData }}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreview() {
  return useContext(PreviewContext)
}
