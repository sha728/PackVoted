import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import Slider from '../components/common/Slider';
import ClimateSelector from '../components/preferences/ClimateSelector';
import VibeTagPicker from '../components/preferences/VibeTagPicker';
import { getFormContext, submitPreferences } from '../api/tripService';

/* ── Default preference state ─────────────────────────────── */
const DEFAULT_PREFS = {
  budget_floor: '',
  budget_ceiling: '',
  climate: '',
  activity_level: 0.5,
  culture_nature: 0.5,
  food_importance: 0.5,
  nightlife_importance: 0.5,
  required_vibes: [],
  avoided_vibes: [],
  avoided_destinations_input: '', // raw textarea → parsed on submit
  accessibility_needs_input: '',  // raw textarea → parsed on submit
};

/* ── Validation ───────────────────────────────────────────── */
function validate(prefs, context) {
  const errors = {};

  const floor = Number(prefs.budget_floor);
  const ceiling = Number(prefs.budget_ceiling);

  if (!prefs.budget_floor) {
    errors.budget_floor = 'Please enter your minimum budget.';
  } else if (floor < 0) {
    errors.budget_floor = 'Budget cannot be negative.';
  } else if (context && floor < context.budget_min) {
    errors.budget_floor = `Minimum is ₹${context.budget_min.toLocaleString()} for this trip.`;
  }

  if (!prefs.budget_ceiling) {
    errors.budget_ceiling = 'Please enter your maximum budget.';
  } else if (ceiling <= floor) {
    errors.budget_ceiling = 'Maximum must be more than your minimum.';
  } else if (context && ceiling > context.budget_max) {
    errors.budget_ceiling = `Maximum is ₹${context.budget_max.toLocaleString()} for this trip.`;
  }

  if (!prefs.climate) {
    errors.climate = 'Please pick a climate preference.';
  }

  return errors;
}

