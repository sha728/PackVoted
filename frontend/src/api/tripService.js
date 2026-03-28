import client from './client';

/**
 * tripService.js
 *
 * All PackVote API calls in one place.
 *
 * ⚠️  FastAPI note: every POST endpoint on this backend
 *     reads parameters from the *query string*, not from a
 *     JSON body. We therefore always pass `params` (not `data`)
 *     when calling POST endpoints. Arrays are serialised by
 *     Axios as repeated query keys, which FastAPI's `List[str]`
 *     type accepts correctly (e.g. ?emails=a@x.com&emails=b@x.com).
 */

/* ──────────────────────────────────────────────────────────
   POST /api/trips
   Create a new trip and dispatch preference-form emails.

   @param {Object} data
   @param {string}   data.name               - Trip name
   @param {string}   data.creator_email       - Organiser's email
   @param {string}   [data.creator_name]      - Organiser's display name
   @param {string}   [data.date_start]        - ISO date string
   @param {string}   [data.date_end]          - ISO date string
   @param {number}   [data.duration_days]     - Trip length (default 3)
   @param {number}   [data.budget_min]        - Min budget per person (₹)
   @param {number}   [data.budget_max]        - Max budget per person (₹)
   @param {string[]} [data.participant_emails] - Other participants' emails

   @returns {Promise<{ trip_id, name, participants_added, status, message }>}
   ────────────────────────────────────────────────────────── */
export async function createTrip(data) {
  const {
    name,
    creator_email,
    creator_name,
    date_start,
    date_end,
    duration_days = 3,
    budget_min = 2000,
    budget_max = 5000,
    participant_emails = [],
  } = data;

  const response = await client.post('/api/trips', null, {
    params: {
      name,
      creator_email,
      ...(creator_name && { creator_name }),
      ...(date_start && { date_start }),
      ...(date_end && { date_end }),
      duration_days,
      budget_min,
      budget_max,
      participant_emails, // Axios repeats this key for each array item
    },
  });

  return response.data;
}

/* ──────────────────────────────────────────────────────────
   GET /api/trips/{trip_id}
   Fetch full trip details: status, participants, recommendations.

   @param {string} tripId - UUID of the trip
   @returns {Promise<Trip>}
   ────────────────────────────────────────────────────────── */
export async function getTrip(tripId) {
  const response = await client.get(`/api/trips/${tripId}`);
  return response.data;
}

/* ──────────────────────────────────────────────────────────
   GET /api/form-context/{token}
   Fetch trip context for a participant's preference form.

   @param {string} token - UUID token from the email link
   @returns {Promise<{ trip_name, trip_id, participant_email, dates,
                        duration, budget_min, budget_max, already_completed }>}
   ────────────────────────────────────────────────────────── */
export async function getFormContext(token) {
  const response = await client.get(`/api/form-context/${token}`);
  return response.data;
}

/* ──────────────────────────────────────────────────────────
   POST /api/submit-preferences/{token}
   Submit a participant's travel preference answers.

   @param {string} token - UUID token from the email link
   @param {Object} data
   @param {number}   data.budget_ceiling         - Max they'll spend per person
   @param {number}   data.budget_floor           - Min budget they're comfortable with
   @param {string}   data.climate                - 'hot' | 'warm' | 'mild' | 'cold' | 'snow'
   @param {number}   data.activity_level         - 0.0 (relaxed) → 1.0 (very active)
   @param {number}   data.culture_nature         - 0.0 (all nature) → 1.0 (all culture)
   @param {number}   [data.date_flexibility]     - Flex days (default 0)
   @param {string[]} [data.avoided_destinations] - Destinations to skip
   @param {string[]} [data.required_vibes]       - Must-have vibes
   @param {string[]} [data.avoided_vibes]        - Vibes to avoid
   @param {string[]} [data.accessibility_needs]  - Accessibility requirements
   @param {number}   [data.food_importance]      - 0.0 → 1.0 (default 0.5)
   @param {number}   [data.nightlife_importance] - 0.0 → 1.0 (default 0.5)
   @param {Object}   [data.weights]              - Scoring weights { budget, weather, activities, vibe }

   @returns {Promise<{ status: 'success', message: string }>}
   ────────────────────────────────────────────────────────── */
export async function submitPreferences(token, data) {
  const {
    budget_ceiling,
    budget_floor,
    climate,
    activity_level,
    culture_nature,
    date_flexibility = 0,
    avoided_destinations = [],
    required_vibes = [],
    avoided_vibes = [],
    accessibility_needs = [],
    food_importance = 0.5,
    nightlife_importance = 0.5,
  } = data;

  const response = await client.post(
    `/api/submit-preferences/${token}`,
    null,
    {
      params: {
        budget_ceiling,
        budget_floor,
        climate,
        activity_level,
        culture_nature,
        date_flexibility,
        avoided_destinations,
        required_vibes,
        avoided_vibes,
        accessibility_needs,
        food_importance,
        nightlife_importance,
      },
    }
  );

  return response.data;
}

/* ──────────────────────────────────────────────────────────
   GET /api/trips/{trip_id}/recommendations
   Fetch AI-scored destination recommendations.
   Only available after all participants have submitted.

   @param {string} tripId
   @returns {Promise<{ trip_name, recommendations, participants_completed,
                        total_participants }>}
   ────────────────────────────────────────────────────────── */
export async function getRecommendations(tripId) {
  const response = await client.get(`/api/trips/${tripId}/recommendations`);
  return response.data;
}

/* ──────────────────────────────────────────────────────────
   POST /api/trips/{trip_id}/select-destination
   Lock in the group's chosen destination.

   @param {string} tripId          - UUID of the trip
   @param {string} destinationName - Exact name matching a recommendation
   @returns {Promise<{ status, selected, message }>}
   ────────────────────────────────────────────────────────── */
export async function selectDestination(tripId, destinationName) {
  const response = await client.post(
    `/api/trips/${tripId}/select-destination`,
    null,
    {
      params: { destination_name: destinationName },
    }
  );

  return response.data;
}

/* ──────────────────────────────────────────────────────────
   GET /api/trips/{trip_id}/itinerary
   Fetch (or generate) the AI day-by-day itinerary.
   First call generates; subsequent calls return the cache.

   @param {string}  tripId        - UUID of the trip
   @param {boolean} [force=false] - Pass true to regenerate even if cached
   @returns {Promise<{ destination, generated_by, weather_data, itinerary }>}
   ────────────────────────────────────────────────────────── */
export async function getItinerary(tripId, force = false) {
  const response = await client.get(`/api/trips/${tripId}/itinerary`, {
    params: force ? { force: true } : undefined,
  });

  return response.data;
}

/* ──────────────────────────────────────────────────────────
   GET /api/trips/{trip_id}/travel-estimate
   Fetch cost estimations based on origin and Google Maps distance.

   @param {string} tripId - UUID of the trip
   @param {string} origin - Starting city entered by the user
   @returns {Promise<{ distance_km, costs: { train, bus, flight } }>}
   ────────────────────────────────────────────────────────── */
export async function getTravelEstimate(tripId, origin) {
  const response = await client.get(`/api/trips/${tripId}/travel-estimate`, {
    params: { origin },
  });
  return response.data;
}
