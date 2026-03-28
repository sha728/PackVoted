import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import { createTrip } from '../api/tripService';

/* ── Initial form state ───────────────────────────────────── */
const INITIAL_FORM = {
  name: '',
  creator_email: '',
  creator_name: '',
  date_start: '',
  date_end: '',
  duration_days: 3,
  budget_min: 2000,
  budget_max: 5000,
};

/* ── Simple field-level validators ───────────────────────────
   Returns an error string or '' (clean).
   ─────────────────────────────────────────────────────────── */
function validate(form, participantEmails) {
  const errors = {};

  if (!form.name.trim()) errors.name = 'Trip name is required.';

  if (!form.creator_email.trim()) {
    errors.creator_email = 'Your email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.creator_email)) {
    errors.creator_email = 'Please enter a valid email address.';
  }

  if (!form.creator_name.trim()) errors.creator_name = 'Your name is required.';

  if (form.date_start && form.date_end && form.date_end < form.date_start) {
    errors.date_end = 'End date must be after the start date.';
  }

  const minDays = 1;
  const maxDays = 30;
  if (form.duration_days < minDays || form.duration_days > maxDays) {
    errors.duration_days = `Duration must be between ${minDays} and ${maxDays} days.`;
  }

  if (Number(form.budget_min) >= Number(form.budget_max)) {
    errors.budget_max = 'Maximum budget must exceed minimum budget.';
  }

  // Validate each participant email
  participantEmails.forEach((email, i) => {
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors[`participant_${i}`] = 'Invalid email address.';
    }
    if (email.trim() && email.toLowerCase() === form.creator_email.toLowerCase()) {
      errors[`participant_${i}`] = 'Cannot add yourself as a participant.';
    }
  });

  return errors;
}

