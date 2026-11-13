// The sites seen on this visit, in memory only: a reload starts afresh (Ionut's decision, hour 7).
const visited = new Set<string>();

export function markVisited(siteId: string): void {
  visited.add(siteId);
}

export function visitedSites(): ReadonlySet<string> {
  return new Set(visited);
}

export function resetVisited(): void {
  visited.clear();
}
