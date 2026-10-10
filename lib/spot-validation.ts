export interface SpotFormInput {
  name: string;
  building: string;
  capacity: number;
  quietness: number;
  amenities: string[];
}

export interface ValidatedSpotInput {
  name: string;
  building: string;
  capacity: number;
  quietness: number;
  amenities: string[];
}

export type SpotValidationFailure = { ok: false; error: string };

// Pure validation/normalization (no auth, no DB): name 3–60 chars,
// building required, capacity 1–200, quietness 1–5, at most 8 amenities.
// Occupancy always starts at 0; openSeats equals capacity.
export function validateSpotInput(
  input: SpotFormInput
): { ok: true; data: ValidatedSpotInput } | SpotValidationFailure {
  const name = input.name.trim();
  const building = input.building.trim();
  const capacity = Math.floor(Number(input.capacity));
  const quietness = Math.floor(Number(input.quietness));
  const amenities = (input.amenities ?? [])
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (name.length < 3 || name.length > 60) {
    return { ok: false, error: "Name must be 3–60 characters." };
  }
  if (building.length < 1 || building.length > 80) {
    return { ok: false, error: "Building is required." };
  }
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 200) {
    return { ok: false, error: "Capacity must be 1–200." };
  }
  if (!Number.isFinite(quietness) || quietness < 1 || quietness > 5) {
    return { ok: false, error: "Quietness must be 1–5." };
  }
  if ((input.amenities ?? []).filter((a) => a.trim()).length > 8) {
    return { ok: false, error: "At most 8 amenities." };
  }
  return { ok: true, data: { name, building, capacity, quietness, amenities } };
}
