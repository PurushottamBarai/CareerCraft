import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import About from './pages/About';
import Contact from './pages/Contact';
import Hackathons from './pages/Hackathons';

import EmployerDashboard from './pages/EmployerDashboard';
import Home from './pages/Home';
import Institute from './pages/Institute';
import Internships from './pages/Internships';
import Quiz from './pages/Quiz';
import ResumeBuilder from './pages/ResumeBuilder';
import Roadmaps from './pages/Roadmaps';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import { AuthContext } from './context/AuthContext';

const ScrollToTop = () => {
  const { pathname, state } = useLocation();

  useEffect(() => {
    if (!state?.scrollToServices && !state?.scrollToAbout) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, state]);

  return null;
};

// Role-based Dashboard Switcher
const DashboardRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employer') return <EmployerDashboard />;
  if (user.role === 'admin') return <Institute />;
  return <StudentDashboard />;
};

// Protected Employer Route
const EmployerRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'employer') return <Navigate to="/dashboard" replace />;
  return <EmployerDashboard />;
};

// Protected Admin Route
const AdminRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Institute />;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/hackathons" element={<Hackathons />} />

        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/employerdashboard" element={<EmployerRoute />} />
        <Route path="/employerhome" element={<EmployerRoute />} />
        <Route path="/institute" element={<AdminRoute />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/roadmaps" element={<Roadmaps />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
