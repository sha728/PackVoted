import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import CreateTripPage from './pages/CreateTripPage';
import PreferenceFormPage from './pages/PreferenceFormPage';
import TripResultsPage from './pages/TripResultsPage';
import ItineraryPage from './pages/ItineraryPage';


export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateTripPage />} />
            <Route path="/preferences/:token" element={<PreferenceFormPage />} />
            <Route path="/trip/:tripId/results" element={<TripResultsPage />} />
            <Route path="/trip/:tripId/itinerary" element={<ItineraryPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
