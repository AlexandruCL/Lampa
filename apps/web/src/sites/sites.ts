// shortcut: approximate coordinates, a local Site shape and a local lamp flag until packages/shared/sites.json and Site land; swap the source and type here then

// The five fields of Cristea's proposed `Site`, declared here because `Site` is not on `main` yet.
export type PhoneSite = { id: string; name: string; lat: number; lng: number; is_memorial: boolean; lamp: boolean };

export const SITES: PhoneSite[] = [
  { id: "mx", name: "Muzeul MX Corneliu Miklosi", lat: 45.761, lng: 21.248, is_memorial: false, lamp: true },
  { id: "unirii", name: "Piața Unirii", lat: 45.7579, lng: 21.229, is_memorial: false, lamp: true },
  { id: "victoriei", name: "Piața Victoriei", lat: 45.7537, lng: 21.2253, is_memorial: false, lamp: true },
  { id: "bastion", name: "Theresia Bastion", lat: 45.7573, lng: 21.234, is_memorial: false, lamp: true },
  { id: "cathedral", name: "Metropolitan Cathedral", lat: 45.7507, lng: 21.2243, is_memorial: true, lamp: false },
];

export function findSite(id: string): PhoneSite | undefined {
  return SITES.find((s) => s.id === id);
}
