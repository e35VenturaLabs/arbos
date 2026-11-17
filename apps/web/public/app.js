// Arbos on the web: the iPhone app's screens at phone width, the Mac app's at desktop width.
// Chats are relay people chats of Grant plus one agent; the Store lists every agent.
(function () {
  const $ = id => document.getElementById(id);
  const app = $('app');
  const root = document.documentElement;
  const S = {
    chats: [], directory: [], agents: [], palette: null, current: null, page: null, query: '',
    msgs: {}, sending: {}, timers: [], frame: 0,
  };
  const wide = () => matchMedia('(min-width: 761px)').matches;
  const SYSTEM_DARK = matchMedia('(prefers-color-scheme: dark)');

  // ---------- SF Symbols, drawn as masks ----------
  const svg = (body, vb = '0 0 24 24') => `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${body}</svg>`).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}')`;
  const st = (d, w = 2) => `<path d='${d}' fill='none' stroke='black' stroke-width='${w}' stroke-linecap='round' stroke-linejoin='round'/>`;
  const ICONS = {
    back: svg(st('M15 4.5 7.5 12l7.5 7.5', 2.2)),
    plus: svg(st('M12 4v16M4 12h16', 1.7)),
    more: svg("<circle cx='5' cy='12' r='2'/><circle cx='12' cy='12' r='2'/><circle cx='19' cy='12' r='2'/>"),
    search: svg(st('M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.3 15.3 20 20', 2)),
    mic: svg("<rect x='3' y='0' width='6' height='10.5' rx='3'/><path d='M1 7.5a5 5 0 0 0 10 0' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round'/><path d='M6 12.5v3' stroke='black' stroke-width='1.5' stroke-linecap='round'/>", '0 0 12 16.3'),
    phone: svg("<path d='M6.6 2.6c.6-.6 1.6-.5 2 .2l1.8 3c.4.6.3 1.4-.2 1.9l-1.3 1.3c.9 2 2.6 3.7 4.6 4.6l1.3-1.3c.5-.5 1.3-.6 1.9-.2l3 1.8c.7.4.8 1.4.2 2l-1.5 1.6c-1 1-2.5 1.3-3.8.8C9.3 16.6 5.4 12.7 3.7 7.6c-.5-1.3-.2-2.8.8-3.8z'/>"),
    up: svg(st('M12 20V5M5.5 11.5 12 5l6.5 6.5', 2.6)),
    store: svg("<path d='M4 9.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z' fill='none' stroke='black' stroke-width='1.7'/><path d='M3 9.5 4.6 4.5h14.8L21 9.5' fill='none' stroke='black' stroke-width='1.7' stroke-linejoin='round'/><path d='M3 9.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5' fill='none' stroke='black' stroke-width='1.7'/><path d='M10 20.5v-5h4v5' fill='none' stroke='black' stroke-width='1.7'/>"),
    chev: svg(st('M2 1.5 7.5 7 2 12.5', 2.2), '0 0 9 14'),
    check: svg(st('M3.5 12.5 9 18 20.5 6', 2.4)),
    gear: svg("<path d='M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 5.2-1.7 1.3.2 2.1-2 2-2.1-.2-1.3 1.7h-2.9l-1.3-1.7-2.1.2-2-2 .2-2.1-1.7-1.3v-2.9l1.7-1.3-.2-2.1 2-2 2.1.2 1.3-1.7h2.9l1.3 1.7 2.1-.2 2 2-.2 2.1 1.7 1.3z' fill='none' stroke='black' stroke-width='1.6' stroke-linejoin='round'/>"),
    sun: svg("<circle cx='12' cy='12' r='4' fill='none' stroke='black' stroke-width='1.6'/>" + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d='M12 2.5v2.4' stroke='black' stroke-width='1.6' stroke-linecap='round' transform='rotate(${a} 12 12)'/>`).join('')),
    machine: svg("<rect x='2.5' y='3.5' width='19' height='13' rx='2'/><path d='M9 20.5h6M12 16.5v4' stroke='black' stroke-width='2' stroke-linecap='round'/>"),
    appearance: svg("<circle cx='12' cy='12' r='8.5' fill='none' stroke='black' stroke-width='2'/><path d='M12 3.5a8.5 8.5 0 0 0 0 17z'/>"),
    info: svg("<path fill-rule='evenodd' d='M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm0 3.7a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM10.8 11.6a1.2 1.2 0 0 1 2.4 0v4.6a1.2 1.2 0 0 1-2.4 0z'/>"),
    globe: svg("<circle cx='12' cy='12' r='9' fill='none' stroke='black' stroke-width='1.6'/><path d='M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z' fill='none' stroke='black' stroke-width='1.6'/>"),
    feedback: svg("<path fill-rule='evenodd' d='M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-9l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 16V6A1.5 1.5 0 0 1 4 4.5zM12 7a1.1 1.1 0 0 0-1.1 1.1v3.3a1.1 1.1 0 0 0 2.2 0V8.1A1.1 1.1 0 0 0 12 7zm0 6.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z'/>"),
    signout: svg(st('M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10M14.5 8l4 4-4 4M18.5 12H9', 1.8)),
    bubble: svg("<path d='M12 3.5c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-1 0-2-.1-2.9-.4L5 20.5l.9-3.6C4.1 15.5 3 13.5 3 11.2 3 6.9 7 3.5 12 3.5z'/>"),
    link: svg(st('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.6 6.7M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4', 2)),
    clock: svg("<circle cx='12' cy='12' r='9' fill='none' stroke='black' stroke-width='1.8'/><path d='M12 7v5.5l3.5 2' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round'/>"),
    cube: svg("<path d='M12 2.8 20 7.2v9.6l-8 4.4-8-4.4V7.2z' fill='none' stroke='black' stroke-width='1.7' stroke-linejoin='round'/><path d='M4 7.2l8 4.4 8-4.4M12 11.6v9.6' fill='none' stroke='black' stroke-width='1.7'/>"),
  };
  const icon = (name, cls = '') => `<span class="i ${cls}" style="--m:${ICONS[name]}"></span>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- theme ----------
  function appearance() { try { return localStorage.getItem('as:appearance') || 'system'; } catch { return 'system'; } }
  function applyTheme() {
    const a = appearance();
    const dark = a === 'dark' || (a === 'system' && SYSTEM_DARK.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
  }
  const isDark = () => root.dataset.theme === 'dark';
  applyTheme();
  SYSTEM_DARK.addEventListener('change', () => { applyTheme(); renderAll(); });

  // ---------- relay ----------
  async function api(method, path, body) {
    const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { showSignin(); throw new Error('not paired'); }
    const text = await r.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw Object.assign(new Error((data && data.error && (data.error.message || data.error)) || r.statusText), { status: r.status });
    return data;
  }

  // ---------- avatars (D79: gradient disc with initials; colour from the stable id) ----------
  function colourIndex(id) { let s = 0; for (const b of new TextEncoder().encode(id || '')) s += b; return s % 7; }
  function initials(name) {
    const w = String(name || '').trim().split(/[\s-]+/).filter(Boolean);
    const l = w.slice(0, 2).map(x => [...x][0]).join('');
    return (l || '?').toUpperCase();
  }
  function disc(name, index, size, mark) {
    const p = S.palette && S.palette.find(x => x.index === index);
    const c = p ? (isDark() ? p.dark : p.light) : { top: '#9A9A9F', bottom: '#7C7C80' };
    return `<span class="av" style="width:${size}px;height:${size}px;font-size:${(size * 0.445).toFixed(1)}px;background:linear-gradient(180deg,${c.top},${c.bottom})">${esc(initials(name))}${mark ? '<i class="mark"></i>' : ''}</span>`;
  }

  // ---------- data helpers ----------
  const agentOf = chat => (chat.members || []).find(m => String(m.member).startsWith('agent:'));
  const agentIndex = chat => { const a = agentOf(chat); return a && a.avatar_color_index_effective != null ? a.avatar_color_index_effective : colourIndex(chat.id); };
  const chatName = chat => chat.title || (agentOf(chat) || {}).name || 'Chat';
  const chatById = id => S.chats.find(c => c.id === id);
  const lastOf = id => { const m = S.msgs[id]; const p = S.sending[id] || []; return p.length ? p[p.length - 1] : (m && m.list.length ? m.list[m.list.length - 1] : null); };
  const mine = msg => msg.sender && msg.sender.kind === 'user';
  const working = id => { const l = lastOf(id); return !!l && mine(l) && Date.now() - l.at < 20 * 60 * 1000; };
  const plain = t => String(t || '').replace(/```[\s\S]*?```/g, ' ').replace(/^\s*\|?[\s:|-]*-{2,}[\s:|-]*$/gm, '').replace(/[#*_`>|]/g, '').replace(/\s+/g, ' ').trim();
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  function rowTime(ms) {
    if (!ms) return '';
    const d = new Date(ms), now = Date.now();
    if (sameDay(ms, now)) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay(ms, now - 864e5)) return 'Yesterday';
    if (now - ms < 6 * 864e5) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  function dateLabel(ms) {
    const d = new Date(ms), now = Date.now();
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay(ms, now)) return 'Today ' + t;
    if (sameDay(ms, now - 864e5)) return 'Yesterday ' + t;
    if (now - ms < 6 * 864e5) return d.toLocaleDateString([], { weekday: 'long' }) + ' ' + t;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + t;
  }
  const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  // ---------- sign in ----------
  function showSignin() {
    stopTimers();
    $('signin').hidden = false; $('home').hidden = true; $('chat').hidden = true; $('page').hidden = true; $('empty').hidden = true;
    const names = ['A', 'R', 'B', 'O', 'S'];
    document.querySelectorAll('.float-disc').forEach((el, i) => {
      const idx = [3, 1, 0, 5, 6][i];
      const p = S.palette && S.palette.find(x => x.index === idx);
      const c = p ? (isDark() ? p.dark : p.light) : { top: '#888', bottom: '#666' };
      el.style.background = `linear-gradient(180deg,${c.top},${c.bottom})`; el.textContent = names[i];
    });
  }
  $('pair-form').addEventListener('submit', async e => {
    e.preventDefault(); $('pair-error').textContent = '';
    try { await api('POST', '/app/pair', { code: $('pair-code').value }); $('signin').hidden = true; boot(); }
    catch (err) { $('pair-error').textContent = err.message; }
  });

  // ---------- home / sidebar ----------
  function renderHome() {
    $('account').innerHTML = disc('Grant', colourIndex('u_default'), 48, true);
    $('foot-avatar').innerHTML = disc('Grant', colourIndex('u_default'), 36, true);
    const q = S.query.trim().toLowerCase();
    const chats = S.chats
      .filter(c => !q || chatName(c).toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
      .sort((a, b) => ((lastOf(b.id) || {}).at || b.last_activity_at || 0) - ((lastOf(a.id) || {}).at || a.last_activity_at || 0));
    const box = $('chat-list');
    if (!chats.length) { box.innerHTML = `<p class="empty-list">${q ? 'No results' : 'No conversations yet'}</p>`; return; }
    box.innerHTML = chats.map(c => {
      const last = lastOf(c.id);
      const preview = last ? (mine(last) ? 'You: ' : '') + plain(last.text) : 'No messages yet';
      const status = working(c.id) ? `<span class="spin" data-spin>${SPIN[S.frame]}</span>`
        : (c.unread && S.current !== c.id ? '<span class="pill-count">1</span>' : '');
      return `<button class="row" role="listitem" data-chat="${c.id}" ${S.current === c.id && wide() ? 'aria-current="true"' : ''}>
        ${disc(chatName(c), agentIndex(c), wide() ? 36 : 48)}
        <span class="txt"><span class="l1"><span class="name">${esc(chatName(c))}</span><span class="time">${esc(rowTime(last ? last.at : c.last_activity_at))}</span></span>
        <span class="l2"><span class="preview">${esc(preview)}</span>${status}</span></span></button>`;
    }).join('');
  }
  $('chat-list').addEventListener('click', e => { const b = e.target.closest('[data-chat]'); if (b) openChat(b.dataset.chat); });
  for (const id of ['search', 'mac-search']) $(id).addEventListener('input', e => { S.query = e.target.value; renderHome(); });
  $('account').addEventListener('click', () => openPage('settings'));
  $('mac-settings').addEventListener('click', () => openPage('settings'));
  $('new-chat').hidden = true;
  $('mac-appearance').addEventListener('click', () => {
    const next = { system: isDark() ? 'light' : 'dark', light: 'dark', dark: 'light' }[appearance()];
    try { localStorage.setItem('as:appearance', next); } catch {}
    applyTheme(); renderAll();
  });

  // ---------- chat ----------
  async function fetchMessages(id) {
    const m = S.msgs[id] || (S.msgs[id] = { list: [], next: null, loaded: false });
    let changed = false;
    for (let guard = 0; guard < 30; guard++) {
      const q = m.next ? `?since=${m.next.since}&after_id=${encodeURIComponent(m.next.after_id)}&limit=200` : '?since=0&limit=200';
      const d = await api('GET', `/api/chats/${id}/export${q}`);
      for (const msg of d.messages || []) {
        if (!m.list.some(x => x.id === msg.id)) { m.list.push(msg); changed = true; }
        if (S.sending[id]) S.sending[id] = S.sending[id].filter(p => p.id !== msg.id);
      }
      if (d.next) m.next = d.next;
      if (!d.has_more) break;
    }
    m.loaded = true;
    return changed;
  }

  function renderChat(stick) {
    const id = S.current; if (!id) return;
    const chat = chatById(id); if (!chat) return;
    const name = chatName(chat);
    $('chat-pill').innerHTML = `${disc(name, agentIndex(chat), wide() ? 28 : 32, true)}<span class="nm">${esc(name)}</span>`;
    $('input').placeholder = (wide() ? 'Message ' : 'Ask ') + name;
    const tr = $('transcript');
    const atBottom = stick || tr.scrollHeight - tr.scrollTop - tr.clientHeight < 80;
    const list = [...((S.msgs[id] || {}).list || []), ...(S.sending[id] || [])];
    let html = '', prev = null;
    for (const msg of list) {
      const sys = msg.sender && msg.sender.kind === 'system';
      if (!prev || !sameDay(prev.at, msg.at) || msg.at - prev.at >= 3600e3) html += `<div class="stamp">${esc(dateLabel(msg.at))}</div>`;
      if (sys) { html += `<div class="stamp">${esc(msg.text)}</div>`; prev = null; continue; }
      const who = mine(msg) ? 'me' : 'them';
      const turn = prev && (mine(prev) !== mine(msg) || msg.at - prev.at > 120e3);
      const body = mine(msg) ? esc(msg.text) : `<div class="md">${window.renderMarkdown(msg.text)}</div>`;
      let atts = '';
      for (const a of msg.attachments || []) {
        if (!a.url) continue;
        atts += /^image\//.test(a.mime || '') ? `<img class="att-img" src="${esc(a.url)}" alt="${esc(a.name || 'image')}" loading="lazy">`
          : `<a class="att-file" href="${esc(a.url)}" target="_blank" rel="noopener">${icon('link')}${esc(a.name || 'file')}</a>`;
      }
      html += `<div class="msg ${who}${turn ? ' turn' : ''}${msg.pending ? ' pending' : ''}">${msg.text ? `<div class="bub">${body}</div>` : ''}${atts}</div>`;
      prev = msg;
    }
    if (working(id)) html += `<div class="working">${disc(name, agentIndex(chat), wide() ? 22 : 25.33)}<span>${esc(name)} is working</span></div>`;
    $('messages').innerHTML = html;
    if (atBottom) tr.scrollTop = tr.scrollHeight;
  }

  async function markRead(id) {
    const chat = chatById(id); if (!chat || !chat.head_seq) return;
    try { await api('PUT', `/api/chats/${id}/read`, { seq: chat.head_seq }); chat.unread = false; } catch {}
  }

  function show(view) {
    app.dataset.view = view;
    $('home').hidden = false;
    $('chat').hidden = view !== 'chat';
    $('page').hidden = view !== 'page';
    $('empty').hidden = !(wide() && view === 'home');
  }

  async function openChat(id) {
    S.current = id; S.page = null;
    try { localStorage.setItem('as:last', id); } catch {}
    history.replaceState(null, '', '#' + id);
    show('chat'); renderHome(); renderChat(true); syncComposer();
    if (!(S.msgs[id] || {}).loaded) await fetchMessages(id).catch(() => {});
    renderChat(true); renderHome(); markRead(id);
    if (wide()) $('input').focus();
  }
  $('back').addEventListener('click', goHome);
  $('page-back').addEventListener('click', () => { if (S.page && S.page.from) openPage(S.page.from); else if (S.page && S.page.chat) openChat(S.page.chat); else goHome(); });
  function goHome() { S.current = null; S.page = null; history.replaceState(null, '', location.pathname); show('home'); renderHome(); }
  $('chat-pill').addEventListener('click', () => openPage('profile', { chat: S.current }));
  $('chat-more').addEventListener('click', () => openPage('profile', { chat: S.current }));

  // ---------- composer ----------
  const input = $('input');
  function syncComposer() {
    const has = !!input.value.trim();
    input.closest('.field').classList.toggle('typing', has);
    $('send').innerHTML = has ? icon('up') : (wide() ? icon('mic') : icon('phone'));
    $('send').setAttribute('aria-label', has ? 'Send' : (wide() ? 'Voice' : 'Call'));
  }
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, innerHeight * 0.4) + 'px'; syncComposer(); }
  input.addEventListener('input', grow);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && wide()) { e.preventDefault(); $('composer').requestSubmit(); } });
  $('composer').addEventListener('submit', async e => {
    e.preventDefault();
    const id = S.current; const text = input.value.trim(); if (!id || !text) return;
    input.value = ''; grow();
    const local = { id: 'local-' + Date.now(), at: Date.now(), text, sender: { kind: 'user' }, pending: true };
    (S.sending[id] = S.sending[id] || []).push(local);
    renderChat(true); renderHome();
    try { const r = await api('POST', `/api/chats/${id}/messages`, { text }); local.id = r.message_id; local.pending = false; await fetchMessages(id); }
    catch (err) { S.sending[id] = (S.sending[id] || []).filter(p => p !== local); input.value = text; grow(); alert('Not sent: ' + err.message); }
    renderChat(true); renderHome();
  });
  $('plus').innerHTML = icon('plus'); document.querySelector('.mac-plus').innerHTML = icon('plus');
  document.querySelector('.mic').innerHTML = icon('mic');

  // ---------- pages ----------
  const row = (ic, title, value = '', opts = {}) => `<button class="prow${opts.cls ? ' ' + opts.cls : ''}" ${opts.act ? `data-act="${opts.act}"` : ''}>
    <span class="tile">${icon(ic)}${opts.mark ? '<i class="mark"></i>' : ''}</span><span class="t">${esc(title)}</span>
    ${value ? `<span class="v">${esc(value)}</span>` : ''}${opts.chevron === false ? '' : icon('chev', 'chev')}</button>`;
  const group = (rows, head, foot) => `<div class="group">${head ? `<div class="card-head">${esc(head)}</div>` : ''}<div class="card">${rows}</div>${foot ? `<p class="card-foot">${esc(foot)}</p>` : ''}</div>`;

  function openPage(kind, extra = {}) {
    S.page = { kind, ...extra };
    if (kind !== 'profile') S.current = wide() ? S.current : null;
    show('page'); renderPage(); renderHome();
  }
  function renderPage() {
    const p = S.page; if (!p) return;
    const body = $('page-body');
    const host = location.host.replace(/:\d+$/, '');
    let title = '', html = '';
    if (p.kind === 'settings') {
      title = 'Settings';
      html = `<div class="hero">${disc('Grant', colourIndex('u_default'), 104)}<h2>Grant</h2><p>${esc(location.origin)}</p></div>`
        + group(row('machine', 'Machine', 'None', { mark: true, chevron: false }), null, 'Connected agents run on your own computers. Agents built by SN74 miners will run on theirs.')
        + group(row('appearance', 'Appearance', { system: 'System', light: 'Light', dark: 'Dark' }[appearance()], { act: 'appearance' }), null)
        + group(row('info', 'About', 'Arbos Web', { chevron: false }) + row('globe', 'Relay', host, { chevron: false }), null)
        + group(row('signout', 'Sign out of this browser', '', { act: 'signout', cls: 'danger', chevron: false }), null);
    } else if (p.kind === 'appearance') {
      title = 'Appearance'; p.from = 'settings';
      const a = appearance();
      html = group(['system', 'light', 'dark'].map(k => `<button class="prow" data-appearance="${k}"><span class="t">${k[0].toUpperCase() + k.slice(1)}</span>${a === k ? icon('check', 'check') : ''}</button>`).join(''), 'Theme');
    } else if (p.kind === 'store') {
      title = 'Store';
      const rows = S.directory.filter(a => a.kind === 'outside').map(a => {
        const chat = chatById(a.chat_id);
        return `<div class="prow av-row">${disc(a.name, chat ? agentIndex(chat) : colourIndex(a.project_id), 36)}<span class="t">${esc(a.name)}<small>${esc(a.description || '')}</small></span><button class="chip" data-open="${a.chat_id}">Chat</button></div>`;
      }).join('');
      html = group(rows || '<div class="about">No agents yet.</div>', 'Your agents')
        + group(`<div class="prow"><span class="tile">${icon('cube')}</span><span class="t">Miner-built agents<small>Coming soon</small></span></div>`, 'SN74',
          'Agents built by SN74 miners will be listed here, ranked by paid usage. You pay only for what you use.');
    } else if (p.kind === 'profile') {
      const chat = chatById(p.chat); if (!chat) return goHome();
      const a = agentOf(chat) || {};
      const info = S.agents.find(x => x.project_id === (a.member || '').slice(6)) || {};
      const dir = S.directory.find(x => x.chat_id === chat.id) || {};
      title = '';
      const seen = info.last_seen_at ? rowTime(info.last_seen_at) : 'Never';
      html = `<div class="hero">${disc(chatName(chat), agentIndex(chat), 104, info.connected)}<h2>${esc(chatName(chat))}</h2><p>@${esc(a.handle || '')}</p></div>`
        + group(row('bubble', 'Message', '', { act: 'message' }), null)
        + group(row('link', 'Connection', info.connected ? 'Online' : 'Offline', { mark: !!info.connected, chevron: false }) + row('clock', 'Last seen', seen, { chevron: false }), null)
        + (dir.description || chat.description ? group(`<div class="about">${esc(dir.description || chat.description)}</div>`, 'About') : '');
    }
    $('page-title').textContent = title;
    body.innerHTML = `<div class="page-inner">${html}</div>`;
  }
  $('page-body').addEventListener('click', async e => {
    const open = e.target.closest('[data-open]'); if (open) return openChat(open.dataset.open);
    const ap = e.target.closest('[data-appearance]');
    if (ap) { try { localStorage.setItem('as:appearance', ap.dataset.appearance); } catch {} applyTheme(); renderAll(); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'store') openPage('store', { from: 'settings' });
    if (a === 'appearance') openPage('appearance');
    if (a === 'message') openChat(S.page.chat);
    if (a === 'signout' && confirm('Sign out of this browser? You will need a new pairing code.')) { await api('POST', '/app/logout'); location.reload(); }
  });

  // ---------- render / poll ----------
  function renderAll() {
    $('new-chat').innerHTML = icon('plus');
    $('back').innerHTML = icon('back'); $('page-back').innerHTML = icon('back'); $('chat-more').innerHTML = icon('more');
    $('mac-appearance').innerHTML = icon('sun');
    document.querySelectorAll('.ico-search').forEach(el => { el.innerHTML = icon('search'); });
    document.querySelector('.mac-title').innerHTML = '';
    renderHome(); if (S.current && app.dataset.view === 'chat') renderChat(false); if (S.page) renderPage(); syncComposer();
  }
  function stopTimers() { S.timers.forEach(clearInterval); S.timers = []; }
  async function pollCurrent() {
    const id = S.current; if (!id || document.hidden) return;
    try { if (await fetchMessages(id)) { renderChat(false); renderHome(); markRead(id); } else if (working(id)) renderChat(false); } catch {}
  }
  async function pollAll() {
    if (document.hidden) return;
    try {
      S.chats = await api('GET', '/api/chats');
      for (const c of S.chats) if (c.id !== S.current) await fetchMessages(c.id);
      S.agents = await api('GET', '/api/outside-agents').then(d => Array.isArray(d) ? d : (d && d.agents) || []).catch(() => S.agents);
      renderHome(); if (S.page && S.page.kind === 'profile') renderPage();
    } catch {}
  }
  function tickSpin() {
    S.frame = (S.frame + 1) % SPIN.length;
    document.querySelectorAll('[data-spin]').forEach(el => { el.textContent = SPIN[S.frame]; });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { pollCurrent(); pollAll(); } });
  let wasWide = wide();
  addEventListener('resize', () => { if (wide() !== wasWide) { wasWide = wide(); show(app.dataset.view); renderAll(); } });

  async function boot() {
    const palette = await fetch('/api/avatar-colors', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).catch(() => null);
    S.palette = palette && palette.palette;
    const s = await api('GET', '/app/session');
    if (!s.paired) {
      const pub = await fetch('/app/palette').then(r => r.ok ? r.json() : null).catch(() => null);
      if (pub) S.palette = pub.palette;
      return showSignin();
    }
    $('signin').hidden = true;
    const [directory, chats, agents] = await Promise.all([
      api('GET', '/app/directory').catch(() => []), api('GET', '/api/chats'),
      api('GET', '/api/outside-agents').then(d => Array.isArray(d) ? d : (d && d.agents) || []).catch(() => [])]);
    S.directory = directory || []; S.chats = chats || []; S.agents = agents;
    show('home'); renderAll();
    await Promise.all(S.chats.map(c => fetchMessages(c.id).catch(() => {})));
    renderHome();
    let start = location.hash.slice(1);
    if (!start && wide()) { try { start = localStorage.getItem('as:last') || ''; } catch {} }
    if (start === 'settings') openPage(start);
    else if (start && chatById(start)) openChat(start);
    stopTimers();
    S.timers.push(setInterval(pollCurrent, 1500), setInterval(pollAll, 12000), setInterval(tickSpin, 90));
  }
  boot().catch(err => { if (err.message !== 'not paired') console.error(err); });
})();
