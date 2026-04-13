import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import CreateTripPage from './pages/CreateTripPage';
import PreferenceFormPage from './pages/PreferenceFormPage';
import TripResultsPage from './pages/TripResultsPage';
import ItineraryPage from './pages/ItineraryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create" element={<CreateTripPage />} />
            <Route path="/preferences/:token" element={<PreferenceFormPage />} />
            <Route path="/trip/:tripId/results" element={<TripResultsPage />} />
            <Route path="/trip/:tripId/itinerary" element={<ItineraryPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
    </AuthProvider>
  );
}
