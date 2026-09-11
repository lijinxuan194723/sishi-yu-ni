import type {AgentMemory} from './types.ts';

const DB_NAME = 'luke-agent';
const DB_VERSION = 1;
const STORE_MEMORIES = 'memories';
const FALLBACK_KEY = 'luke-agent-memory-v1';

type MemoryPersistenceSnapshot = {
  version: number;
  memories: AgentMemory[];
};

let dbPromise: Promise<IDBDatabase | null> | null = null;
let memoryFallback: AgentMemory[] = [];
let fallbackLoaded = false;

function supportsIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function supportsLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sortByUpdatedDesc(memories: AgentMemory[]): AgentMemory[] {
  return memories.slice().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

function persistFallback(): void {
  if (!supportsLocalStorage()) return;
  const payload: MemoryPersistenceSnapshot = {version: 1, memories: memoryFallback};
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload));
}

function hydrateFallback() {
  if (fallbackLoaded) return;
  fallbackLoaded = true;
  if (!supportsLocalStorage()) return;

  const raw = localStorage.getItem(FALLBACK_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as MemoryPersistenceSnapshot;
    if (Array.isArray(parsed?.memories)) memoryFallback = parsed.memories;
  } catch {}
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!supportsIndexedDB()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        const store = db.createObjectStore(STORE_MEMORIES, {keyPath: 'id'});
        store.createIndex('type', 'type', {unique: false});
        store.createIndex('status', 'status', {unique: false});
        store.createIndex('updatedAt', 'updatedAt', {unique: false});
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  return dbPromise;
}

async function readFromIndexedDB(): Promise<AgentMemory[]> {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_MEMORIES, 'readonly');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result ?? []) as AgentMemory[]);
    req.onerror = () => resolve([]);
  });
}

async function writeToIndexedDB(memories: AgentMemory[]): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    store.clear();
    for (const memory of memories) store.put(memory);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function listAllMemories(): Promise<AgentMemory[]> {
  if (supportsIndexedDB()) {
    const memoryDb = await readFromIndexedDB();
    if (memoryDb.length) return memoryDb;
  }

  hydrateFallback();
  return clone(memoryFallback);
}

export async function listActiveMemories(): Promise<AgentMemory[]> {
  const all = await listAllMemories();
  return all.filter((item) => item.status === 'active' || item.status === 'resolved');
}

export async function listMemoriesByTypes(types: AgentMemory['type'][]): Promise<AgentMemory[]> {
  const all = await listActiveMemories();
  const wanted = new Set(types);
  return all.filter((memory) => wanted.has(memory.type));
}

export async function saveMemory(memory: AgentMemory): Promise<AgentMemory> {
  const current = await listAllMemories();
  const existing = current.findIndex((item) => item.id === memory.id);
  if (existing >= 0) current[existing] = memory;
  else current.push(memory);

  const merged = sortByUpdatedDesc(current);

  if (supportsIndexedDB()) {
    await writeToIndexedDB(merged);
  } else {
    memoryFallback = merged;
    persistFallback();
  }
  return clone(memory);
}

export async function saveMemories(memories: AgentMemory[]): Promise<AgentMemory[]> {
  const current = await listAllMemories();
  const map = new Map(current.map((memory) => [memory.id, memory]));
  for (const memory of memories) map.set(memory.id, memory);
  const merged = sortByUpdatedDesc(Array.from(map.values()));
  if (supportsIndexedDB()) {
    await writeToIndexedDB(merged);
  } else {
    memoryFallback = merged;
    persistFallback();
  }
  return clone(merged);
}

export async function getMemory(id: string): Promise<AgentMemory | null> {
  const all = await listAllMemories();
  return clone(all.find((item) => item.id === id) ?? null);
}

export async function markMemoryStatus(id: string, status: AgentMemory['status'], extra?: Partial<AgentMemory>): Promise<void> {
  const existing = await getMemory(id);
  if (!existing) return;
  await saveMemory({...existing, ...extra, status, updatedAt: new Date().toISOString()});
}

export async function clearMemoriesForTest(): Promise<void> {
  memoryFallback = [];
  fallbackLoaded = true;
  if (supportsLocalStorage()) {
    localStorage.removeItem(FALLBACK_KEY);
  }
  if (supportsIndexedDB()) {
    await new Promise<void>((resolve) => {
      const db = dbPromise ? null : null;
      openDatabase().then((database) => {
        if (!database) {
          resolve();
          return;
        }
        const tx = database.transaction(STORE_MEMORIES, 'readwrite');
        const store = tx.objectStore(STORE_MEMORIES);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    });
  }
}