/* ── Helper: parse comma/newline separated text into array ── */
function parseListInput(raw) {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ── Page ─────────────────────────────────────────────────── */
export default function PreferenceFormPage() {
  const { token } = useParams();

  // Remote state
  const [context, setContext]       = useState(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [ctxError, setCtxError]     = useState('');

  // Form state
  const [prefs, setPrefs]     = useState(DEFAULT_PREFS);
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState('');
  const [submitted, setSubmitted]   = useState(false);

  /* ── Load form context on mount ───────────────────────────── */
  useEffect(() => {
    if (!token) return;
    setLoadingCtx(true);

    getFormContext(token)
      .then((data) => {
        setContext(data);
        // Pre-fill budget from trip defaults
        setPrefs((prev) => ({
          ...prev,
          budget_floor: data.budget_min ?? '',
          budget_ceiling: data.budget_max ?? '',
        }));
      })
      .catch((err) => setCtxError(err.message ?? 'Invalid or expired form link.'))
      .finally(() => setLoadingCtx(false));
  }, [token]);

  /* ── Field helpers ────────────────────────────────────────── */
  function setField(key, value) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  /* ── Submit ───────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate(prefs, context);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitPreferences(token, {
        budget_floor: Number(prefs.budget_floor),
        budget_ceiling: Number(prefs.budget_ceiling),
        climate: prefs.climate,
        activity_level: prefs.activity_level,
        culture_nature: prefs.culture_nature,
        food_importance: prefs.food_importance,
        nightlife_importance: prefs.nightlife_importance,
        required_vibes: prefs.required_vibes,
        avoided_vibes: prefs.avoided_vibes,
        avoided_destinations: parseListInput(prefs.avoided_destinations_input),
        accessibility_needs: parseListInput(prefs.accessibility_needs_input),
      });
      setSubmitted(true);
    } catch (err) {
      setApiError(err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ══ RENDER STATES ════════════════════════════════════════ */

  // 1. Loading context
  if (loadingCtx) {
    return <Loader message="Loading your preference form…" />;
  }

  // 2. Invalid token / network error
  if (ctxError) {
    return (
      <div className="container-app py-20 max-w-lg text-center animate-fade-in">
        <div className="text-5xl mb-4" aria-hidden="true">🔗</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Link Not Found</h1>
        <p className="text-surface-500">{ctxError}</p>
      </div>
    );
  }

  // 3. Already submitted
  if (context?.already_completed) {
    return (
      <div className="container-app py-20 max-w-lg text-center animate-fade-in">
        <div className="text-5xl mb-4" aria-hidden="true">✅</div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">
          Already Submitted
        </h1>
        <p className="text-surface-500">
          You've already filled in your preferences for{' '}
          <strong>{context.trip_name}</strong>. Check your email for updates!
        </p>
      </div>
    );
  }

  // 4. Success
  if (submitted) {
    return (
      <div className="container-app py-20 max-w-lg text-center animate-fade-in flex flex-col items-center gap-5">
        <div className="text-6xl" aria-hidden="true">🎒</div>
        <h1 className="text-3xl font-bold text-surface-900">You're In!</h1>
        <p className="text-surface-500 text-lg">
          Your preferences for <strong>{context.trip_name}</strong> have been
          saved. We'll email you once everyone has responded and destinations
          are ready.
        </p>
        <Card padding="sm" className="w-full text-left border-brand-100 bg-brand-50">
          <p className="text-xs text-surface-500">
            <span className="font-semibold text-surface-700">What happens next?</span>
            {' '}Once all participants submit, our AI will score destinations
            and the organiser will pick one — then you'll get a full itinerary!
          </p>
        </Card>
      </div>
    );
  }

  // 5. Full form
  return (
    <div className="container-app py-12 max-w-2xl animate-fade-in">

      {/* ── Trip context banner ───────────────────────────── */}
      <Card padding="md" className="mb-8 border-brand-100 bg-gradient-to-r from-brand-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-0.5">
              You're invited ✈️
            </p>
            <h1 className="text-xl font-bold text-surface-900">
              {context.trip_name}
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">{context.participant_email}</p>
          </div>
          {context.dates?.start && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-surface-400">Trip dates</p>
              <p className="text-sm font-semibold text-surface-700">
                {context.dates.start} – {context.dates.end}
              </p>
              <p className="text-xs text-brand-600 font-medium">
                {context.duration} days
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Page heading ──────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-surface-900">Your Travel Preferences</h2>
        <p className="text-surface-500 mt-1 text-sm">
          Your answers are private. The AI uses everyone's combined preferences
          to find the best destination for the group.
        </p>
      </div>

      <ErrorBanner message={apiError} className="mb-6" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

        {/* ── Section 1: Budget ─────────────────────────── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">💰</span> Your Budget (₹ per person)
          </h3>
          <p className="text-xs text-surface-400 mb-5">
            Trip budget range: ₹{Number(context.budget_min).toLocaleString()} –
            ₹{Number(context.budget_max).toLocaleString()}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="budget-floor"
              label="Your Minimum (₹)"
              type="number"
              min={0}
              step={500}
              value={prefs.budget_floor}
              onChange={(e) => setField('budget_floor', e.target.value)}
              error={errors.budget_floor}
              placeholder={String(context.budget_min)}
              required
            />
            <Input
              id="budget-ceiling"
              label="Your Maximum (₹)"
              type="number"
              min={0}
              step={500}
              value={prefs.budget_ceiling}
              onChange={(e) => setField('budget_ceiling', e.target.value)}
              error={errors.budget_ceiling}
              placeholder={String(context.budget_max)}
              required
            />
          </div>
        </Card>

        {/* ── Section 2: Climate ────────────────────────── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">🌡️</span> Climate Preference
          </h3>
          <ClimateSelector
            value={prefs.climate}
            onChange={(v) => setField('climate', v)}
            error={errors.climate}
          />
        </Card>

        {/* ── Section 3: Activity & Style sliders ───────── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">⚡</span> Travel Style
          </h3>
          <div className="flex flex-col gap-8">
            <Slider
              id="activity-level"
              label="Activity Level"
              value={prefs.activity_level}
              onChange={(v) => setField('activity_level', v)}
              leftLabel="😌 Relaxed"
              rightLabel="🏃 Very Active"
            />
            <Slider
              id="culture-nature"
              label="Interests"
              value={prefs.culture_nature}
              onChange={(v) => setField('culture_nature', v)}
              leftLabel="🌿 Nature"
              rightLabel="🏛️ Culture"
            />
            <Slider
              id="food-importance"
              label="Food Scene Importance"
              value={prefs.food_importance}
              onChange={(v) => setField('food_importance', v)}
              leftLabel="Not a priority"
              rightLabel="Must have great food"
            />
            <Slider
              id="nightlife-importance"
              label="Nightlife Importance"
              value={prefs.nightlife_importance}
              onChange={(v) => setField('nightlife_importance', v)}
              leftLabel="Early nights"
              rightLabel="Love going out"
            />
          </div>
        </Card>

        {/* ── Section 4: Required vibes ─────────────────── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-2 flex items-center gap-2">
            <span aria-hidden="true">✨</span> Must-Have Vibes
          </h3>
          <p className="text-xs text-surface-400 mb-5">
            Select the vibes this trip absolutely needs to have.
          </p>
          <VibeTagPicker
            selected={prefs.required_vibes}
            onChange={(v) => setField('required_vibes', v)}
          />
        </Card>

        {/* ── Section 5: Avoided vibes ──────────────────── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-2 flex items-center gap-2">
            <span aria-hidden="true">🚫</span> Vibes to Avoid
          </h3>
          <p className="text-xs text-surface-400 mb-5">
            Select vibes you'd rather skip entirely.
          </p>
          <VibeTagPicker
            selected={prefs.avoided_vibes}
            onChange={(v) => setField('avoided_vibes', v)}
          />
        </Card>

        {/* ── Section 6: Destinations & Accessibility ───── */}
        <Card padding="lg">
          <h3 className="text-base font-semibold text-surface-900 mb-6 flex items-center gap-2">
            <span aria-hidden="true">🗺️</span> Other Preferences
          </h3>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="avoided-destinations"
                className="text-sm font-medium text-surface-700"
              >
                Destinations to Avoid
              </label>
              <textarea
                id="avoided-destinations"
                rows={2}
                placeholder="e.g. Mumbai, Delhi (comma or newline separated)"
                value={prefs.avoided_destinations_input}
                onChange={(e) => setField('avoided_destinations_input', e.target.value)}
                className="
                  w-full rounded-xl border border-surface-300 px-4 py-2.5
                  text-sm text-surface-900 placeholder:text-surface-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500
                  transition-colors resize-none
                "
              />
              <p className="text-xs text-surface-400">Optional — comma or newline separated</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="accessibility-needs"
                className="text-sm font-medium text-surface-700"
              >
                Accessibility Needs
              </label>
              <textarea
                id="accessibility-needs"
                rows={2}
                placeholder="e.g. wheelchair access, dietary restrictions"
                value={prefs.accessibility_needs_input}
                onChange={(e) => setField('accessibility_needs_input', e.target.value)}
                className="
                  w-full rounded-xl border border-surface-300 px-4 py-2.5
                  text-sm text-surface-900 placeholder:text-surface-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500
                  transition-colors resize-none
                "
              />
              <p className="text-xs text-surface-400">Optional — comma or newline separated</p>
            </div>
          </div>
        </Card>

        {/* ── Submit ────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-10">
          <p className="text-xs text-surface-400 max-w-xs">
            Your preferences are kept private — only the AI scoring engine sees the full picture.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            id="submit-preferences"
          >
            Submit Preferences 🎒
          </Button>
        </div>

      </form>
    </div>
  );
}
