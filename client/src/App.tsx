import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CivilianDashboard } from './pages/dashboards/CivilianDashboard';
import { BookAppointmentPage } from './pages/civilian/BookAppointmentPage';
import { MyAppointmentsPage } from './pages/civilian/MyAppointmentsPage';
import { MyMedicinesPage } from './pages/civilian/MyMedicinesPage';
import { DoctorDashboard } from './pages/dashboards/DoctorDashboard';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { DoctorConsultationPage } from './pages/doctor/DoctorConsultationPage';
import { PharmacyDashboard } from './pages/dashboards/PharmacyDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Civilian / Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['civilian', 'admin']} />}>
              <Route path="/student" element={<CivilianDashboard />} />
              <Route path="/student/book" element={<BookAppointmentPage />} />
              <Route path="/student/appointments" element={<MyAppointmentsPage />} />
              <Route path="/student/medicines" element={<MyMedicinesPage />} />
            </Route>

            {/* Protected Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
              <Route path="/doctor/consultation/:civilianId" element={<DoctorConsultationPage />} />
            </Route>

            {/* Protected Pharmacy Routes */}
            <Route element={<ProtectedRoute allowedRoles={['pharmacy', 'admin']} />}>
              <Route path="/pharmacy" element={<PharmacyDashboard />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
