'use client';

import {Fragment, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {
  ArchiveRestore,
  CheckSquare2,
  ChevronDown,
  Clipboard,
  Download,
  FileDown,
  FileText,
  Folder,
  FolderPlus,
  ImageDown,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  MEMO_STORAGE_KEY,
  createMemo,
  createMemoFolder,
  emptyMemoWorkspace,
  memoDisplayTitle,
  memoExcerpt,
  memoInCategory,
  memoMatches,
  parseMemoWorkspace,
  sortMemos,
  workspaceCounts,
  type MemoCategory,
  type MemoDocument,
  type MemoWorkspace,
} from '@/lib/memos';
import {saveBackupFile} from '@/lib/mobile';
import styles from './memo-board.module.css';

const dtf = new Intl.DateTimeFormat('zh-CN', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false});

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60) || '无标题备忘';
}

function memoMarkdown(memo: MemoDocument) {
  const title = memo.title.trim();
  if (!title) return memo.body;
  return `# ${title}\n\n${memo.body}`.trimEnd();
}

function exportMarkdown(memo: MemoDocument) {
  downloadBlob(`${safeName(memoDisplayTitle(memo))}.md`, new Blob([memoMarkdown(memo)], {type: 'text/markdown;charset=utf-8'}));
}

function exportHtml(memo: MemoDocument) {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
  const title = escape(memoDisplayTitle(memo));
  const body = escape(memo.body);
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{margin:0;background:#faf7f1;color:#514337;font:16px/1.9 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}.paper{box-sizing:border-box;max-width:820px;margin:40px auto;padding:52px 56px;background:#fffcf8;border:1px solid #eee2d3;border-radius:22px;box-shadow:0 12px 36px #6c462812}h1{font:34px/1.35 Georgia,"Songti SC",serif;margin:0 0 30px}.body{white-space:pre-wrap;overflow-wrap:anywhere}.foot{margin-top:38px;padding-top:14px;border-top:1px solid #eee2d3;color:#a18c73;font-size:12px}@media(max-width:700px){.paper{margin:0;border:0;border-radius:0;min-height:100vh;padding:32px 22px}}</style><body><article class="paper"><h1>${title}</h1><div class="body">${body}</div><div class="foot">四时与你 · 备忘</div></article></body></html>`;
  downloadBlob(`${safeName(memoDisplayTitle(memo))}.html`, new Blob([html], {type: 'text/html;charset=utf-8'}));
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '';
    for (const char of paragraph) {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = char; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function exportPng(memo: MemoDocument) {
  const canvas = document.createElement('canvas');
  const width = 1240, padding = 92, bodyWidth = width - padding * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.font = '32px "Microsoft YaHei", sans-serif';
  const bodyLines = wrapCanvasText(ctx, memo.body || ' ', bodyWidth);
  const height = Math.min(5200, Math.max(900, 300 + bodyLines.length * 54));
  canvas.width = width; canvas.height = height;
  const style = getComputedStyle(document.documentElement);
  ctx.fillStyle = style.getPropertyValue('--background').trim() || '#faf7f1'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fffcf8'; ctx.fillRect(34, 34, width - 68, height - 68);
  ctx.strokeStyle = style.getPropertyValue('--border').trim() || '#eee2d3'; ctx.lineWidth = 2; ctx.strokeRect(34, 34, width - 68, height - 68);
  ctx.fillStyle = style.getPropertyValue('--foreground').trim() || '#514337';
  ctx.font = 'bold 48px Georgia, "Microsoft YaHei", serif';
  const titleLines = wrapCanvasText(ctx, memoDisplayTitle(memo), bodyWidth).slice(0, 3);
  let y = 120;
  for (const line of titleLines) { ctx.fillText(line, padding, y); y += 62; }
  y += 22; ctx.strokeStyle = '#eee2d3'; ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke(); y += 54;
  ctx.font = '32px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#655447';
  for (const line of bodyLines) { if (y > height - 130) break; ctx.fillText(line, padding, y); y += 54; }
  ctx.font = '24px "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#a18c73'; ctx.fillText('四时与你 · 备忘', padding, height - 78);
  canvas.toBlob(blob => blob && downloadBlob(`${safeName(memoDisplayTitle(memo))}.png`, blob), 'image/png');
}

function InlinePreview({body}: {body: string}) {
  const lines = body.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let inCode = false, code: string[] = [];
  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCode) { nodes.push(<pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>); code = []; }
      inCode = !inCode; return;
    }
    if (inCode) { code.push(line); return; }
    const key = `${index}-${line.slice(0, 8)}`;
    if (/^###\s+/.test(line)) nodes.push(<h3 key={key}>{line.replace(/^###\s+/, '')}</h3>);
    else if (/^##\s+/.test(line)) nodes.push(<h2 key={key}>{line.replace(/^##\s+/, '')}</h2>);
    else if (/^#\s+/.test(line)) nodes.push(<h1 key={key}>{line.replace(/^#\s+/, '')}</h1>);
    else if (/^>\s?/.test(line)) nodes.push(<blockquote key={key}>{line.replace(/^>\s?/, '')}</blockquote>);
    else if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      const checked = /^[-*+]\s+\[[xX]\]/.test(line);
      nodes.push(<p key={key}><CheckSquare2 size={15} style={{verticalAlign: '-2px', marginRight: 7}}/>{checked ? '已完成 · ' : '待办 · '}{line.replace(/^[-*+]\s+\[[ xX]\]\s+/, '')}</p>);
    } else if (/^[-*+]\s+/.test(line)) nodes.push(<p key={key}>• {line.replace(/^[-*+]\s+/, '')}</p>);
    else if (/^\d+[.)]\s+/.test(line)) nodes.push(<p key={key}>{line}</p>);
    else nodes.push(line ? <p key={key}>{line}</p> : <br key={key}/>);
  });
  if (code.length) nodes.push(<pre key="code-last"><code>{code.join('\n')}</code></pre>);
  return <div className={styles.preview}>{nodes}</div>;
}

