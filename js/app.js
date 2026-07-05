/* ============================================================================
 * AURÆ · Smell Printer Prototype — app.js
 * Interfaccia, interazioni e cablaggio. Vanilla JS, nessuna dipendenza.
 * Ricorda: tutto è simulazione visiva. Nessun odore reale, nessun hardware.
 * ==========================================================================*/

(function () {
  "use strict";
  const { AROMA_AXES, AROMA_LIBRARY, AROMA_BY_ID, Mixer, Store } = window.AURAE;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- Stato della sessione ---- */
  const state = {
    id: null,                 // id ricetta corrente (se caricata dall'archivio)
    name: "",
    components: [],           // [{ aromaId, drops }]
  };

  /* ==================================================================
   *  NAVIGAZIONE A SCHEDE
   * ================================================================*/
  function switchView(name) {
    if (!name) return;
    $$(".tab").forEach((t) => {
      const on = t.dataset.view === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    if (name === "archivio") renderArchive();
    // Comportamento da sito: riporta in alto e scorri la nav sulla scheda attiva.
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) { window.scrollTo(0, 0); }
    const activeTab = $(`.tab[data-view="${name}"]`);
    if (activeTab && activeTab.scrollIntoView) {
      try { activeTab.scrollIntoView({ inline: "center", block: "nearest" }); } catch (_) {}
    }
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchView(t.dataset.view)));

  // Navigazione delegata: qualsiasi elemento con [data-goto] cambia sezione
  // (hero, home cards, footer, CTA in pagina, logo).
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-goto]");
    if (!el) return;
    e.preventDefault();
    switchView(el.getAttribute("data-goto"));
  });

  /* ==================================================================
   *  VASSOIO AROMI (Studio)
   * ================================================================*/
  function renderTray() {
    const tray = $("#tray");
    tray.innerHTML = "";
    AROMA_LIBRARY.forEach((a) => {
      const b = document.createElement("button");
      b.className = "vial";
      b.style.setProperty("--vc", a.color);
      b.setAttribute("aria-label", `Aggiungi ${a.name}`);
      b.innerHTML =
        `<span class="vial__layer" data-l="${a.layer}"></span>` +
        `<span class="vial__glyph">${a.glyph}</span>` +
        `<span class="vial__name">${a.name}</span>` +
        `<span class="vial__fam">${a.family}</span>`;
      b.addEventListener("click", () => addAroma(a.id));
      tray.appendChild(b);
    });
  }

  /* ==================================================================
   *  GESTIONE MISCELA
   * ================================================================*/
  function addAroma(aromaId, drops = 1) {
    const existing = state.components.find((c) => c.aromaId === aromaId);
    if (existing) existing.drops = Math.min(20, existing.drops + drops);
    else state.components.push({ aromaId, drops });
    render();
  }
  function setDrops(aromaId, drops) {
    const c = state.components.find((x) => x.aromaId === aromaId);
    if (!c) return;
    c.drops = Math.max(0, Math.min(20, drops));
    if (c.drops === 0) state.components = state.components.filter((x) => x.aromaId !== aromaId);
    render();
  }
  function removeAroma(aromaId) {
    state.components = state.components.filter((c) => c.aromaId !== aromaId);
    render();
  }
  function clearMix() {
    state.id = null; state.name = ""; state.components = [];
    $("#recipe-name").value = "";
    render();
  }

  function renderMixList() {
    const list = $("#mixlist");
    const empty = $("#mix-empty");
    $$(".mixrow", list).forEach((n) => n.remove());
    if (!state.components.length) { empty.style.display = ""; return; }
    empty.style.display = "none";
    state.components.forEach((c) => {
      const a = AROMA_BY_ID[c.aromaId];
      const row = document.createElement("div");
      row.className = "mixrow";
      row.innerHTML =
        `<span class="mixrow__swatch" style="background:${a.color}"></span>` +
        `<span class="mixrow__name"><b>${a.name}</b><small>${a.family} · ${a.layer}</small></span>` +
        `<span class="stepper">` +
          `<button data-act="dec" aria-label="Meno una goccia">−</button>` +
          `<span class="drops">${c.drops}</span>` +
          `<button data-act="inc" aria-label="Più una goccia">+</button>` +
        `</span>` +
        `<button class="mixrow__del" aria-label="Rimuovi">×</button>`;
      row.querySelector('[data-act="dec"]').addEventListener("click", () => setDrops(c.aromaId, c.drops - 1));
      row.querySelector('[data-act="inc"]').addEventListener("click", () => setDrops(c.aromaId, c.drops + 1));
      row.querySelector(".mixrow__del").addEventListener("click", () => removeAroma(c.aromaId));
      list.appendChild(row);
    });
  }

  /* ==================================================================
   *  RADAR SVG (profilo olfattivo)
   * ================================================================*/
  function renderRadar(profile) {
    const svg = $("#radar");
    const cx = 110, cy = 110, R = 78, n = AROMA_AXES.length;
    const ptAt = (i, r) => {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    };
    let g = "";
    // Griglia concentrica
    for (let ring = 1; ring <= 4; ring++) {
      const pts = AROMA_AXES.map((_, i) => ptAt(i, (R * ring) / 4).join(",")).join(" ");
      g += `<polygon points="${pts}" fill="none" stroke="rgba(232,214,180,0.10)" stroke-width="1"/>`;
    }
    // Assi + etichette
    AROMA_AXES.forEach((ax, i) => {
      const [x, y] = ptAt(i, R);
      const [lx, ly] = ptAt(i, R + 16);
      g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(232,214,180,0.10)" stroke-width="1"/>`;
      const anchor = Math.abs(lx - cx) < 6 ? "middle" : lx < cx ? "end" : "start";
      g += `<text x="${lx}" y="${ly + 3}" fill="#7d7466" font-size="9" font-family="ui-monospace,monospace" text-anchor="${anchor}">${ax.label}</text>`;
    });
    // Poligono del profilo
    const shape = AROMA_AXES.map((ax, i) => ptAt(i, (R * Math.max(2, profile[ax.key])) / 100).join(",")).join(" ");
    g += `<defs><radialGradient id="rgrad" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="rgba(243,208,138,0.55)"/><stop offset="100%" stop-color="rgba(224,162,74,0.18)"/></radialGradient></defs>`;
    g += `<polygon points="${shape}" fill="url(#rgrad)" stroke="#e0a24a" stroke-width="1.6" stroke-linejoin="round"/>`;
    AROMA_AXES.forEach((ax, i) => {
      const [x, y] = ptAt(i, (R * Math.max(2, profile[ax.key])) / 100);
      g += `<circle cx="${x}" cy="${y}" r="2.4" fill="#f3d08a"/>`;
    });
    svg.innerHTML = g;
  }

  /* ==================================================================
   *  DISPOSITIVO: cartucce, alone, mood
   * ================================================================*/
  function renderDevice(synth) {
    const cartWrap = $("#cartridges");
    cartWrap.innerHTML = "";
    const maxDrops = Math.max(1, ...state.components.map((c) => c.drops), 6);
    state.components.forEach((c) => {
      const a = AROMA_BY_ID[c.aromaId];
      const cart = document.createElement("div");
      cart.className = "cart";
      cart.title = `${a.name}: ${c.drops}`;
      const pct = Math.round((c.drops / maxDrops) * 100);
      cart.innerHTML = `<span class="cart__fill" style="--cc:${a.color};height:${pct}%"></span><span class="cart__cap"></span>`;
      cartWrap.appendChild(cart);
    });
    // Alone e vapore assumono il colore della miscela
    const diff = $("#diffuser");
    diff.style.setProperty("--blend", synth.color);
    $("#diffuser-halo").style.setProperty("--blend", synth.color);
    $("#mood-name").textContent = state.components.length ? synth.desc.moodName : "—";
    $("#mood-caption").textContent = state.components.length ? synth.desc.caption : "Miscela vuota";
  }

  /* ==================================================================
   *  ANALISI: metriche, piramide, codice
   * ================================================================*/
  function renderAnalysis(synth) {
    const panel = $("#analysis");
    const has = state.components.length > 0;
    panel.hidden = !has;
    if (!has) return;

    renderRadar(synth.profile);

    $("#m-intensity").style.width   = synth.metrics.intensity + "%";
    $("#m-persistence").style.width = synth.metrics.persistence + "%";
    $("#m-complexity").style.width  = synth.metrics.complexity + "%";

    ["testa", "cuore", "fondo"].forEach((layer) => {
      const val = synth.pyramid[layer];
      $(`.pyramid__bar i[data-layer="${layer}"]`).style.width = val + "%";
      $("#p-" + layer).textContent = val + "%";
    });

    $("#recipe-code").value = Mixer.encodeRecipe({ name: state.name, components: state.components });
    $("#release-btn").disabled = false;
  }

  /* ==================================================================
   *  RENDER MASTER
   * ================================================================*/
  function render() {
    const synth = Mixer.synthesize({ name: state.name, components: state.components });
    renderMixList();
    renderDevice(synth);
    renderAnalysis(synth);
    $("#release-btn").disabled = state.components.length === 0;
  }

  /* ==================================================================
   *  RILASCIO VIRTUALE (animazione)
   * ================================================================*/
  function fireRelease() {
    if (!state.components.length) return;
    const diff = $("#diffuser");
    const btn = $("#release-btn");
    const vapor = $("#vapor");
    diff.classList.remove("is-firing"); btn.classList.remove("is-firing");
    void diff.offsetWidth; // reflow per riavviare l'animazione

    // Genera particelle di vapore (colore = miscela)
    vapor.innerHTML = "";
    const N = 16;
    for (let i = 0; i < N; i++) {
      const s = document.createElement("span");
      const dx = -50 + (Math.round(seededSpread(i)) ); // deviazione orizzontale deterministica
      s.style.setProperty("--dx", dx + "%");
      s.style.left = (35 + (i * 30) % 40) + "%";
      s.style.animationDelay = (i * 90) + "ms";
      vapor.appendChild(s);
    }
    diff.classList.add("is-firing");
    btn.classList.add("is-firing");
    toast("Rilascio virtuale simulato · nessun odore reale emesso ◈");
    setTimeout(() => { diff.classList.remove("is-firing"); btn.classList.remove("is-firing"); }, 2600);
  }
  // Piccolo spread deterministico (no Math.random per riproducibilità)
  function seededSpread(i) {
    const v = Math.sin(i * 12.9898) * 43758.5453;
    return ((v - Math.floor(v)) * 160) - 80; // range circa [-80,80]
  }

  /* ==================================================================
   *  ARCHIVIO
   * ================================================================*/
  function saveCurrent() {
    if (!state.components.length) { toast("Aggiungi almeno un aroma prima di salvare."); return; }
    state.name = $("#recipe-name").value.trim() || autoName();
    $("#recipe-name").value = state.name;
    const entry = Store.save({ id: state.id, name: state.name, components: state.components });
    state.id = entry.id;
    toast(`“${entry.name}” salvata nell'archivio locale.`);
  }
  function autoName() {
    const synth = Mixer.synthesize({ components: state.components });
    return synth.desc.moodName;
  }

  function renderArchive() {
    const wrap = $("#archive-list");
    const recipes = Store.list();
    $("#archive-sub").textContent = Store.isVolatile()
      ? "Memoria volatile: il salvataggio persistente non è disponibile in questo contesto."
      : `Le tue ricette, salvate solo su questo dispositivo (${recipes.length}).`;
    wrap.innerHTML = "";
    if (!recipes.length) {
      wrap.innerHTML = `<div class="archive-empty">Ancora nessuna ricetta. Componi la tua prima fragranza nello Studio.</div>`;
      return;
    }
    recipes.forEach((r) => {
      const synth = Mixer.synthesize(r);
      const card = document.createElement("div");
      card.className = "rcard";
      const chips = r.components.slice(0, 4).map((c) => {
        const a = AROMA_BY_ID[c.aromaId]; return a ? `<span class="chip">${a.name}</span>` : "";
      }).join("");
      const extra = r.components.length > 4 ? `<span class="chip">+${r.components.length - 4}</span>` : "";
      card.innerHTML =
        `<div class="rcard__band" style="--rc:${synth.color}"></div>` +
        `<div class="rcard__body">` +
          `<div class="rcard__name">${escapeHtml(r.name)}</div>` +
          `<div class="rcard__mood">${synth.desc.moodName} · int. ${synth.metrics.intensity}</div>` +
          `<div class="rcard__chips">${chips}${extra}</div>` +
          `<div class="rcard__actions">` +
            `<button class="btn btn--ghost btn--sm" data-act="load">Apri</button>` +
            `<button class="btn btn--ghost btn--sm" data-act="share">Scheda</button>` +
            `<button class="btn btn--ghost btn--sm" data-act="del">Elimina</button>` +
          `</div>` +
        `</div>`;
      card.querySelector('[data-act="load"]').addEventListener("click", () => loadRecipe(r));
      card.querySelector('[data-act="share"]').addEventListener("click", () => openShareCard(r));
      card.querySelector('[data-act="del"]').addEventListener("click", () => {
        Store.remove(r.id); toast("Ricetta eliminata."); renderArchive();
      });
      wrap.appendChild(card);
    });
  }

  function loadRecipe(r) {
    state.id = r.id || null;
    state.name = r.name || "";
    state.components = (r.components || []).map((c) => ({ aromaId: c.aromaId, drops: c.drops }));
    $("#recipe-name").value = state.name;
    switchView("studio");
    render();
    toast(`“${r.name}” caricata nello Studio.`);
  }

  /* ==================================================================
   *  LIBRERIA AROMI (galleria)
   * ================================================================*/
  function renderGallery() {
    const wrap = $("#aroma-gallery");
    wrap.innerHTML = "";
    AROMA_LIBRARY.forEach((a) => {
      const topAxes = AROMA_AXES.map((ax) => ({ ...ax, val: a.profile[ax.key] }))
        .sort((x, y) => y.val - x.val).slice(0, 3);
      const bars = topAxes.map((ax) =>
        `<div class="acard__bar"><span>${ax.label}</span><span><i style="width:${ax.val}%"></i></span></div>`
      ).join("");
      const card = document.createElement("div");
      card.className = "acard";
      card.style.setProperty("--ac", a.color);
      card.innerHTML =
        `<span class="acard__layer">${a.layer}</span>` +
        `<div class="acard__top"><span class="acard__orb"></span>` +
          `<span class="acard__title"><b>${a.name}</b><small>${a.family}</small></span></div>` +
        `<p class="acard__blurb">${a.blurb}</p>` +
        `<div class="acard__bars">${bars}</div>` +
        `<button class="btn btn--ghost btn--sm acard__add">Aggiungi allo Studio</button>`;
      card.querySelector(".acard__add").addEventListener("click", () => {
        addAroma(a.id); switchView("studio"); toast(`${a.name} aggiunto alla miscela.`);
      });
      wrap.appendChild(card);
    });
  }

  /* ==================================================================
   *  SCHEDA CONDIVISIBILE + IMPORT/EXPORT
   * ================================================================*/
  function openShareCard(recipe) {
    const synth = Mixer.synthesize(recipe);
    const code = Mixer.encodeRecipe(recipe);
    const url = Mixer.toShareUrl(recipe);
    const notes = recipe.components.map((c) => {
      const a = AROMA_BY_ID[c.aromaId]; return a ? `${a.name} ×${c.drops}` : "";
    }).filter(Boolean).join(" · ");
    modal(
      `<div class="share-card" style="--sc:${synth.color}">` +
        `<div class="share-card__halo"></div>` +
        `<div class="share-card__mood">${escapeHtml(synth.desc.moodName)}</div>` +
        `<div class="share-card__name">“${escapeHtml(recipe.name)}” · AURÆ</div>` +
        `<div class="share-card__lines">` +
          `<div>Carattere: ${synth.desc.caption}</div>` +
          `<div>Piramide: testa ${synth.pyramid.testa}% · cuore ${synth.pyramid.cuore}% · fondo ${synth.pyramid.fondo}%</div>` +
          `<div>Intensità ${synth.metrics.intensity} · persistenza ${synth.metrics.persistence} · complessità ${synth.metrics.complexity}</div>` +
          `<div>Aromi: ${escapeHtml(notes)}</div>` +
        `</div>` +
        `<div class="share-card__code">${escapeHtml(code)}</div>` +
      `</div>` +
      `<p style="margin-top:16px">Copia la scheda o il link per condividere questa fragranza simulata. Nessun odore reale è incluso 🙂</p>` +
      `<div class="mix-actions" style="margin-top:12px">` +
        `<button class="btn btn--primary" id="mShareText">Copia scheda</button>` +
        `<button class="btn btn--ghost" id="mShareLink">Copia link</button>` +
      `</div>`
    );
    const textCard =
      `AURÆ · “${recipe.name}” — ${synth.desc.moodName}\n` +
      `${synth.desc.caption}\n` +
      `Piramide: testa ${synth.pyramid.testa}% / cuore ${synth.pyramid.cuore}% / fondo ${synth.pyramid.fondo}%\n` +
      `Aromi: ${notes}\n` +
      `Codice: ${code}\n` +
      `(prototipo software concettuale — nessun odore reale)`;
    $("#mShareText").addEventListener("click", () => copyText(textCard, "Scheda copiata negli appunti."));
    $("#mShareLink").addEventListener("click", () => copyText(url, "Link copiato negli appunti."));
  }

  function openImport() {
    modal(
      `<h3>Importa una ricetta</h3>` +
      `<p>Incolla un <em>codice ricetta</em> AURÆ (o un link condiviso). Verrà aggiunto al tuo archivio locale.</p>` +
      `<textarea id="importArea" placeholder="AURAE1:Nome|bergamotto*3,rosa*2 …"></textarea>` +
      `<div class="mix-actions" style="margin-top:12px">` +
        `<button class="btn btn--primary" id="doImport">Importa</button>` +
        `<button class="btn btn--ghost" data-close>Annulla</button>` +
      `</div>`
    );
    $("#doImport").addEventListener("click", () => {
      const raw = $("#importArea").value;
      const decoded = Mixer.decodeRecipe(raw);
      if (!decoded) { toast("Codice non riconosciuto. Controlla e riprova."); return; }
      Store.save({ name: decoded.name, components: decoded.components });
      closeModal(); renderArchive(); toast(`“${decoded.name}” importata nell'archivio.`);
    });
  }

  function exportBackup() {
    const data = JSON.stringify(Store.exportAll(), null, 2);
    modal(
      `<h3>Backup dell'archivio</h3>` +
      `<p>Copia questo testo per conservare o trasferire le tue ricette. Nessun dato lascia il dispositivo automaticamente.</p>` +
      `<textarea readonly style="min-height:180px">${escapeHtml(data)}</textarea>` +
      `<div class="mix-actions" style="margin-top:12px">` +
        `<button class="btn btn--primary" id="copyBackup">Copia backup</button>` +
        `<button class="btn btn--ghost" data-close>Chiudi</button>` +
      `</div>`
    );
    $("#copyBackup").addEventListener("click", () => copyText(data, "Backup copiato negli appunti."));
  }

  /* ==================================================================
   *  MODALE + TOAST + UTILITÀ
   * ================================================================*/
  function modal(html) {
    $("#modal-body").innerHTML = html;
    $("#modal").hidden = false;
    $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  }
  function closeModal() { $("#modal").hidden = true; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 3200);
  }

  function copyText(text, okMsg) {
    const done = () => toast(okMsg || "Copiato.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); done(); } catch (_) { toast("Copia non riuscita: seleziona e copia manualmente."); }
    document.body.removeChild(ta);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ==================================================================
   *  STATO RETE (lampada)
   * ================================================================*/
  function updateNet() {
    const lamp = $("#net-status");
    const online = navigator.onLine;
    lamp.classList.toggle("is-off", !online);
    $(".statuslamp__label", lamp).textContent = online ? "online · offline-ready" : "offline · attivo";
  }
  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);

  /* ==================================================================
   *  PWA: install prompt + service worker
   * ================================================================*/
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e; $("#install-btn").hidden = false;
  });
  $("#install-btn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; $("#install-btn").hidden = true;
  });
  window.addEventListener("appinstalled", () => { $("#install-btn").hidden = true; toast("AURÆ installata. Funziona anche offline."); });

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    // Registrazione con percorso relativo per compatibilità con sottocartelle (GitHub Pages)
    navigator.serviceWorker.register("./sw.js").catch(() => { /* silenzioso: l'app funziona comunque */ });
  }

  /* ==================================================================
   *  IMPORT DA URL (#r=Base64)
   * ================================================================*/
  function importFromHash() {
    if (!location.hash || location.hash.indexOf("#r=") !== 0) return;
    const decoded = Mixer.decodeRecipe(location.href);
    if (decoded) {
      loadRecipe({ id: null, name: decoded.name, components: decoded.components });
      toast(`Ricetta condivisa “${decoded.name}” caricata.`);
    }
    // Pulisci l'hash senza ricaricare
    history.replaceState(null, "", location.pathname + location.search);
  }

  /* ==================================================================
   *  DISCLAIMER "perché?"
   * ================================================================*/
  $("#safety-more").addEventListener("click", () => {
    modal(
      `<h3>Perché solo simulazione?</h3>` +
      `<p>AURÆ è un <strong>concept di design</strong>. Emettere odori reali richiederebbe sostanze,
       dosaggi e hardware: territorio delicato per sicurezza e responsabilità. Questo prototipo
       esplora <em>l'esperienza</em> — comporre, visualizzare, archiviare e condividere fragranze —
       senza toccare nulla di fisico o chimico.</p>` +
      `<p>Nessuna parte di questa app fornisce istruzioni per costruire diffusori, manipolare composti
       o controllare dispositivi. È intrattenimento creativo e ricerca di interfaccia.</p>` +
      `<div class="mix-actions" style="margin-top:12px"><button class="btn btn--primary" data-close>Ho capito</button></div>`
    );
  });

  /* ==================================================================
   *  WIRING BOTTONI STUDIO / ARCHIVIO
   * ================================================================*/
  $("#recipe-name").addEventListener("input", (e) => { state.name = e.target.value; if (state.components.length) $("#recipe-code").value = Mixer.encodeRecipe({ name: state.name, components: state.components }); });
  $("#release-btn").addEventListener("click", fireRelease);
  $("#save-btn").addEventListener("click", saveCurrent);
  $("#clear-btn").addEventListener("click", clearMix);
  $("#copy-code").addEventListener("click", () => copyText($("#recipe-code").value, "Codice ricetta copiato."));
  $("#share-btn").addEventListener("click", () => {
    if (!state.components.length) { toast("Componi una miscela per generare la scheda."); return; }
    openShareCard({ id: state.id, name: state.name || autoName(), components: state.components });
  });
  $("#import-btn").addEventListener("click", openImport);
  $("#export-btn").addEventListener("click", exportBackup);

  // Pitch copiabile (versione testuale pronta per un deck)
  const PITCH_TEXT = [
    "AURÆ · Digital Olfactory Platform — \"The future of digital scent.\"",
    "",
    "PROBLEMA: L'olfatto è il senso più legato a memoria ed emozione, ma è assente dalla comunicazione digitale. Manca uno standard software per rappresentarlo, archiviarlo e condividerlo.",
    "SOLUZIONE: Una piattaforma olfattiva digitale — software per creare e condividere \"ricette\" di profumo, con un futuro dispositivo a cartucce per riprodurle. Oggi: il livello software e l'esperienza.",
    "PERCHÉ ORA: Crescita di VR, esperienze immersive, retail sensoriale e formazione digitale; elettronica di consumo e modelli a cartuccia maturi. Il canale olfattivo è l'ultimo ancora vuoto.",
    "MERCATO: Profumeria, food & beverage, musei, VR/gaming, marketing esperienziale, formazione, benessere.",
    "VANTAGGIO INIZIALE: Concept, interfaccia, workflow e identità definiti e protetti da copyright; prototipo funzionante che rende tangibile la visione.",
    "PROSSIMI PASSI: Partner tecnici e scientifici, proof of concept elettronico, pilot verticali, SDK/marketplace. In cerca di investitori early-stage e incubatori.",
    "",
    "Contatto: Alessandro Pezzali · info@alessandropezzali.it",
    "© 2026 Alessandro Pezzali. All rights reserved. — Concept software prototype: nessun odore reale, nessun controllo hardware.",
  ].join("\n");
  const copyPitchBtn = $("#copy-pitch");
  if (copyPitchBtn) copyPitchBtn.addEventListener("click", () => copyText(PITCH_TEXT, "Pitch copiato negli appunti."));

  /* ==================================================================
   *  AVVIO
   * ================================================================*/
  function init() {
    renderTray();
    renderGallery();
    render();
    updateNet();
    importFromHash();
    registerSW();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
