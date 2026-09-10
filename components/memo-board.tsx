'use client';

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
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

const updatedFormat = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function categoryLabel(category: MemoCategory, workspace: MemoWorkspace) {
  if (category === 'all') return '全部备忘';
  if (category === 'starred') return '星标备忘';
  if (category === 'trash') return '回收站';
  return workspace.folders.find(folder => folder.id === category.slice(7))?.name ?? '全部备忘';
}

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60) || '无标题备忘';
}

function markdownOf(memo: MemoDocument) {
  const title = memo.title.trim();
  return title ? `# ${title}\n\n${memo.body}`.trimEnd() : memo.body;
}

function InlinePreview({memo}: {memo: MemoDocument}) {
  const source = memo.body;
  const nodes: ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;
  source.split(/\r?\n/).forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCode) { nodes.push(<pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>); code = []; }
      inCode = !inCode;
      return;
    }
    if (inCode) { code.push(line); return; }
    const key = `${index}-${line.slice(0, 10)}`;
    if (/^###\s+/.test(line)) nodes.push(<h3 key={key}>{line.replace(/^###\s+/, '')}</h3>);
    else if (/^##\s+/.test(line)) nodes.push(<h2 key={key}>{line.replace(/^##\s+/, '')}</h2>);
    else if (/^#\s+/.test(line)) nodes.push(<h1 key={key}>{line.replace(/^#\s+/, '')}</h1>);
    else if (/^>\s?/.test(line)) nodes.push(<blockquote key={key}>{line.replace(/^>\s?/, '')}</blockquote>);
    else if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      const checked = /^[-*+]\s+\[[xX]\]/.test(line);
      nodes.push(<p key={key} className={styles.checkline}><Check size={15}/><span>{line.replace(/^[-*+]\s+\[[ xX]\]\s+/, '')}</span>{checked&&<small>完成</small>}</p>);
    } else if (/^[-*+]\s+/.test(line)) nodes.push(<p key={key}>• {line.replace(/^[-*+]\s+/, '')}</p>);
    else if (line) nodes.push(<p key={key}>{line}</p>);
    else nodes.push(<br key={key}/>);
  });
  if (code.length) nodes.push(<pre key="code-last"><code>{code.join('\n')}</code></pre>);
  return <div className={styles.preview}>{nodes.length ? nodes : <p className={styles.previewEmpty}>这里还没有内容。</p>}</div>;
}

