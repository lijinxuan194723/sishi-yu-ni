export type MemoDocument = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinnedAt: number | null;
  folderId: string | null;
  starred: boolean;
  deletedAt: number | null;
};

export type MemoFolder = {
  id: string;
  name: string;
  createdAt: number;
};

export type MemoWorkspace = {
  version: 1;
  folders: MemoFolder[];
  memos: MemoDocument[];
};

export type MemoCategory = 'all' | 'starred' | 'trash' | `folder:${string}`;

export const MEMO_STORAGE_KEY = 'luke-memo-workspace-v1';
export const MEMO_WORKSPACE_VERSION = 1 as const;

export function emptyMemoWorkspace(): MemoWorkspace {
  return {version: MEMO_WORKSPACE_VERSION, folders: [], memos: []};
}

export function createMemo(now = Date.now(), folderId: string | null = null): MemoDocument {
  return {
    id: crypto.randomUUID(),
    title: '',
    body: '',
    createdAt: now,
    updatedAt: now,
    pinnedAt: null,
    folderId,
    starred: false,
    deletedAt: null,
  };
}

export function createMemoFolder(name: string, now = Date.now()): MemoFolder {
  return {id: crypto.randomUUID(), name: name.trim().slice(0, 30), createdAt: now};
}

export function memoDisplayTitle(memo: Pick<MemoDocument, 'title' | 'body'>): string {
  const explicit = memo.title.trim();
  if (explicit) return explicit;
  const first = memo.body
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);
  if (!first) return '无标题备忘';
  return first
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^>\s*/, '')
    .slice(0, 48) || '无标题备忘';
}

export function memoExcerpt(memo: Pick<MemoDocument, 'body'>, max = 110): string {
  const text = memo.body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片]')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function memoMatches(memo: MemoDocument, query: string, folderName = ''): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return `${memo.title}\n${memo.body}\n${folderName}`.toLocaleLowerCase().includes(q);
}

export function memoInCategory(memo: MemoDocument, category: MemoCategory): boolean {
  if (category === 'trash') return memo.deletedAt !== null;
  if (memo.deletedAt !== null) return false;
  if (category === 'starred') return memo.starred;
  if (category === 'all') return true;
  return memo.folderId === category.slice('folder:'.length);
}

export function sortMemos(memos: MemoDocument[], trash = false): MemoDocument[] {
  return [...memos].sort((a, b) => {
    if (trash) return (b.deletedAt ?? 0) - (a.deletedAt ?? 0);
    if (!!a.pinnedAt !== !!b.pinnedAt) return a.pinnedAt ? -1 : 1;
    if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) return b.pinnedAt - a.pinnedAt;
    return b.updatedAt - a.updatedAt;
  });
}

export function parseMemoWorkspace(raw: string | null): MemoWorkspace {
  if (!raw) return emptyMemoWorkspace();
  const p: unknown = JSON.parse(raw);
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('备忘数据格式不正确');
  const value = p as Partial<MemoWorkspace>;
  if (value.version !== MEMO_WORKSPACE_VERSION || !Array.isArray(value.folders) || !Array.isArray(value.memos)) {
    throw new Error('备忘数据版本不兼容');
  }
  if (value.folders.length > 100 || value.memos.length > 3000) throw new Error('备忘数据数量异常');
  const string = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
  const validTime = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 8640000000000000;
  const folderIds = new Set<string>();
  const folders = value.folders.map(folder => {
    if (!folder || typeof folder !== 'object') throw new Error('备忘分类格式不正确');
    const f = folder as MemoFolder;
    if (!string(f.id, 100) || !string(f.name, 30) || !f.name.trim() || !validTime(f.createdAt) || folderIds.has(f.id)) {
      throw new Error('备忘分类格式不正确');
    }
    folderIds.add(f.id);
    return {id: f.id, name: f.name.trim(), createdAt: f.createdAt};
  });
  const memoIds = new Set<string>();
  const memos = value.memos.map(memo => {
    if (!memo || typeof memo !== 'object') throw new Error('备忘内容格式不正确');
    const m = memo as MemoDocument;
    if (
      !string(m.id, 100) || memoIds.has(m.id) || !string(m.title, 300) || !string(m.body, 100000) ||
      !validTime(m.createdAt) || !validTime(m.updatedAt) || m.updatedAt < m.createdAt ||
      !(m.pinnedAt === null || validTime(m.pinnedAt)) || !(m.folderId === null || (string(m.folderId, 100) && folderIds.has(m.folderId))) ||
      typeof m.starred !== 'boolean' || !(m.deletedAt === null || validTime(m.deletedAt))
    ) throw new Error('备忘内容格式不正确');
    memoIds.add(m.id);
    return {
      id: m.id,
      title: m.title,
      body: m.body,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      pinnedAt: m.pinnedAt,
      folderId: m.folderId,
      starred: m.starred,
      deletedAt: m.deletedAt,
    };
  });
  return {version: MEMO_WORKSPACE_VERSION, folders, memos};
}

export function workspaceCounts(workspace: MemoWorkspace) {
  const active = workspace.memos.filter(m => m.deletedAt === null);
  return {
    all: active.length,
    starred: active.filter(m => m.starred).length,
    trash: workspace.memos.filter(m => m.deletedAt !== null).length,
    folders: Object.fromEntries(workspace.folders.map(f => [f.id, active.filter(m => m.folderId === f.id).length])) as Record<string, number>,
  };
}
