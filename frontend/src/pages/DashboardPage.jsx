import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/authService';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [trips, setTrips] = useState({ created: [], invited: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      getDashboard(token)
        .then(data => setTrips(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <Loader message="Loading dashboard..." />;

  const renderTripCards = (tripList, emptyMessage) => {
    if (!tripList || tripList.length === 0) {
      return <p className="text-surface-500 italic text-sm">{emptyMessage}</p>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tripList.map(trip => (
          <Card key={trip.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/trip/${trip.id}/results`)}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-surface-900">{trip.name}</h3>
                <p className="text-xs text-surface-500 mt-1">Starting: {trip.date_start ? new Date(trip.date_start).toLocaleDateString() : 'TBD'}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                ['created', 'forms_sent'].includes(trip.status) ? 'bg-orange-100 text-orange-700' :
                ['collecting_preferences'].includes(trip.status) ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {trip.status.replace('_', ' ')}
              </span>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container-app py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleLogout}>Log out</Button>
          <Button onClick={() => navigate('/create')}>Create New Trip</Button>
        </div>
      </div>
      
      <ErrorBanner message={error} className="mb-6" />

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true">👑</span> Trips You're Organizing
          </h2>
          {renderTripCards(trips.created, "You haven't organized any trips yet.")}
        </section>

        <section>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true">💌</span> Trips You're Invited To
          </h2>
          {renderTripCards(trips.invited, "You have no pending invitations.")}
        </section>
      </div>
    </div>
  );
}