export function MemoBoard() {
  const [workspace, setWorkspace] = useState<MemoWorkspace>(() => emptyMemoWorkspace());
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('正在读取备忘…');
  const [category, setCategory] = useState<MemoCategory>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const blocked = useRef(false);
  const originalRaw = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMO_STORAGE_KEY);
      originalRaw.current = raw;
      const next = parseMemoWorkspace(raw);
      setWorkspace(next);
      setStatus('自动保存到本机');
    } catch {
      blocked.current = true;
      setStatus('原备忘数据异常，已暂停写入');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || blocked.current) return;
    try {
      localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(workspace));
      setStatus('自动保存到本机');
    } catch {
      setStatus('保存失败，请先导出备份');
    }
  }, [workspace, loaded]);

  useEffect(() => {
    if (!activeId) return;
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [activeId]);

  const folderNames = useMemo(() => new Map(workspace.folders.map(folder => [folder.id, folder.name])), [workspace.folders]);
  const counts = useMemo(() => workspaceCounts(workspace), [workspace]);
  const visible = useMemo(() => sortMemos(
    workspace.memos.filter(memo => memoInCategory(memo, category) && memoMatches(memo, query, memo.folderId ? folderNames.get(memo.folderId) ?? '' : '')),
    category === 'trash',
  ), [workspace.memos, category, query, folderNames]);
  const active = workspace.memos.find(memo => memo.id === activeId) ?? null;

  function allowWrite() {
    if (!blocked.current) return true;
    const ok = window.confirm('检测到旧备忘数据异常。继续会建立新的备忘工作区，建议先导出原始数据。仍然继续吗？');
    if (!ok) return false;
    blocked.current = false;
    return true;
  }

  function updateMemo(id: string, patch: Partial<MemoDocument> | ((memo: MemoDocument) => Partial<MemoDocument>), touch = true) {
    if (!allowWrite()) return;
    setWorkspace(current => ({
      ...current,
      memos: current.memos.map(memo => memo.id === id ? {
        ...memo,
        ...(typeof patch === 'function' ? patch(memo) : patch),
        ...(touch ? {updatedAt: Date.now()} : {}),
      } : memo),
    }));
  }

  function newMemo() {
    if (!allowWrite()) return;
    const folderId = category.startsWith('folder:') ? category.slice(7) : null;
    const memo = createMemo(Date.now(), folderId);
    setWorkspace(current => ({...current, memos: [memo, ...current.memos]}));
    setCategory(folderId ? `folder:${folderId}` : 'all');
    setQuery('');
    setPreview(false);
    setMoreOpen(false);
    setActiveId(memo.id);
  }

  function closeEditor() {
    setMoreOpen(false);
    setPreview(false);
    setActiveId(null);
  }

  function moveToTrash(memo: MemoDocument) {
    updateMemo(memo.id, {deletedAt: Date.now(), pinnedAt: null}, false);
    closeEditor();
  }

  function restoreMemo(memo: MemoDocument) {
    updateMemo(memo.id, {deletedAt: null}, false);
    setCategory('all');
  }

  function deleteForever(memo: MemoDocument) {
    if (!allowWrite() || !window.confirm(`永久删除“${memoDisplayTitle(memo)}”？此操作无法撤销。`)) return;
    setWorkspace(current => ({...current, memos: current.memos.filter(item => item.id !== memo.id)}));
    if (activeId === memo.id) closeEditor();
  }

  function newFolder() {
    if (!allowWrite()) return;
    const name = window.prompt('新建分类名称')?.trim();
    if (!name) return;
    const folder = createMemoFolder(name);
    setWorkspace(current => ({...current, folders: [...current.folders, folder]}));
    setCategory(`folder:${folder.id}`);
    setCategoryOpen(false);
  }

  function deleteFolder(id: string) {
    if (!allowWrite()) return;
    const name = folderNames.get(id) ?? '';
    if (!window.confirm(`删除分类“${name}”？里面的备忘不会删除，会回到“全部备忘”。`)) return;
    setWorkspace(current => ({
      ...current,
      folders: current.folders.filter(folder => folder.id !== id),
      memos: current.memos.map(memo => memo.folderId === id ? {...memo, folderId: null, updatedAt: Date.now()} : memo),
    }));
    if (category === `folder:${id}`) setCategory('all');
  }

  function selectCategory(next: MemoCategory) {
    setCategory(next);
    setCategoryOpen(false);
    setActiveId(null);
    setQuery('');
  }

  async function copyMemo(memo: MemoDocument) {
    try {
      await navigator.clipboard.writeText(markdownOf(memo));
      setStatus('已复制全文');
    } catch {
      setStatus('复制失败，请检查剪贴板权限');
    }
    setMoreOpen(false);
  }

  function exportMemo(memo: MemoDocument) {
    saveBackupFile(`${safeName(memoDisplayTitle(memo))}.md`, markdownOf(memo));
    setMoreOpen(false);
  }

  function exportAll() {
    const raw = blocked.current && originalRaw.current ? originalRaw.current : JSON.stringify(workspace, null, 2);
    saveBackupFile(`四时与你-备忘-${new Date().toISOString().slice(0, 10)}.json`, raw);
    setMoreOpen(false);
  }

  function formatSelection(kind: 'title'|'bold'|'list'|'check'|'quote') {
    const memo = active;
    const area = bodyRef.current;
    if (!memo || !area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const source = memo.body;
    const before = source.slice(0, start);
    const chosen = source.slice(start, end);
    const after = source.slice(end);
    let next = source;
    let nextStart = start;
    let nextEnd = end;
    if (kind === 'bold') {
      next = `${before}**${chosen || '文字'}**${after}`;
      nextStart = start + 2;
      nextEnd = nextStart + (chosen || '文字').length;
    } else {
      const prefix = kind === 'title' ? '# ' : kind === 'list' ? '- ' : kind === 'check' ? '- [ ] ' : '> ';
      const lineStart = source.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      next = `${source.slice(0, lineStart)}${prefix}${source.slice(lineStart)}`;
      nextStart = start + prefix.length;
      nextEnd = end + prefix.length;
    }
    updateMemo(memo.id, {body: next});
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(nextStart, nextEnd);
    });
  }

  const categoryRow = (value: MemoCategory, label: string, count: number, icon: ReactNode) => <button key={value} className={styles.categoryRow} data-active={category===value} onClick={()=>selectCategory(value)}>{icon}<span>{label}</span><small>{count}</small></button>;

  return <section className={styles.shell} data-editor-open={!!active}>
    <header className={styles.topbar}>
      <div className={styles.categoryWrap}>
        <button className={styles.categoryTrigger} aria-expanded={categoryOpen} onClick={()=>setCategoryOpen(value=>!value)}>
          <span>{categoryLabel(category, workspace)}</span><ChevronDown size={16}/>
        </button>
        {categoryOpen&&<div className={styles.categoryMenu}>
          {categoryRow('all','全部备忘',counts.all,<FileText size={17}/>)}
          {categoryRow('starred','星标备忘',counts.starred,<Star size={17}/>)}
          {workspace.folders.length>0&&<div className={styles.menuDivider}/>}          
          {workspace.folders.map(folder=><div className={styles.folderRow} key={folder.id}>
            <button data-active={category===`folder:${folder.id}`} onClick={()=>selectCategory(`folder:${folder.id}`)}><Folder size={17}/><span>{folder.name}</span><small>{counts.folders[folder.id]??0}</small></button>
            <button className={styles.folderDelete} aria-label={`删除分类 ${folder.name}`} onClick={()=>deleteFolder(folder.id)}>×</button>
          </div>)}
          <button className={styles.newFolder} onClick={newFolder}><FolderPlus size={17}/><span>新建分类</span></button>
          <div className={styles.menuDivider}/>
          {categoryRow('trash','回收站',counts.trash,<Trash2 size={17}/>)}
        </div>}
      </div>
      <label className={styles.search}><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索备忘" aria-label="搜索备忘"/></label>
      <button className={styles.newButton} onClick={newMemo}><Plus size={20}/><span>新建</span></button>
    </header>

    <div className={styles.workspace}>
      <aside className={styles.listPane} aria-label="备忘列表">
        <div className={styles.listMeta}><span>{visible.length} 条</span><small>{status}</small></div>
        <div className={styles.list}>
          {visible.map(memo=><div className={styles.listItem} data-active={memo.id===activeId} key={memo.id}>
            <button className={styles.listSelect} onClick={()=>{setActiveId(memo.id);setPreview(false);setMoreOpen(false);}}>
              <div className={styles.listTitle}><strong>{memoDisplayTitle(memo)}</strong><span>{memo.pinnedAt&&<Pin size={13} fill="currentColor"/>}{memo.starred&&<Star size={13} fill="currentColor"/>}</span></div>
              <p>{memoExcerpt(memo,72)||'空白备忘'}</p>
              <small>{updatedFormat.format(new Date(memo.updatedAt))}{memo.folderId&&folderNames.get(memo.folderId)?` · ${folderNames.get(memo.folderId)}`:''}</small>
            </button>
            {category==='trash'&&<div className={styles.trashActions}><button onClick={()=>restoreMemo(memo)}><RotateCcw size={14}/>恢复</button><button onClick={()=>deleteForever(memo)}><Trash2 size={14}/>删除</button></div>}
          </div>)}
          {!visible.length&&<div className={styles.emptyList}><FileText size={28}/><strong>{query?'没有找到':'这里还没有备忘'}</strong><p>{query?'换个关键词试试。':'点右上角“新建”，马上记一件事。'}</p></div>}
        </div>
      </aside>

      <main className={styles.editorPane}>
        {active?<>
          <div className={styles.editorHead}>
            <button className={styles.back} aria-label="返回备忘列表" onClick={closeEditor}><ArrowLeft size={20}/></button>
            <div className={styles.editorTitleWrap}>
              <input ref={titleRef} className={styles.titleInput} maxLength={300} placeholder="标题" value={active.title} onChange={event=>updateMemo(active.id,{title:event.target.value})}/>
              <small>{updatedFormat.format(new Date(active.updatedAt))}{active.folderId&&folderNames.get(active.folderId)?` · ${folderNames.get(active.folderId)}`:''}</small>
            </div>
            {active.deletedAt===null?<div className={styles.editorIcons}>
              <button aria-label={active.pinnedAt?'取消置顶':'置顶'} data-on={!!active.pinnedAt} onClick={()=>updateMemo(active.id,{pinnedAt:active.pinnedAt?null:Date.now()},false)}><Pin size={18} fill={active.pinnedAt?'currentColor':'none'}/></button>
              <button aria-label={active.starred?'取消星标':'星标'} data-on={active.starred} onClick={()=>updateMemo(active.id,{starred:!active.starred},false)}><Star size={18} fill={active.starred?'currentColor':'none'}/></button>
              <button aria-label={preview?'编辑':'预览'} data-on={preview} onClick={()=>setPreview(value=>!value)}>{preview?<Pencil size={18}/>:<Eye size={18}/>}</button>
              <div className={styles.moreWrap}>
                <button aria-label="更多操作" aria-expanded={moreOpen} onClick={()=>setMoreOpen(value=>!value)}><MoreHorizontal size={20}/></button>
                {moreOpen&&<div className={styles.moreMenu}>
                  <label><Folder size={16}/><span>移动到</span><select value={active.folderId??''} onChange={event=>{updateMemo(active.id,{folderId:event.target.value||null});setMoreOpen(false);}}><option value="">无分类</option>{workspace.folders.map(folder=><option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label>
                  <button onClick={()=>copyMemo(active)}><Clipboard size={16}/>复制全文</button>
                  <button onClick={()=>exportMemo(active)}><Download size={16}/>导出 Markdown</button>
                  <button onClick={exportAll}><Download size={16}/>导出全部备忘</button>
                  <div className={styles.menuDivider}/>
                  <button className={styles.deleteAction} onClick={()=>moveToTrash(active)}><Trash2 size={16}/>移到回收站</button>
                </div>}
              </div>
            </div>:<div className={styles.editorIcons}><button onClick={()=>restoreMemo(active)} aria-label="恢复"><RotateCcw size={18}/></button><button onClick={()=>deleteForever(active)} aria-label="永久删除"><Trash2 size={18}/></button></div>}
          </div>

          {preview?<InlinePreview memo={active}/>:<>
            <textarea ref={bodyRef} className={styles.bodyInput} maxLength={100000} value={active.body} placeholder="写点什么……" onChange={event=>updateMemo(active.id,{body:event.target.value})}/>
            <div className={styles.formatBar} aria-label="快速格式">
              <button onClick={()=>formatSelection('title')}>H1</button>
              <button onClick={()=>formatSelection('bold')}><b>B</b></button>
              <button onClick={()=>formatSelection('list')}>• 列表</button>
              <button onClick={()=>formatSelection('check')}>☐ 待办</button>
              <button onClick={()=>formatSelection('quote')}>“ 引用</button>
            </div>
          </>}
          <footer className={styles.editorFoot}><span>{status}</span><span>{active.body.length} 字符</span></footer>
        </>:<div className={styles.emptyEditor}><FileText size={35}/><strong>选一条备忘开始写</strong><p>内容会自动保存在本机。</p><button onClick={newMemo}><Plus size={17}/>新建备忘</button></div>}
      </main>
    </div>
  </section>;
}
