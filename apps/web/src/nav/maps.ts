import type { LatLng } from "../geo/geo";

// Concept 7.6: walking directions in the phone's maps app; show both links on an iPhone.
export function googleMapsUrl(site: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}&travelmode=walking`;
}

export function appleMapsUrl(site: LatLng): string {
  return `https://maps.apple.com/?daddr=${site.lat},${site.lng}&dirflg=w`;
}

export function isIPhone(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}
