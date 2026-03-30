import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Playlists from './pages/Playlists'
import PlaylistEdit from './pages/PlaylistEdit'
import Videos from './pages/Videos'
import VideoEdit from './pages/VideoEdit'
import Updates from './pages/Updates'
import UpdateEdit from './pages/UpdateEdit'
import Members from './pages/Members'

function ProtectedRoute({ children }) {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ec-bg">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-ec-text-secondary font-body">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists/new"
            element={
              <ProtectedRoute>
                <PlaylistEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists/:id"
            element={
              <ProtectedRoute>
                <PlaylistEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <Videos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos/new"
            element={
              <ProtectedRoute>
                <VideoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos/:id"
            element={
              <ProtectedRoute>
                <VideoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updates"
            element={
              <ProtectedRoute>
                <Updates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updates/new"
            element={
              <ProtectedRoute>
                <UpdateEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updates/:id"
            element={
              <ProtectedRoute>
                <UpdateEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
