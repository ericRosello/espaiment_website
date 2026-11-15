/*!
 * anotar.js · Modo anotación para la web de EspaiMent
 *
 * Uso
 *   ?anotar          → muestra una etiqueta numerada sobre cada texto (para el cliente)
 *   ?anotar=admin    → además muestra los botones de exportación (solo para ti)
 *
 * No hace nada si la URL no lleva ?anotar, así que es seguro dejarlo publicado.
 * Añádelo antes de </body> en cada página:  <script src="anotar.js" defer></script>
 *
 * No se etiquetan: títulos, botones/enlaces, menú, cabecera, pie y datos personales.
 *
 * Ajustes finos desde el HTML (sin tocar este archivo):
 *   data-anotar="ignorar"   → ese elemento (y su contenido) no lleva etiqueta
 *   data-anotar="grupo"     → todo su contenido es UNA sola etiqueta
 */
(function () {
  'use strict';

  /* ------------------------------ CONFIG ------------------------------ */
  const PARAM = 'anotar';
  const PAGES = [
    { file: 'index.html',      code: 'HOME',     name: 'Inicio' },
    { file: 'psicologia.html', code: 'PSICO',    name: 'Psicología' },
    { file: 'emdr.html',       code: 'EMDR',     name: 'EMDR' },
    { file: 'equipo.html',     code: 'EQUIPO',   name: 'Sobre nosotros' },
    { file: 'contacto.html',   code: 'CONTACTO', name: 'Contacto' },
  ];

  // Textos que NO llevan etiqueta (datos personales, iconos…)
  const IGNORE_TEXT = [
    /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/,                                    // email
    /^\+?\d[\d\s().-]{6,}$/,                                           // teléfono
    /^@[\w.]+$/,                                                       // usuario de Instagram
    /^https?:\/\/\S+$/i,                                               // dirección web
    /^col(egiad[oa])?\.?\s*(n\s*[º°o.]*\s*)?[a-z]{0,2}-?\s*\d+$/i,     // nº de colegiada
    /^(contacto directo|tel[eé]fono(\s*\/\s*whatsapp)?|e-?mail|whatsapp)$/i,
    /^[^\p{L}\p{N}]+$/u,                                               // solo símbolos (×, →…)
  ];

  // Elementos que NO llevan etiqueta (añade aquí clases si ves más datos personales)
  const IGNORE_SELECTORS = [
    '[data-anotar="ignorar"]',
    'a[href^="mailto:"]', 'a[href^="tel:"]', 'a[href*="wa.me"]', 'a[href*="whatsapp"]',
  ];

  // Contenedores que se etiquetan como UN solo texto (carruseles…)
  const GROUP_SELECTORS = [
    '[data-anotar="grupo"]',
    '[class*="carousel"]', '[class*="carrusel"]', '[class*="slider"]', '[class*="swiper"]',
    '[class*="marquee"]', '[class*="testimon"]',
  ];

  const MAX_LIST_ITEM_CHARS = 300;   // listas con elementos más largos no se agrupan
  // Clases que indican un título (si el propio elemento la lleva, no se etiqueta)
  const TITLE_CLASS = /(^|[\s_-])(title|titulo|eyebrow|kicker|heading)([\s_-]|$)/i;
  /* -------------------------------------------------------------------- */

  const params = new URLSearchParams(location.search);
  if (!params.has(PARAM)) return;
  console.info('[anotar] script cargado, modo anotación activo');

  const ROOT_ID = 'anotar-root';
  const ADMIN = params.get(PARAM) === 'admin';
  const SCRIPT_BASE = (document.currentScript && document.currentScript.src)
    ? new URL('.', document.currentScript.src).href
    : location.href;

  const IGNORE_SEL = IGNORE_SELECTORS.join(',');
  const GROUP_SEL = GROUP_SELECTORS.join(',');
  const DIALOG_SEL = 'dialog, [role="dialog"], [aria-modal="true"]';

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME', 'HEAD',
    'CANVAS', 'VIDEO', 'AUDIO', 'OBJECT', 'SELECT']);
  const INLINE = new Set(['inline', 'inline-block', 'inline-flex', 'inline-grid', 'contents',
    'ruby', 'ruby-text', 'ruby-base']);

  const KIND_LABEL = { text: '', list: 'lista', paras: 'párrafos', group: 'grupo' };
  const KIND_NOTE = {
    text: '',
    list: 'Lista: un elemento por línea. Si cada elemento tiene título y descripción, deja una línea en blanco entre elementos.',
    paras: 'Párrafos: separa cada párrafo con una línea en blanco.',
    group: 'Grupo (carrusel, etc.): un elemento por línea o bloque, en el mismo orden.',
  };

  /* ------------------------- Detección de textos ------------------------- */

  function isInlineLike(el, win) {
    return INLINE.has(win.getComputedStyle(el).display);
  }

  // Recorre el contenido "en línea" de un elemento (texto, <em>, <strong>, <br>…)
  // y devuelve su texto propio, los nodos de texto y los hijos de tipo bloque.
  function scan(el, win, splitLinks) {
    const nodes = [], parts = [], blocks = [];
    let hasLinks = false, nonLinkLen = 0;

    (function rec(node, inLink) {
      node.childNodes.forEach(function (c) {
        if (c.nodeType === 3) {
          const v = c.nodeValue.replace(/\s+/g, ' ');
          if (v.trim()) {
            nodes.push(c);
            if (!inLink) nonLinkLen += v.trim().length;
          }
          parts.push(v);
        } else if (c.nodeType === 1) {
          const tag = c.tagName.toUpperCase();
          if (SKIP.has(tag) || c.id === ROOT_ID || c.matches(IGNORE_SEL)) return;
          if (tag === 'BR') { parts.push('\n'); return; }
          if (tag === 'INPUT' || tag === 'TEXTAREA') { blocks.push(c); return; }
          const isLink = tag === 'A' || tag === 'BUTTON';
          if (isLink) hasLinks = true;
          if (isLink && splitLinks) { blocks.push(c); parts.push('\n'); return; }
          if (isInlineLike(c, win)) rec(c, inLink || isLink);
          else { blocks.push(c); parts.push('\n'); }
        }
      });
    })(el, false);

    const text = parts.join('')
      .replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').replace(/ {2,}/g, ' ').trim();
    return { nodes: nodes, blocks: blocks, text: text, hasLinks: hasLinks, nonLinkLen: nonLinkLen };
  }

  // Si un bloque solo contiene enlaces/botones, cada uno cuenta como un texto aparte.
  function ownText(el, win) {
    let res = scan(el, win, false);
    if (res.hasLinks && res.nonLinkLen < 25) res = scan(el, win, true);
    return res;
  }

  function byAnchor(a, b) {
    if (a.anchor === b.anchor) return 0;
    return (a.anchor.compareDocumentPosition(b.anchor) & 4) ? -1 : 1;
  }

  // Cargo / nº de colegiada justo debajo del nombre, dentro de las fichas del equipo.
  function isNameplate(u) {
    const dlg = u.el.closest(DIALOG_SEL);
    if (!dlg || u.text.length > 60) return false;
    for (let a = u.el; a && a !== dlg; a = a.parentElement) {
      const p = a.previousElementSibling;
      if (p && /^H[1-4]$/.test(p.tagName) && !/^(UL|OL)$/.test(a.tagName)) return true;
    }
    return false;
  }

  // Menú, cabecera y pie de página: no llevan etiqueta.
  function isChrome(el) {
    if (el.closest('nav')) return true;
    const foot = el.closest('footer');
    if (foot && !foot.closest('article, blockquote')) return true;
    const hdr = el.closest('header');
    return !!(hdr && !hdr.closest('main, article, section, aside') && hdr.querySelector('nav, img[src*="logo"]'));
  }

  // Títulos (h1–h6 o clases tipo "title"), salvo las preguntas de un desplegable.
  function isTitle(u) {
    if (u.el.closest('summary, [aria-expanded]')) return false;
    const h = u.el.closest('h1, h2, h3, h4, h5, h6');
    if (h) return !h.querySelector('summary, [aria-expanded]');
    return TITLE_CLASS.test(String(u.el.getAttribute('class') || ''));
  }

  // Botones y enlaces de llamada a la acción ("Pide tu primera cita", "Saber más →"…).
  function isButton(u) {
    const b = u.el.closest('a, button, [role="button"]');
    if (!b) return false;
    if (b.hasAttribute('aria-expanded') || b.closest('summary')) return false;   // desplegables
    if (b.tagName === 'BUTTON' || b.getAttribute('role') === 'button' || b === u.el) return true;
    if (/btn|button|boton|cta/i.test(String(b.getAttribute('class') || ''))) return true;
    return b.textContent.replace(/\s+/g, ' ').trim() === u.text.replace(/\s+/g, ' ').trim();
  }

  function isIgnored(u) {
    const t = u.text.replace(/\s+/g, ' ').trim();
    if (IGNORE_TEXT.some(function (re) { return re.test(t); })) return true;
    return isChrome(u.el) || isTitle(u) || isButton(u) || isNameplate(u);
  }

  function collect(doc) {
    const win = doc.defaultView;
    const units = [];

    (function walk(el) {
      const tag = el.tagName.toUpperCase();
      if (SKIP.has(tag) || el.id === ROOT_ID || el.matches(IGNORE_SEL)) return;

      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        const ph = el.getAttribute('placeholder');
        if (ph && ph.trim()) {
          units.push({ el: el, nodes: [], text: ph.trim(), anchor: el,
            note: 'Texto de ejemplo dentro de un campo (placeholder)' });
        }
        return;
      }

      const own = ownText(el, win);
      if (own.text) {
        units.push({ el: el, nodes: own.nodes, text: own.text, anchor: own.nodes[0] || el, note: '' });
      }
      own.blocks.forEach(walk);
    })(doc.body);

    units.sort(byAnchor);
    units.forEach(function (u) { u.ignored = isIgnored(u); });
    return units;
  }

  /* ------------------------------ Agrupación ------------------------------ */

  let cacheKey = new WeakMap();

  function listKind(a) {
    if (cacheKey.has(a)) return cacheKey.get(a);
    let kind = '';
    if (a.matches(GROUP_SEL)) {
      kind = 'group';
    } else if (/^(UL|OL|DL)$/.test(a.tagName)) {
      const kids = Array.prototype.filter.call(a.children, function (c) { return /^(LI|DT|DD)$/.test(c.tagName); });
      const short = kids.every(function (c) { return c.textContent.trim().length <= MAX_LIST_ITEM_CHARS; });
      if (kids.length >= 2 && short && !a.querySelector('details, [aria-expanded]')) kind = 'list';
    }
    cacheKey.set(a, kind);
    return kind;
  }

  // Hijo directo del contenedor que contiene a `el` (el "elemento" de la lista).
  function itemOf(el, root) {
    let n = el;
    while (n && n.parentElement !== root) n = n.parentElement;
    return n || el;
  }

  function itemLines(g) {
    const items = [], index = new Map();
    g.members.forEach(function (m) {
      const key = itemOf(m.el, g.root);
      if (!index.has(key)) { const lines = []; index.set(key, lines); items.push(lines); }
      index.get(key).push(m.text);
    });
    const seen = new Set(), uniq = [];
    items.forEach(function (lines) {
      const k = lines.join('\n');
      if (!seen.has(k)) { seen.add(k); uniq.push(lines); }   // quita duplicados (carruseles que se repiten)
    });
    return uniq;
  }

  function groupText(g) {
    if (g.kind === 'paras') return g.members.map(function (m) { return m.text; }).join('\n\n');
    const uniq = itemLines(g);
    const multi = uniq.some(function (l) { return l.length > 1; });
    const body = uniq.map(function (l) { return l.join('\n'); }).join(multi ? '\n\n' : '\n');
    return body;
  }

  // Convierte la lista plana de textos en etiquetas: textos sueltos + grupos
  // (listas, párrafos seguidos, carruseles).
  function group(leaves) {
    if (!leaves.length) return [];
    cacheKey = new WeakMap();   // el DOM puede haber cambiado desde la última vez
    const body = leaves[0].el.ownerDocument.body;
    const groups = new Map();
    const consumed = new Set();

    leaves.forEach(function (u) {
      let found = null;
      for (let a = u.el; a && a !== body; a = a.parentElement) {
        const k = listKind(a);
        if (k) found = { el: a, kind: k };               // se queda con el contenedor más externo
      }
      if (!found && u.el.tagName === 'P') {
        let first = u.el;
        while (first.previousElementSibling && first.previousElementSibling.tagName === 'P') {
          first = first.previousElementSibling;
        }
        const nxt = first.nextElementSibling;
        if (u.el !== first || (nxt && nxt.tagName === 'P')) found = { el: first, kind: 'paras' };
      }
      if (!found) return;
      let g = groups.get(found.el);
      if (!g) { g = { kind: found.kind, root: found.el, members: [] }; groups.set(found.el, g); }
      g.members.push(u);
      consumed.add(u);
    });

    // Un grupo de un solo texto no es grupo.
    groups.forEach(function (g, key) {
      if (g.members.length < 2) {
        g.members.forEach(function (m) { consumed.delete(m); });
        groups.delete(key);
      }
    });

    const out = [];
    leaves.forEach(function (u) {
      if (!consumed.has(u)) out.push(Object.assign({ kind: 'text' }, u));
    });
    groups.forEach(function (g) {
      const parts = g.members;
      out.push({ kind: g.kind, el: g.root, parts: parts, text: groupText(g),
        anchor: parts[0].anchor, note: KIND_NOTE[g.kind] });
    });
    out.sort(byAnchor);
    return out;
  }

  /* ------------------------- Etiquetas y zonas ------------------------- */

  function zoneOf(el) {
    const z = el.closest('dialog, section, header, nav, footer, aside, article, main');
    if (!z) return '';
    const name = z.id ? '#' + z.id : (z.classList[0] ? '.' + z.classList[0] : '');
    return z.tagName.toLowerCase() + name;
  }

  function pageInfo(url) {
    const file = new URL(url, location.href).pathname.split('/').pop() || 'index.html';
    const hit = PAGES.find(function (p) { return p.file === file; });
    if (hit) return hit;
    const base = file.replace(/\.html?$/i, '').toUpperCase();
    return { file: file, code: base === 'INDEX' ? 'HOME' : base, name: base };
  }

  function build(doc, code) {
    const items = group(collect(doc).filter(function (u) { return !u.ignored; }));
    const counters = {};
    items.forEach(function (it) {
      counters[code] = (counters[code] || 0) + 1;
      it.id = code + '-' + String(counters[code]).padStart(2, '0');
      it.shared = false;
      it.zone = zoneOf(it.el);
    });
    return items;
  }

  /* ------------------------------ Geometría ------------------------------ */

  const FREE = { hidden: false, vis: 'visible', l: -Infinity, t: -Infinity, r: Infinity, b: Infinity };

  // Ámbito visible de un elemento: oculto (opacidad 0, display:none, <details> cerrado…)
  // y recorte por contenedores con overflow (acordeones plegados, carruseles…).
  function clipOf(el, memo) {
    if (!el || el.nodeType !== 1) return FREE;
    const cached = memo.get(el);
    if (cached) return cached;

    const win = el.ownerDocument.defaultView;
    const parent = clipOf(el.parentElement, memo);
    const cs = win.getComputedStyle(el);
    const e = { hidden: parent.hidden, vis: cs.visibility, l: parent.l, t: parent.t, r: parent.r, b: parent.b };

    if (cs.position === 'fixed') { e.l = -Infinity; e.t = -Infinity; e.r = Infinity; e.b = Infinity; }
    if (cs.display === 'none' || cs.contentVisibility === 'hidden' ||
        parseFloat(cs.opacity) < 0.05 || el.hasAttribute('inert')) e.hidden = true;

    const pe = el.parentElement;
    if (pe && pe.tagName === 'DETAILS' && !pe.open && el.tagName !== 'SUMMARY') e.hidden = true;

    const tag = el.tagName;
    if (tag !== 'HTML' && tag !== 'BODY') {
      const ox = cs.overflowX !== 'visible', oy = cs.overflowY !== 'visible';
      if (ox || oy) {
        const rc = el.getBoundingClientRect();
        if (ox) { e.l = Math.max(e.l, rc.left); e.r = Math.min(e.r, rc.right); }
        if (oy) { e.t = Math.max(e.t, rc.top); e.b = Math.min(e.b, rc.bottom); }
      }
    }
    memo.set(el, e);
    return e;
  }

  function union(rects) {
    if (!rects.length) return null;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    rects.forEach(function (q) {
      l = Math.min(l, q.left); t = Math.min(t, q.top);
      r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    });
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t,
      px: (rects[0].left + rects[0].right) / 2, py: (rects[0].top + rects[0].bottom) / 2 };
  }

  function unitRect(u, memo) {
    const rects = [];
    const push = function (q, e) {
      const l = Math.max(q.left, e.l), t = Math.max(q.top, e.t);
      const r = Math.min(q.right, e.r), b = Math.min(q.bottom, e.b);
      if (r - l > 1 && b - t > 1) rects.push({ left: l, top: t, right: r, bottom: b });
    };
    if (u.nodes && u.nodes.length) {
      const doc = u.el.ownerDocument;
      u.nodes.forEach(function (n) {
        const e = clipOf(n.parentElement, memo);
        if (e.hidden || e.vis !== 'visible') return;
        const rg = doc.createRange();
        rg.selectNodeContents(n);
        Array.prototype.forEach.call(rg.getClientRects(), function (q) { push(q, e); });
      });
    } else {
      const e = clipOf(u.el, memo);
      if (!e.hidden && e.vis === 'visible') {
        Array.prototype.forEach.call(u.el.getClientRects(), function (q) { push(q, e); });
      }
    }
    return union(rects);
  }

  // ¿Hay otra cosa encima del texto (p. ej. una ventana emergente tapando la página)?
  function occluded(p, r) {
    const x = r.px, y = r.py;
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
    const top = p.el.ownerDocument.elementFromPoint(x, y);
    if (!top || (state.root && state.root.contains(top))) return false;
    const el = p.el, par = el.parentElement;
    if (el.contains(top) || top.contains(el)) return false;
    if (par && !/^(MAIN|SECTION|BODY|ARTICLE|DIALOG|HTML)$/.test(par.tagName) && par.contains(top)) return false;
    return true;
  }

  function rectOf(it, memo, checkOcclusion) {
    const rects = [];
    (it.parts || [it]).forEach(function (p) {
      const r = unitRect(p, memo);
      if (r && !(checkOcclusion && occluded(p, r))) rects.push(r);
    });
    return union(rects);
  }

  /* ------------------------------ Superposición ------------------------------ */

  const state = { items: [], layer: null, root: null, hidden: false, topDialog: null, status: null };

  function injectStyle() {
    const s = document.createElement('style');
    s.id = 'anotar-style';
    s.textContent =
      '#' + ROOT_ID + '{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;' +
      'margin:0!important;padding:0!important;border:0!important;background:transparent!important;' +
      'overflow:visible!important;pointer-events:none;z-index:2147483647;}' +
      '#' + ROOT_ID + ' .ano-box{position:fixed;top:0;left:0;box-sizing:border-box;border:1.5px dashed #e11d74;' +
      'background:rgba(225,29,116,.05);border-radius:3px;pointer-events:none;will-change:transform;display:none;}' +
      '#' + ROOT_ID + ' .ano-box.grp{border-style:solid;border-width:2px;background:rgba(225,29,116,.04);}' +
      '#' + ROOT_ID + ' .ano-box.shared{border-color:#0e7490;background:rgba(14,116,144,.05);}' +
      '#' + ROOT_ID + ' .ano-badge{position:absolute;top:-10px;left:-2px;background:#e11d74;color:#fff;' +
      'font:700 11px/1 ui-monospace,Menlo,Consolas,monospace;padding:3px 5px;border-radius:3px;white-space:nowrap;}' +
      '#' + ROOT_ID + ' .ano-box.shared .ano-badge{background:#0e7490;}' +
      '#' + ROOT_ID + ' .ano-box.low .ano-badge{top:0;}' +
      '#' + ROOT_ID + ' .ano-bar{position:fixed;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:6px 12px;' +
      'align-items:center;padding:8px 12px;background:#1d1d1f;color:#fff;font:13px/1.35 system-ui,sans-serif;' +
      'pointer-events:auto;}' +
      '#' + ROOT_ID + ' .ano-bar b{font-weight:700;}' +
      '#' + ROOT_ID + ' .ano-title{font-weight:700;color:#ff7ab8;}' +
      '#' + ROOT_ID + ' .ano-teal{color:#5fd0e8;}' +
      '#' + ROOT_ID + ' .ano-bar button{font:600 12px system-ui,sans-serif;background:#fff;color:#1d1d1f;border:0;' +
      'border-radius:6px;padding:5px 10px;cursor:pointer;}' +
      '#' + ROOT_ID + ' .ano-bar button:disabled{opacity:.5;cursor:wait;}' +
      '#' + ROOT_ID + ' .ano-status{color:#ffd479;}';
    document.head.appendChild(s);
  }

  function button(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function buildRoot() {
    injectStyle();
    const root = document.createElement('div');
    root.id = ROOT_ID;
    if ('popover' in root) root.setAttribute('popover', 'manual'); // capa superior, por encima de <dialog>

    const layer = document.createElement('div');
    const bar = document.createElement('div');
    bar.className = 'ano-bar';
    bar.innerHTML =
      '<span class="ano-title">Modo anotación</span>' +
      '<span>Cada recuadro con etiqueta (p. ej. <b>HOME-03</b>) es un texto de la web. ' +
      'Los que dicen <b>lista</b> o <b>párrafos</b> agrupan varios textos: se escriben juntos, en una sola celda. ' +
      'No se etiquetan títulos, botones, menú, pie de página ni datos de contacto. ' +
      'Abre los desplegables y las fichas del equipo para ver sus etiquetas.</span>';

    const toggle = button('Ocultar etiquetas', function () {
      state.hidden = !state.hidden;
      layer.style.display = state.hidden ? 'none' : '';
      toggle.textContent = state.hidden ? 'Mostrar etiquetas' : 'Ocultar etiquetas';
      if (!state.hidden) render();
    });
    bar.appendChild(toggle);

    if (ADMIN) {
      const status = document.createElement('span');
      status.className = 'ano-status';
      state.status = status;
      const btns = [
        button('Exportar CSV (con texto actual)', function () { runExport('csv', true); }),
        button('Exportar CSV (en blanco)', function () { runExport('csv', false); }),
        button('Copiar tabla (Google Sheets)', function () { runExport('copy', true); }),
      ];
      state.adminButtons = btns;
      btns.forEach(function (b) { bar.appendChild(b); });
      bar.appendChild(status);
    }

    root.appendChild(layer);
    root.appendChild(bar);
    document.body.appendChild(root);
    if (root.showPopover) { try { root.showPopover(); } catch (e) { /* sin popover */ } }
    state.root = root;
    state.layer = layer;
  }

  function rebuild() {
    const items = build(document, pageInfo(location.href).code);
    state.layer.textContent = '';
    state.items = items.map(function (u) {
      const box = document.createElement('div');
      box.className = 'ano-box' + (u.shared ? ' shared' : '') + (u.kind !== 'text' ? ' grp' : '');
      const badge = document.createElement('span');
      badge.className = 'ano-badge';
      badge.textContent = u.id + (KIND_LABEL[u.kind] ? ' · ' + KIND_LABEL[u.kind] : '');
      box.appendChild(badge);
      state.layer.appendChild(box);
      return { u: u, box: box };
    });
    rewriteLinks();
    render();
  }

  function render() {
    if (state.hidden) return;
    const memo = new Map();
    const vw = window.innerWidth, vh = window.innerHeight;
    state.items.forEach(function (it) {
      const r = rectOf(it.u, memo, true);
      const s = it.box.style;
      if (!r || r.bottom < -40 || r.top > vh + 40 || r.right < 0 || r.left > vw) { s.display = 'none'; return; }
      s.display = 'block';
      s.transform = 'translate(' + (r.left - 3) + 'px,' + (r.top - 3) + 'px)';
      s.width = (r.width + 6) + 'px';
      s.height = (r.height + 6) + 'px';
      it.box.classList.toggle('low', r.top < 14);
    });
  }

  let raf = 0;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; render(); });
  }

  // Si se abre un <dialog> modal, vuelve a subir la capa por encima de él.
  function keepOnTop() {
    const d = document.querySelector('dialog[open]');
    if (d !== state.topDialog) {
      state.topDialog = d;
      if (d && state.root.hidePopover) {
        try { state.root.hidePopover(); state.root.showPopover(); } catch (e) { /* ignorar */ }
      }
    }
  }

  // Mantiene ?anotar al navegar entre páginas.
  function rewriteLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.hasAttribute('download') || (state.root && state.root.contains(a))) return;
      const raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
      let u;
      try { u = new URL(raw, location.href); } catch (e) { return; }
      if (!/^(https?|file):$/.test(u.protocol) || u.origin !== location.origin) return;
      if (u.searchParams.has(PARAM)) return;
      u.searchParams.set(PARAM, params.get(PARAM) || '');
      a.setAttribute('href', u.href);
    });
  }

  /* ------------------------------ Exportación ------------------------------ */

  function setStatus(msg) { if (state.status) state.status.textContent = msg || ''; }

  function loadFrame(url) {
    return new Promise(function (resolve, reject) {
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:-99999px;top:0;width:1280px;height:900px;border:0;visibility:hidden;';
      f.onload = function () { setTimeout(function () { resolve(f); }, 1200); };
      f.onerror = reject;
      f.src = url;
      document.body.appendChild(f);
    });
  }

  async function collectAll() {
    const rows = [];
    const seenShared = new Set();
    for (const p of PAGES) {
      setStatus('Leyendo ' + p.file + '…');
      const frame = await loadFrame(new URL(p.file, SCRIPT_BASE).href);
      try {
        const doc = frame.contentDocument;
        if (!doc || !doc.body) throw new Error('No se pudo leer ' + p.file);

        const title = (doc.title || '').trim();
        if (title) rows.push({ id: p.code + '-META-01', page: p.name, zone: 'SEO · título (pestaña y Google)', text: title, note: '' });
        const md = doc.querySelector('meta[name="description"]');
        const desc = md && (md.getAttribute('content') || '').trim();
        if (desc) rows.push({ id: p.code + '-META-02', page: p.name, zone: 'SEO · descripción (Google)', text: desc, note: '' });

        const memo = new Map();
        build(doc, p.code).forEach(function (it) {
          if (it.shared) {
            if (seenShared.has(it.id)) return;
            seenShared.add(it.id);
          }
          const notes = [];
          if (it.note) notes.push(it.note);
          if (!rectOf(it, memo)) notes.push('Oculto en esta vista (menú móvil, ficha, desplegable…)');
          rows.push({ id: it.id, page: it.shared ? 'Todas las páginas' : p.name, zone: it.zone, text: it.text, note: notes.join(' · ') });
        });
      } finally {
        frame.remove();
      }
    }
    return rows;
  }

  function quote(v, delim) {
    v = String(v == null ? '' : v);
    return (v.indexOf(delim) > -1 || /["\n\r]/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function table(rows, withCurrent, delim) {
    const head = ['Etiqueta', 'Página', 'Zona', 'Nº caracteres', 'Texto actual', 'Texto nuevo (rellenar)', 'Notas'];
    const lines = [head].concat(rows.map(function (r) {
      return [r.id, r.page, r.zone, r.text.length, withCurrent ? r.text : '', '', r.note];
    }));
    return lines.map(function (l) {
      return l.map(function (c) { return quote(c, delim); }).join(delim);
    }).join('\r\n');
  }

  function download(name, text) {
    const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  async function runExport(kind, withCurrent) {
    if (location.protocol === 'file:') {
      setStatus('Con file:// el navegador bloquea la lectura de las otras páginas. Abre la web con un servidor local (http://localhost:…).');
      return;
    }
    state.adminButtons.forEach(function (b) { b.disabled = true; });
    try {
      const rows = await collectAll();
      if (kind === 'copy') {
        await navigator.clipboard.writeText(table(rows, withCurrent, '\t'));
        setStatus('Copiado (' + rows.length + ' textos). Pégalo en Google Sheets.');
      } else {
        download(withCurrent ? 'textos-espaiment.csv' : 'textos-espaiment-en-blanco.csv', table(rows, withCurrent, ';'));
        setStatus('Descargado (' + rows.length + ' textos).');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    } finally {
      state.adminButtons.forEach(function (b) { b.disabled = false; });
    }
  }

  /* ------------------------------ Arranque ------------------------------ */

  function start() {
    buildRoot();
    rebuild();

    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', function () { rebuild(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { rebuild(); });

    // Contenido que aparece después (JS): reconstruir con un pequeño retraso.
    let t = 0;
    new MutationObserver(function (muts) {
      if (muts.every(function (m) { return state.root.contains(m.target); })) return;
      clearTimeout(t);
      t = setTimeout(rebuild, 300);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    // Ventanas emergentes, acordeones, animaciones…
    setInterval(function () { keepOnTop(); render(); }, 400);
  }

  function safeStart() {
    try {
      start();
    } catch (err) {
      console.error('[anotar] error', err);
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#b00020;color:#fff;' +
        'font:13px system-ui,sans-serif;padding:8px 12px;';
      d.textContent = 'anotar.js: error (' + err.message + '). Abre la consola del navegador y envíame el mensaje.';
      document.body.appendChild(d);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeStart);
  else safeStart();
})();
