import { db } from '../db';

export async function setTripRating(tripId: string, rating: number): Promise<void> {
  await db.trips.update(tripId, { rating });
}

export const RATING_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#8bc34a', '#43a047'];
export const RATING_MOODS = [-1, -0.5, 0, 0.5, 1];
export const RATING_LABELS = ['Sehr schlecht', 'Schlecht', 'Okay', 'Gut', 'Sehr gut'];
