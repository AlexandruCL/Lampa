export type DemoPlace = { name: { ro: string; en: string }; lat: number; lng: number };

// The team picks the demo place (Blocked until they do). Set, `/curate?demo=1` starts the form with its name and location.
export const DEMO_PLACE: DemoPlace | null = null;