/* ── Page ─────────────────────────────────────────────────── */
export default function CreateTripPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [participantEmails, setParticipantEmails] = useState(['']);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [tripResult, setTripResult] = useState(null); // success state

  /* ── Field helpers ────────────────────────────────────────── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  /* ── Participant email list ───────────────────────────────── */
  function addParticipant() {
    setParticipantEmails((prev) => [...prev, '']);
  }

  function removeParticipant(index) {
    setParticipantEmails((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`participant_${index}`];
      return next;
    });
  }

  function updateParticipant(index, value) {
    setParticipantEmails((prev) =>
      prev.map((email, i) => (i === index ? value : email))
    );
    if (errors[`participant_${index}`]) {
      setErrors((prev) => ({ ...prev, [`participant_${index}`]: '' }));
    }
  }

  /* ── Submit ───────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    // Client-side validation
    const validationErrors = validate(form, participantEmails);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    setSubmitting(true);
    try {
      const filtered = participantEmails.filter((e) => e.trim() !== '');
      const result = await createTrip({
        ...form,
        duration_days: Number(form.duration_days),
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        participant_emails: filtered,
      });
      setTripResult(result);
    } catch (err) {
      setApiError(err.message ?? 'Failed to create trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success state ────────────────────────────────────────── */
  if (tripResult) {
    return (
      <div className="container-app py-20 flex flex-col items-center text-center gap-6 animate-fade-in">
        <div className="text-6xl" aria-hidden="true">🎉</div>
        <h1 className="text-4xl font-bold text-surface-900">Trip Created!</h1>
        <p className="text-surface-500 text-lg max-w-md">
          <strong>{tripResult.name}</strong> is ready.{' '}
          We've emailed preference forms to all{' '}
          <strong>{tripResult.participants_added}</strong> participant
          {tripResult.participants_added !== 1 ? 's' : ''}.
        </p>

        <Card padding="md" className="w-full max-w-sm text-left border-brand-200 bg-brand-50">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-surface-500">Trip ID</dt>
              <dd className="font-mono text-xs text-surface-700 truncate max-w-[180px]">
                {tripResult.trip_id}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-500">Status</dt>
              <dd className="font-semibold text-brand-700 capitalize">
                {tripResult.status.replace(/_/g, ' ')}
              </dd>
            </div>
          </dl>
        </Card>

        <p className="text-sm text-surface-400 max-w-sm">
          Once everyone submits their preferences, visit the results page to see
          AI-ranked destinations.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            to={`/trip/${tripResult.trip_id}/results`}
            className="
              inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3
              text-sm font-semibold text-white hover:bg-brand-700 transition-colors
            "
          >
            View Trip Results →
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              setTripResult(null);
              setForm(INITIAL_FORM);
              setParticipantEmails(['']);
            }}
          >
            Create Another Trip
          </Button>
        </div>
      </div>
    );
  }

  /* ── Loading overlay ──────────────────────────────────────── */
  if (submitting) {
    return (
      <Loader message="Creating your trip and sending invite emails…" />
    );
  }

  /* ── Form ─────────────────────────────────────────────────── */
  return (
    <div className="container-app py-12 max-w-2xl animate-fade-in">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-surface-900">Create a Trip</h1>
        <p className="mt-2 text-surface-500">
          Fill in the details and add your group. We'll email everyone a
          preference form automatically.
        </p>
      </div>

      <ErrorBanner message={apiError} className="mb-6" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

        {/* ── Section: Trip Details ────────────────────────── */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">🗺️</span> Trip Details
          </h2>

          <div className="flex flex-col gap-5">
            <Input
              id="trip-name"
              name="name"
              label="Trip Name"
              placeholder="e.g. Goa Summer Trip 2026"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                id="date-start"
                name="date_start"
                label="Start Date"
                type="date"
                value={form.date_start}
                onChange={handleChange}
                error={errors.date_start}
                helper="Leave blank to set later"
              />
              <Input
                id="date-end"
                name="date_end"
                label="End Date"
                type="date"
                value={form.date_end}
                onChange={handleChange}
                error={errors.date_end}
              />
            </div>

            <Input
              id="duration-days"
              name="duration_days"
              label="Duration (days)"
              type="number"
              min={1}
              max={30}
              value={form.duration_days}
              onChange={handleChange}
              error={errors.duration_days}
              helper="How many nights is the trip?"
              required
            />
          </div>
        </Card>

        {/* ── Section: Budget ─────────────────────────────── */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">💰</span> Budget Range (₹ per person)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="budget-min"
              name="budget_min"
              label="Minimum Budget (₹)"
              type="number"
              min={0}
              step={500}
              value={form.budget_min}
              onChange={handleChange}
              error={errors.budget_min}
              placeholder="2000"
              required
            />
            <Input
              id="budget-max"
              name="budget_max"
              label="Maximum Budget (₹)"
              type="number"
              min={0}
              step={500}
              value={form.budget_max}
              onChange={handleChange}
              error={errors.budget_max}
              placeholder="5000"
              required
            />
          </div>
        </Card>

        {/* ── Section: Organiser ──────────────────────────── */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">👤</span> Your Details
          </h2>

          <div className="flex flex-col gap-5">
            <Input
              id="creator-name"
              name="creator_name"
              label="Your Name"
              placeholder="e.g. Aryan Sharma"
              value={form.creator_name}
              onChange={handleChange}
              error={errors.creator_name}
              required
            />
            <Input
              id="creator-email"
              name="creator_email"
              label="Your Email"
              type="email"
              placeholder="you@example.com"
              value={form.creator_email}
              onChange={handleChange}
              error={errors.creator_email}
              helper="You'll also receive a preference form at this address"
              required
            />
          </div>
        </Card>

        {/* ── Section: Participants ────────────────────────── */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-surface-900 mb-2 flex items-center gap-2">
            <span aria-hidden="true">👥</span> Group Members
          </h2>
          <p className="text-xs text-surface-400 mb-6">
            We'll email each person a private preference form. You don't need to add yourself.
          </p>

          <div className="flex flex-col gap-3">
            {participantEmails.map((email, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  id={`participant-email-${index}`}
                  label={`Participant ${index + 1} Email`}
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => updateParticipant(index, e.target.value)}
                  error={errors[`participant_${index}`]}
                  className="flex-1"
                />
                {participantEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="
                      mt-7 flex-shrink-0 rounded-lg p-2 text-surface-400
                      hover:bg-red-50 hover:text-red-500 transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400
                    "
                    aria-label={`Remove participant ${index + 1}`}
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addParticipant}
            className="mt-4"
          >
            <span aria-hidden="true">+</span> Add Another Member
          </Button>
        </Card>

        {/* ── Submit ──────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <p className="text-xs text-surface-400">
            Preference emails are sent immediately on creation.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            id="submit-trip"
          >
            Create Trip ✈️
          </Button>
        </div>

      </form>
    </div>
  );
}
