import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./AuthContext";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

// Lazy Load Pages
const LandingPageWithLogout = React.lazy(() => import("./pages/LandingPageWithLogout"));
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const PageTVDisplay = React.lazy(() => import("./pages/public/PageTVDisplay"));
const PageForgotPassword = React.lazy(() => import("./pages/PageForgotPassword"));

// Patient Pages
const PageBookAppointment = React.lazy(() => import("./pages/patient/PageBookAppointment"));
const PageRealtimeQueue = React.lazy(() => import("./pages/patient/PageRealtimeQueue"));
const PageMedicalHistory = React.lazy(() => import("./pages/patient/PageMedicalHistory"));

// Staff Pages
const PageQueueManagement = React.lazy(() => import("./pages/staff/PageQueueManagement"));
const PageAuditLog = React.lazy(() => import("./pages/staff/PageAuditLog"));
const PageStaffUpload = React.lazy(() => import("./pages/staff/PageStaffUpload"));

// Doctor Pages
const PageDoctorDashboard = React.lazy(() => import("./pages/doctor/PageDoctorDashboard"));
const PagePatientMedicalHistory = React.lazy(() => import("./pages/doctor/PagePatientMedicalHistory"));
const PageUpdateAvailability = React.lazy(() => import("./pages/doctor/PageUpdateAvailability"));
const PagePrescriptionForm = React.lazy(() => import("./pages/doctor/PagePrescriptionForm"));

// Admin Pages
const PageAdminDoctors = React.lazy(() => import("./pages/admin/PageAdminDoctors"));

// Shared Pages
const PageSettings = React.lazy(() => import("./pages/PageSettings"));
const PageAccountSecuritySetup = React.lazy(() => import("./pages/PageAccountSecuritySetup"));

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    // Dynamic Redirect based on attempted path
    let redirectPath = "/auth/patient";
    if (location.pathname.includes("/doctor")) redirectPath = "/auth/doctor";
    else if (location.pathname.includes("/staff")) redirectPath = "/auth/staff";
    else if (location.pathname.includes("/admin")) redirectPath = "/auth/admin";

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // === FORCE SECURITY SETUP FOR ALL USERS ===
  // If user hasn't set a security question (which implies first login/setup needed)
  // and they are not already on the setup page, redirect them.
  if (!user.securityQuestion && location.pathname !== '/app/account-security-setup') {
    return <Navigate to="/app/account-security-setup" replace />;
  }
  // =================================================

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Strict Role Enforcement: Redirect to their own dashboard if they try to access unauthorized pages
    const dashboardMap = {
      patient: "/app/patient/queue",
      doctor: "/app/doctor/dashboard",
      staff: "/app/staff/queue",
      admin: "/app/admin/doctors",
    };
    return <Navigate to={dashboardMap[user.role] || "/app"} replace />;
  }

  return children;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  return children;
};

// Role-Based Default Dashboard
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const redirectMap = {
    patient: "/app/patient/queue",
    doctor: "/app/doctor/dashboard",
    staff: "/app/staff/queue",
    admin: "/app/admin/doctors",
  };
  return <Navigate to={redirectMap[user.role] || "/app"} replace />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<LandingPageWithLogout />} />
            <Route path="/tv" element={<PageTVDisplay />} />
            <Route path="/auth/forgot-password" element={<PublicRoute><PageForgotPassword /></PublicRoute>} />

            {/* AUTH */}
            <Route path="/auth/:role" element={
              <PublicRoute>
                <AuthLayout>
                  <AuthPage />
                </AuthLayout>
              </PublicRoute>
            } />

            {/* MAIN APP */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<RoleBasedDashboard />} />

              {/* === NEW ROUTE FOR FORCED SETUP === */}
              <Route path="account-security-setup" element={<ProtectedRoute><PageAccountSecuritySetup /></ProtectedRoute>} />
              {/* ================================== */}

              <Route path="dashboard" element={<RoleBasedDashboard />} />

              {/* PATIENT */}
              <Route path="patient/book" element={<ProtectedRoute allowedRoles={["patient"]}><PageBookAppointment /></ProtectedRoute>} />
              <Route path="patient/queue" element={<ProtectedRoute allowedRoles={["patient"]}><PageRealtimeQueue /></ProtectedRoute>} />
              <Route path="patient/history" element={<ProtectedRoute allowedRoles={["patient"]}><PageMedicalHistory /></ProtectedRoute>} />

              {/* STAFF */}
              <Route path="staff/queue" element={<ProtectedRoute allowedRoles={["staff", "admin"]}><PageQueueManagement /></ProtectedRoute>} />
              <Route path="staff/upload" element={<ProtectedRoute allowedRoles={["staff", "admin"]}><PageStaffUpload /></ProtectedRoute>} />
              <Route path="staff/logs" element={<ProtectedRoute allowedRoles={["staff", "admin"]}><PageAuditLog /></ProtectedRoute>} />

              {/* DOCTOR */}
              <Route path="doctor/dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><PageDoctorDashboard /></ProtectedRoute>} />
              <Route path="doctor/history" element={<ProtectedRoute allowedRoles={["doctor"]}><PagePatientMedicalHistory /></ProtectedRoute>} />
              <Route path="doctor/availability" element={<ProtectedRoute allowedRoles={["doctor"]}><PageUpdateAvailability /></ProtectedRoute>} />
              <Route path="doctor/prescription" element={<ProtectedRoute allowedRoles={["doctor"]}><PagePrescriptionForm /></ProtectedRoute>} />

              {/* ADMIN */}
              <Route path="admin/doctors" element={<ProtectedRoute allowedRoles={["admin"]}><PageAdminDoctors /></ProtectedRoute>} />

              {/* SHARED */}
              <Route path="settings" element={<ProtectedRoute><PageSettings /></ProtectedRoute>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-800">404</h1>
                  <p className="text-xl text-gray-600">Page Not Found</p>
                  <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">Back Home</a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;