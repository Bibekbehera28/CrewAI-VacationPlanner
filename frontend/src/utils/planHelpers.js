/** Currency code from plan or collected session state */
export function getCurrencyCode(source) {
  return (source?.currency_code || 'usd').toLowerCase();
}

/** Read a backend field suffixed with currency_code, e.g. price_per_night_inr */
export function fieldForCurrency(obj, base, currencyCode) {
  if (!obj) return 0;
  const code = (currencyCode || 'usd').toLowerCase();
  const key = `${base}_${code}`;
  const val = obj[key];
  return typeof val === 'number' ? val : Number(val) || 0;
}

export function getDestBudgetPerPerson(dest, currencyCode) {
  return fieldForCurrency(dest, 'estimated_budget_per_person', currencyCode);
}

export function getDestHotelPerNight(dest, currencyCode) {
  return fieldForCurrency(dest, 'estimated_hotel_per_night', currencyCode);
}

export function getHotelPricePerNight(hotel, currencyCode) {
  return fieldForCurrency(hotel, 'price_per_night', currencyCode);
}

export function getHotelTotalStay(hotel, currencyCode) {
  return fieldForCurrency(hotel, 'total_stay', currencyCode);
}

export function getTotalBudget(plan) {
  const code = getCurrencyCode(plan);
  return fieldForCurrency(plan, 'total_budget', code) || plan?.[`total_budget_${code}`] || 0;
}

export function getBudgetBreakdown(plan) {
  const code = getCurrencyCode(plan);
  const bd = plan?.budget_breakdown || {};
  return {
    flights: fieldForCurrency(bd, 'flights', code) || bd[`flights_${code}`] || 0,
    hotels: fieldForCurrency(bd, 'hotels', code) || bd[`hotels_${code}`] || 0,
    activities:
      fieldForCurrency(bd, 'activities_and_food', code) ||
      bd[`activities_and_food_${code}`] ||
      0,
  };
}

/** True when the next /api/chat call should run the destination agent */
export function willFetchDestinations(collected) {
  if (!collected) return false;
  const { category, budget, trip_duration_days } = collected;
  if (!category || budget == null || !trip_duration_days) return false;
  if (['Couple', 'Bachelor'].includes(category)) return true;
  return collected.number_of_people != null;
}

export function buildPlanSummary(plan) {
  if (!plan) return '';
  const sym = plan.currency_symbol || '$';
  const code = getCurrencyCode(plan);
  const lines = [
    `${plan.destination}, ${plan.country}`,
    `From: ${plan.departure_city}`,
    `Season: ${plan.season || 'N/A'}`,
    `Weather: ${plan.weather_summary || 'N/A'}`,
    '',
    'Flights:',
    ...(plan.flights || []).map(
      (f) =>
        `- ${f.airline} (${f.flight_type || 'Flight'}): ${f.departure_city} → ${f.arrival_city}, ${f.duration || 'N/A'}, ${sym}${fieldForCurrency(f, 'estimated_price_per_person', code)}/person`
    ),
    '',
    'Hotels:',
    ...(plan.hotels || []).map(
      (h) =>
        `- ${h.name}: ${sym}${getHotelPricePerNight(h, code)}/night, stay ${sym}${getHotelTotalStay(h, code)}`
    ),
    '',
    'Itinerary:',
    ...(plan.day_by_day || []).map((d) => `Day ${d.day}: ${d.title}`),
    '',
    'Tips:',
    ...(plan.travel_tips || []).map((t) => `- ${t}`),
    '',
    plan.visa_info ? `Visa: ${plan.visa_info}` : '',
    plan.best_time_to_visit ? `Best time: ${plan.best_time_to_visit}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}
