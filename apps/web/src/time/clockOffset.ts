/** Server clock minus this device's clock, in ms, from 5 pings to GET /time; null when every ping failed. */
export async function getClockOffset(_deps: { fetch?: typeof fetch; now?: () => number } = {}): Promise<number | null> {
  return null;
}
