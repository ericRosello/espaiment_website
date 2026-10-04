/* EspaiMent – script for the new version (-b pages). No libraries needed. */

// Mobile menu: open / close with the burger button
const burger = document.querySelector('.burger'), menu = document.querySelector('nav ul');
burger.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });

// Sliding rows of topics: each row's list is repeated so the loop never shows a gap (edit the lists in the HTML only)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.fonts.ready.then(() => document.querySelectorAll('.track').forEach(t => {
    const base = [...t.children], copies = Math.max(2, Math.ceil(innerWidth / t.scrollWidth) + 1);
    for (let i = 1; i < copies; i++) base.forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.append(c); });
    t.style.setProperty('--shift', -100 / copies + '%');
  }));
}

// Phones and tablets (touch screens): phone numbers start a call and emails open the mail app.
// Computers: the footer number opens WhatsApp and emails are copied to the clipboard.
const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (touch) document.querySelectorAll('[data-call]').forEach(a => { a.href = a.dataset.call; a.removeAttribute('target'); a.removeAttribute('title'); });

// Copy to clipboard (computers only): any link with data-copy="text" copies that text instead of opening the mail app
const toast = document.createElement('div');
toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-copy]'); if (!el || touch) return;
  e.preventDefault();
  const text = el.dataset.copy;
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  toast.textContent = 'Email copiado: ' + text; toast.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => toast.classList.remove('on'), 2200);
});

// Contact form (only runs on contacto-b.html). Sends the data to Web3Forms, which emails it to EspaiMent.
const form = document.getElementById('form-contacto');
if (form) {
  const msg = document.getElementById('form-msg'), btn = form.querySelector('button');
  const show = (type, text) => { msg.className = 'msg ' + type; msg.textContent = text; };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.access_key === 'TU_ACCESS_KEY_AQUI') { show('err', 'El formulario aún no está activado. Mientras tanto, escríbenos a espaiment.info@gmail.com'); return; }
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const r = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      show('ok', '¡Gracias! Hemos recibido tu mensaje y te responderemos lo antes posible.'); form.reset();
    } catch (err) { show('err', 'No hemos podido enviar el mensaje. Inténtalo de nuevo o escríbenos a espaiment.info@gmail.com'); }
    btn.disabled = false; btn.textContent = 'Enviar mensaje';
  });
}
