import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import DestinationCard from '../components/results/DestinationCard';
import { getRecommendations, selectDestination, getTrip } from '../api/tripService';

/* ── Polling interval ─────────────────────────────────────── */
const POLL_INTERVAL_MS = 10_000; // 10 seconds

/* ── Participant progress badge ───────────────────────────── */
function ParticipantProgress({ completed, total }) {
  const allDone = completed === total;
  return (
    <div className={`
      flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
      ${allDone
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'}
    `}>
      <span aria-hidden="true">{allDone ? '✅' : '⏳'}</span>
      {completed} / {total} preferences submitted
    </div>
  );
}

/* ── Waiting state while recommendations are generating ────── */
function WaitingState({ tripId, completed, total, onReady }) {
  const [secondsUntilPoll, setSecondsUntilPoll] = useState(POLL_INTERVAL_MS / 1000);

  useEffect(() => {
    // Countdown ticker
    const ticker = setInterval(() => {
      setSecondsUntilPoll((s) => (s <= 1 ? POLL_INTERVAL_MS / 1000 : s - 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const allSubmitted = completed === total;

  return (
    <div className="flex flex-col items-center text-center gap-6 py-20 animate-fade-in">
      <div className="text-6xl animate-pulse" aria-hidden="true">
        {allSubmitted ? '🤖' : '⏳'}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          {allSubmitted
            ? 'AI is ranking destinations…'
            : 'Waiting for everyone to respond'}
        </h2>
        <p className="text-surface-500 max-w-sm">
          {allSubmitted
            ? 'Our scoring engine is crunching preferences. This usually takes less than a minute.'
            : `${total - completed} member${total - completed !== 1 ? 's' : ''} still need to fill in the preference form.`}
        </p>
      </div>

      <ParticipantProgress completed={completed} total={total} />

      <p className="text-xs text-surface-400">
        Auto-refreshing in {secondsUntilPoll}s…
      </p>

      <Button variant="secondary" size="sm" onClick={onReady}>
        Check Now
      </Button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function TripResultsPage() {
  const { tripId }  = useParams();
  const navigate    = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [tripName, setTripName]         = useState('');
  const [recommendations, setRecs]      = useState(null);
  const [participantsCompleted, setPC]  = useState(0);
  const [totalParticipants, setTP]      = useState(0);
  const [selectingName, setSelectingName] = useState(''); // which card is loading
  const [selectError, setSelectError]   = useState('');

  const pollRef = useRef(null);

  /* ── Fetch recommendations ────────────────────────────── */
  const fetchRecs = useCallback(async () => {
    setError('');
    try {
      const data = await getRecommendations(tripId);
      setRecs(data.recommendations);
      setTripName(data.trip_name ?? '');
      setPC(data.participants_completed ?? 0);
      setTP(data.total_participants ?? 0);
      clearInterval(pollRef.current); // Stop polling — we have data
    } catch (err) {
      if (err.status === 400) {
        // "Recommendations not ready yet" — fetch trip for participant counts
        setRecs(null);
        try {
          const trip = await getTrip(tripId);
          setTripName(trip.name ?? '');
          const parts = trip.participants ?? [];
          setTP(parts.length);
          setPC(parts.filter((p) => p.form_completed).length);
        } catch {
          // non-fatal — trip details just won't show
        }
      } else if (err.status === 404) {
        setError('Trip not found. Please check the URL.');
        clearInterval(pollRef.current);
      } else {
        setError(err.message ?? 'Could not load recommendations.');
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Initial fetch
  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  // Auto-poll every 10 s while recommendations aren't ready
  useEffect(() => {
    if (recommendations !== null) return; // already have data
    pollRef.current = setInterval(fetchRecs, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [recommendations, fetchRecs]);

  /* ── Select destination ────────────────────────────────── */
  async function handleSelect(destinationName) {
    setSelectError('');
    setSelectingName(destinationName);
    try {
      await selectDestination(tripId, destinationName);
      navigate(`/trip/${tripId}/itinerary`);
    } catch (err) {
      setSelectError(err.message ?? 'Could not select destination. Please try again.');
      setSelectingName('');
    }
  }

  /* ══ RENDER ═══════════════════════════════════════════════ */

  // 1. Initial load
  if (loading) {
    return <Loader message="Loading trip results…" />;
  }

  // 2. Hard error (404 or unexpected)
  if (error) {
    return (
      <div className="container-app py-20 max-w-lg text-center animate-fade-in">
        <div className="text-5xl mb-4" aria-hidden="true">😕</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Something went wrong</h1>
        <p className="text-surface-500 mb-6">{error}</p>
        <Button variant="secondary" onClick={fetchRecs}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container-app py-12 animate-fade-in">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-1">
          Trip Results
        </p>
        <h1 className="text-3xl font-bold text-surface-900">
          {tripName || 'Your Trip'}
        </h1>

        {totalParticipants > 0 && (
          <div className="mt-3">
            <ParticipantProgress
              completed={participantsCompleted}
              total={totalParticipants}
            />
          </div>
        )}
      </div>

      {/* ── Selection error ──────────────────────────────── */}
      <ErrorBanner message={selectError} className="mb-6" />

      {/* ── Waiting / no recommendations yet ────────────── */}
      {!recommendations && (
        <WaitingState
          tripId={tripId}
          completed={participantsCompleted}
          total={totalParticipants}
          onReady={fetchRecs}
        />
      )}

      {/* ── Recommendations list ─────────────────────────── */}
      {recommendations && recommendations.length > 0 && (
        <>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-surface-500 text-sm">
              {recommendations.length} destination
              {recommendations.length !== 1 ? 's' : ''} ranked by group fit.
              {' '}Select one to generate your AI itinerary.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRecs}
            >
              ↻ Refresh
            </Button>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="list">
            {recommendations.map((rec, index) => (
              <li key={rec.destination?.name ?? index}>
                <DestinationCard
                  rec={rec}
                  rank={index + 1}
                  selecting={selectingName === rec.destination?.name}
                  onSelect={() => handleSelect(rec.destination?.name)}
                />
              </li>
            ))}
          </ol>
        </>
      )}

      {/* ── Edge case: empty recommendations array ───────── */}
      {recommendations && recommendations.length === 0 && (
        <div className="py-20 text-center animate-fade-in">
          <div className="text-5xl mb-4" aria-hidden="true">🤔</div>
          <h2 className="text-xl font-bold text-surface-800 mb-2">
            No recommendations generated
          </h2>
          <p className="text-surface-500">
            The scoring engine couldn't find any matches. Try adjusting preferences.
          </p>
        </div>
      )}

    </div>
  );
}
