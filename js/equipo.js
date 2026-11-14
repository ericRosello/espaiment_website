/* EspaiMent – equipo: abre el perfil completo en una ventana (dialog nativo).
   Clic en la tarjeta o en "Conoce más" · Esc / clic fuera / X para cerrar.
   Enlace directo: sobre-nosotros.html#marina-manzano abre su perfil. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.tm'));
  var dlg = document.getElementById('pm');
  if (!cards.length || !dlg || typeof dlg.showModal !== 'function') return;

  var $ = function (id) { return document.getElementById(id); };
  var TEAM_EMAIL = 'espaiment.info@gmail.com';
  var toastT;

  function toast(msg) {
    var t = $('eqToast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }

  function open(i) {
    var c = cards[i], img = c.querySelector('.tm-img img');
    var email = c.getAttribute('data-email') || TEAM_EMAIL;
    $('pmImg').src = img.src; $('pmImg').alt = img.alt;
    $('pmName').textContent = c.querySelector('h2').textContent;
    $('pmRole').firstChild.nodeValue = c.querySelector('.role').textContent;
    $('pmCol').textContent = c.querySelector('.col').textContent;
    $('pmBody').innerHTML = c.querySelector('.full').innerHTML;
    $('pmMail').textContent = email; $('pmMail').href = 'mailto:' + email;
    $('pmMailLbl').textContent = c.getAttribute('data-email') ? 'Email personal' : 'Email';
    dlg.scrollTop = 0;
    history.replaceState(null, '', '#' + c.getAttribute('data-profile'));
    if (!dlg.open) { dlg.showModal(); document.body.style.overflow = 'hidden'; }
  }

  cards.forEach(function (c, i) {
    c.querySelector('.more').addEventListener('click', function () { open(i); });
  });
  $('pmClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });   // clic en el fondo
  dlg.addEventListener('close', function () {
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
  });

  $('pmCopy').addEventListener('click', function () {
    var text = $('pmMail').textContent;
    var done = function () { toast('Email copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); done(); }
  });

  function fromHash() {
    var h = location.hash.slice(1);
    for (var i = 0; i < cards.length; i++) if (cards[i].getAttribute('data-profile') === h) { open(i); return; }
  }
  fromHash();
  window.addEventListener('hashchange', function () { if (location.hash.length > 1) fromHash(); });
})();