export function MemoBoard() {
  const [workspace, setWorkspace] = useState<MemoWorkspace>(() => emptyMemoWorkspace());
  const [loaded, setLoaded] = useState(false), [status, setStatus] = useState('正在读取本地备忘…');
  const [category, setCategory] = useState<MemoCategory>('all'), [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null), [preview, setPreview] = useState(false), [folderDraft, setFolderDraft] = useState('');
  const titleRef = useRef<HTMLInputElement>(null), persistenceBlocked = useRef(false), rawBackup = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMO_STORAGE_KEY); rawBackup.current = raw;
      setWorkspace(parseMemoWorkspace(raw)); setStatus('已保存在本机');
    } catch {
      persistenceBlocked.current = true; setWorkspace(emptyMemoWorkspace());
      setStatus('原备忘数据无法读取，已停止自动写入，避免覆盖原始数据。');
    } finally { setLoaded(true); }
  }, []);
  useEffect(() => {
    if (!loaded || persistenceBlocked.current) return;
    try { localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(workspace)); setStatus('已保存在本机'); }
    catch { setStatus('保存失败：本地存储空间可能不足，请先导出全部备忘。'); }
  }, [workspace, loaded]);
  useEffect(() => { if (activeId) requestAnimationFrame(() => titleRef.current?.focus()); }, [activeId]);

  const folders = useMemo(() => new Map(workspace.folders.map(f => [f.id, f.name])), [workspace.folders]);
  const counts = useMemo(() => workspaceCounts(workspace), [workspace]);
  const visible = useMemo(() => sortMemos(workspace.memos.filter(m => memoInCategory(m, category) && memoMatches(m, query, m.folderId ? folders.get(m.folderId) ?? '' : '')), category === 'trash'), [workspace.memos, category, query, folders]);
  const active = workspace.memos.find(m => m.id === activeId) ?? null;

  function allowWrite() {
    if (!persistenceBlocked.current) return true;
    const proceed = window.confirm('原备忘数据格式异常。继续操作会用新的备忘数据替换它。建议先点“导出全部”保存原始数据。仍要继续吗？');
    if (!proceed) return false;
    persistenceBlocked.current = false; setStatus('已启用新的备忘工作区'); return true;
  }

  function mutate(id: string, patch: Partial<MemoDocument> | ((memo: MemoDocument) => Partial<MemoDocument>), touch = true) {
    if (!allowWrite()) return;
    setWorkspace(current => ({...current, memos: current.memos.map(m => m.id === id ? {...m, ...(typeof patch === 'function' ? patch(m) : patch), ...(touch ? {updatedAt: Date.now()} : {})} : m)}));
  }
  function addMemo() {
    if (!allowWrite()) return;
    const folderId = category.startsWith('folder:') ? category.slice(7) : null;
    const memo = createMemo(Date.now(), folderId);
    setWorkspace(current => ({...current, memos: [memo, ...current.memos]}));
    setCategory(folderId ? `folder:${folderId}` : 'all'); setQuery(''); setPreview(false); setActiveId(memo.id);
  }
  function addFolder() {
    if (!allowWrite()) return;
    const name = folderDraft.trim(); if (!name) return;
    const folder = createMemoFolder(name);
    setWorkspace(current => ({...current, folders: [...current.folders, folder]})); setFolderDraft(''); setCategory(`folder:${folder.id}`);
  }
  function renameFolder(id: string) {
    if (!allowWrite()) return;
    const existing = folders.get(id) ?? '';
    const next = window.prompt('分类名称', existing)?.trim();
    if (!next || next === existing) return;
    setWorkspace(current => ({...current, folders: current.folders.map(f => f.id === id ? {...f, name: next.slice(0, 30)} : f)}));
  }
  function removeFolder(id: string) {
    if (!allowWrite()) return;
    if (!window.confirm(`删除分类“${folders.get(id) ?? ''}”？分类中的备忘会保留在“全部”。`)) return;
    setWorkspace(current => ({...current, folders: current.folders.filter(f => f.id !== id), memos: current.memos.map(m => m.folderId === id ? {...m, folderId: null, updatedAt: Date.now()} : m)}));
    if (category === `folder:${id}`) setCategory('all');
  }
  function trashMemo(memo: MemoDocument) {
    mutate(memo.id, {deletedAt: Date.now(), pinnedAt: null}, false); setActiveId(null); if (category !== 'trash') setCategory('all');
  }
  function restoreMemo(memo: MemoDocument) { mutate(memo.id, {deletedAt: null}, false); }
  function deleteForever(memo: MemoDocument) {
    if (!allowWrite()) return;
    if (!window.confirm(`永久删除“${memoDisplayTitle(memo)}”？此操作无法撤销。`)) return;
    setWorkspace(current => ({...current, memos: current.memos.filter(m => m.id !== memo.id)})); if (activeId === memo.id) setActiveId(null);
  }
  async function copyMarkdown(memo: MemoDocument) {
    const text = memoMarkdown(memo);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.append(area); area.select(); if (!document.execCommand('copy')) throw new Error(); area.remove();
      }
      setStatus('Markdown 已复制到剪贴板');
    } catch { setStatus('复制失败，请检查浏览器剪贴板权限。'); }
  }
  function exportAll() {
    const date = new Date().toISOString().slice(0, 10);
    const raw = persistenceBlocked.current && rawBackup.current ? rawBackup.current : JSON.stringify(workspace, null, 2);
    saveBackupFile(`四时与你-备忘-${date}${persistenceBlocked.current ? '-原始数据' : ''}.json`, raw);
  }
  async function importAll(file: File | undefined, input?: HTMLInputElement) {
    if (!file) return;
    try {
      const next = parseMemoWorkspace(await file.text());
      if (!window.confirm(`导入后将替换当前 ${workspace.memos.length} 条备忘。继续吗？`)) return;
      persistenceBlocked.current = false; rawBackup.current = JSON.stringify(next); setWorkspace(next); setActiveId(null); setCategory('all'); setQuery(''); setStatus(`已导入 ${next.memos.length} 条备忘`);
    } catch (e) { setStatus(e instanceof Error ? e.message : '导入失败'); }
    finally { if (input) input.value = ''; }
  }

  const categoryButton = (value: MemoCategory, label: string, count: number, Icon: typeof FileText) => <button className={styles.category} data-active={category === value} onClick={() => {setCategory(value); setActiveId(null);}}><Icon size={16}/><span>{label}</span><span className={styles.count}>{count}</span></button>;

  return <>
    <input id="note" className={styles.bridge} tabIndex={-1} aria-hidden="true" onFocus={addMemo}/>
    <p className={styles.sectionNote}>像锤子便签一样快速记下内容：多便签、分类、搜索、置顶、星标、回收站与分享导出；数据默认只保存在当前设备。</p>
    <div className={styles.shell}>
      <aside className={styles.side} aria-label="备忘分类">
        <div className={styles.sideTitle}><strong>备忘分类</strong><Folder size={16}/></div>
        {categoryButton('all', '全部', counts.all, FileText)}
        {categoryButton('starred', '星标', counts.starred, Star)}
        {workspace.folders.map(folder => <div className={styles.folderRow} key={folder.id}>{categoryButton(`folder:${folder.id}`, folder.name, counts.folders[folder.id] ?? 0, Folder)}<button className={styles.mini} aria-label={`管理分类 ${folder.name}`} title="右键式管理：点击重命名，Shift+点击删除" onClick={e => e.shiftKey ? removeFolder(folder.id) : renameFolder(folder.id)}><ChevronDown size={14}/></button></div>)}
        {categoryButton('trash', '回收站', counts.trash, Trash2)}
        <form className={styles.folderForm} onSubmit={e => {e.preventDefault(); addFolder();}}><input value={folderDraft} maxLength={30} onChange={e => setFolderDraft(e.target.value)} placeholder="新建分类" aria-label="新建备忘分类"/><button className="round" disabled={!folderDraft.trim()} aria-label="添加分类"><FolderPlus size={16}/></button></form>
        <div className={styles.dataTools}><button onClick={exportAll}><Download size={14}/> 导出全部</button><label><Upload size={14}/> 导入<input type="file" accept="application/json,.json" hidden onChange={e => void importAll(e.target.files?.[0], e.currentTarget)}/></label></div>
        <div className={styles.mobileCategory} aria-label="备忘分类快捷切换">
          {[['all','全部',counts.all],['starred','星标',counts.starred],...workspace.folders.map(f => [`folder:${f.id}`,f.name,counts.folders[f.id] ?? 0]),['trash','回收站',counts.trash]].map(([value,label,count]) => <button key={String(value)} data-active={category === value} onClick={() => {setCategory(value as MemoCategory); setActiveId(null);}}>{String(label)} <span>{Number(count)}</span></button>)}
        </div>
        <details className={styles.mobileFolders}><summary><FolderPlus size={14}/> 管理分类</summary><div className={styles.mobileFolderPanel}>{workspace.folders.map(folder => <div className={styles.mobileFolderItem} key={folder.id}><span>{folder.name}<small>{counts.folders[folder.id] ?? 0}</small></span><button onClick={() => renameFolder(folder.id)}>重命名</button><button className={styles.mobileFolderDelete} onClick={() => removeFolder(folder.id)}>删除</button></div>)}{!workspace.folders.length && <p>还没有自定义分类。</p>}<form className={styles.mobileFolderForm} onSubmit={e => {e.preventDefault(); addFolder();}}><input value={folderDraft} maxLength={30} onChange={e => setFolderDraft(e.target.value)} placeholder="新建分类" aria-label="新建移动端备忘分类"/><button disabled={!folderDraft.trim()}><Plus size={15}/> 添加</button></form></div></details>
      </aside>
      <div className={styles.main}>
        <div className={styles.toolbar}><label className={styles.search}><Search size={18}/><input value={query} maxLength={200} onChange={e => setQuery(e.target.value)} placeholder="搜索标题、正文或分类…" aria-label="搜索备忘"/></label><button className={styles.newButton} onClick={addMemo}><Plus size={18}/><span>新建备忘</span></button></div>
        <div className={styles.dataToolsMobile}><button onClick={exportAll}><Download size={14}/> 导出全部</button><label><Upload size={14}/> 导入<input type="file" accept="application/json,.json" hidden onChange={e => void importAll(e.target.files?.[0], e.currentTarget)}/></label></div>
        <div className={styles.status} role="status">{status}</div>
        {active && active.deletedAt === null && <section className={styles.editor} aria-label="编辑备忘">
          <div className={styles.editorTop}><input ref={titleRef} value={active.title} maxLength={300} onChange={e => mutate(active.id, {title: e.target.value})} placeholder="标题（可不填，会自动取正文第一行）" aria-label="备忘标题"/><button className={styles.iconButton} data-on={!!active.pinnedAt} title={active.pinnedAt ? '取消置顶' : '置顶'} aria-label={active.pinnedAt ? '取消置顶' : '置顶'} onClick={() => mutate(active.id, {pinnedAt: active.pinnedAt ? null : Date.now()}, false)}><Pin size={17}/></button><button className={styles.iconButton} data-on={active.starred} title={active.starred ? '取消星标' : '星标'} aria-label={active.starred ? '取消星标' : '星标'} onClick={() => mutate(active.id, {starred: !active.starred}, false)}><Star size={17} fill={active.starred ? 'currentColor' : 'none'}/></button><button className={styles.iconButton} title="关闭编辑" aria-label="关闭编辑" onClick={() => setActiveId(null)}><X size={17}/></button></div>
          <div className={styles.editorMeta}><select value={active.folderId ?? ''} aria-label="备忘分类" onChange={e => mutate(active.id, {folderId: e.target.value || null})}><option value="">未分类</option>{workspace.folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select><span className={styles.timestamp}>更新 {dtf.format(active.updatedAt)} · 自动保存</span><div className={styles.modeSwitch} aria-label="编辑或预览"><button data-active={!preview} onClick={() => setPreview(false)}>编辑</button><button data-active={preview} onClick={() => setPreview(true)}>预览</button></div></div>
          {preview ? <InlinePreview body={active.body}/> : <textarea className={styles.textarea} value={active.body} maxLength={100000} onChange={e => mutate(active.id, {body: e.target.value})} placeholder={'从一句话开始……\n\n支持简单 Markdown：# 标题、- 列表、- [ ] 待办、> 引用、```代码```'} aria-label="备忘正文"/>}
          <div className={styles.editorActions}><button className={styles.action} onClick={() => void copyMarkdown(active)}><Clipboard size={15}/> 复制 Markdown</button><details className={styles.exportMenu}><summary><FileDown size={15}/> 分享与导出 <ChevronDown size={13}/></summary><div className={styles.menu}><button onClick={() => exportMarkdown(active)}><FileText size={14}/> Markdown 文件</button><button onClick={() => exportPng(active)}><ImageDown size={14}/> PNG 便签图</button><button onClick={() => exportHtml(active)}><FileDown size={14}/> HTML 离线页</button></div></details><button className={`${styles.action} ${styles.danger}`} onClick={() => trashMemo(active)}><Trash2 size={15}/> 移到回收站</button></div>
        </section>}
        {visible.length ? <div className={styles.list}>{visible.map(memo => <Fragment key={memo.id}><article className={styles.memoCard} data-active={activeId === memo.id} role={memo.deletedAt === null ? 'button' : undefined} tabIndex={memo.deletedAt === null ? 0 : undefined} onKeyDown={e => {if (memo.deletedAt === null && (e.key === 'Enter' || e.key === ' ')) {e.preventDefault(); setActiveId(memo.id);}}} onClick={() => memo.deletedAt === null && setActiveId(memo.id)}><div className={styles.cardHead}><strong>{memoDisplayTitle(memo)}</strong><span className={styles.badges}>{memo.pinnedAt && <Pin size={14}/>} {memo.starred && <Star size={14} fill="currentColor"/>}</span></div><p>{memoExcerpt(memo) || '还没有正文内容。'}</p><div className={styles.cardFoot}>{memo.folderId && <span className={styles.folderPill}>{folders.get(memo.folderId) ?? '未分类'}</span>}<time dateTime={new Date(memo.updatedAt).toISOString()}>{dtf.format(memo.deletedAt ?? memo.updatedAt)}</time></div>{memo.deletedAt !== null && <div className={styles.trashActions} onClick={e => e.stopPropagation()}><button className={styles.restore} onClick={() => restoreMemo(memo)}><ArchiveRestore size={13}/> 恢复</button><button className={styles.deleteForever} onClick={() => deleteForever(memo)}><X size={13}/> 永久删除</button></div>}</article></Fragment>)}</div> : <div className={styles.emptyPanel}><FileText size={28}/><strong>{query ? '没有找到匹配的备忘' : category === 'trash' ? '回收站是空的' : '还没有备忘'}</strong><span>{query ? '换个关键词试试。' : category === 'trash' ? '删除的备忘会先留在这里。' : '点击“新建备忘”，先记下一件小事。'}</span></div>}
      </div>
    </div>
  </>;
}
