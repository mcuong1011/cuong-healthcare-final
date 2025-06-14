import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AppointmentPage from "./pages/ApointmanetPage";
import VirtualRobot from "./components/VirtualRobot";
import DoctorPage from "./pages/DoctorPage";
import DoctorDashboardPage from "./pages/DoctorDashboardPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";

function App() {
  return (
    <>
    <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<PatientProfilePage />} />
        <Route path="/appointments" element={<AppointmentPage/>} />
        <Route path="/medical-records" element={<MedicalRecordsPage/>} />
        <Route path="/dashboard/reports" element={<MedicalRecordsPage/>} />
        <Route path="/vr" element={<VirtualRobot/>} />
        <Route path="/dashboard/vr" element={<VirtualRobot/>} />
        <Route path="/doctor" element={<DoctorPage />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
      </Routes>
    </>
  );
}
export default App;
