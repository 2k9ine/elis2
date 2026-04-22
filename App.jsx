import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Header from './components/layout/Header';

// Pages
const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const StudentList = lazy(() => import('./pages/Students/StudentList'));
const StudentForm = lazy(() => import('./pages/Students/StudentForm'));
const StudentProfile = lazy(() => import('./pages/StudentProfile/StudentProfile'));
const Attendance = lazy(() => import('./pages/Attendance/Attendance'));
const AttendanceHistory = lazy(() => import('./pages/Attendance/AttendanceHistory'));
const Fees = lazy(() => import('./pages/Fees/Fees'));
const Teachers = lazy(() => import('./pages/Teachers/Teachers'));
const Trinity = lazy(() => import('./pages/Trinity/Trinity'));
const Assessments = lazy(() => import('./pages/Assessments/Assessments'));
const Events = lazy(() => import('./pages/Events/Events'));
const EventDetail = lazy(() => import('./pages/Events/EventDetail'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const WhatsApp = lazy(() => import('./pages/WhatsApp/WhatsApp'));

import './styles/index.css';

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 pb-20 lg:pb-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
              <p className="text-text-secondary font-medium animate-pulse">Loading...</p>
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Dashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <StudentList />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students/new"
                element={
                  <ProtectedRoute adminOnly>
                    <AuthenticatedLayout>
                      <StudentForm />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students/:id"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <StudentProfile />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students/:id/edit"
                element={
                  <ProtectedRoute adminOnly>
                    <AuthenticatedLayout>
                      <StudentForm />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Attendance />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/attendance/history"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <AttendanceHistory />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/fees"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Fees />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teachers"
                element={
                  <ProtectedRoute adminOnly>
                    <AuthenticatedLayout>
                      <Teachers />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/trinity"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Trinity />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/assessments"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Assessments />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Events />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <EventDetail />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute adminOnly>
                    <AuthenticatedLayout>
                      <WhatsApp />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute adminOnly>
                    <AuthenticatedLayout>
                      <Reports />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />

              {/* Redirect any unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
