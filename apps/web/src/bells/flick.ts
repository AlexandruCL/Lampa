/** A flick of the wrist: true once when the rotation rate rises through the threshold, then not again for `refractoryMs`. */
export function createFlickDetector(thresholdDegPerS = 250, refractoryMs = 350): (rate: number, nowMs: number) => boolean {
  let above = false;
  let last = -Infinity;
  return (rate, nowMs) => {
    const was = above;
    above = rate >= thresholdDegPerS;
    if (!above || was || nowMs - last < refractoryMs) return false;
    last = nowMs;
    return true;
  };
}
