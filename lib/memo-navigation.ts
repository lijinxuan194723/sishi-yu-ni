export const memoBackLayers = ['move', 'menu', 'mood', 'selection', 'creatingFolder', 'notebooks', 'preview', 'editor', 'search', 'category'] as const;
export type MemoBackLayer = typeof memoBackLayers[number];
export function nextMemoBackLayer(state: Partial<Record<MemoBackLayer, boolean>>): MemoBackLayer | null {
 return memoBackLayers.find(layer => state[layer]) ?? null;
}
