/* ============================================================================
 * AURÆ · Smell Printer Prototype
 * mixer.js — Motore di simulazione della miscela (100% concettuale)
 *
 * Calcola profili olfattivi ponderati, piramide delle note, intensità,
 * colore risultante e "codice ricetta" condivisibile. Nessuna operazione
 * fisica o chimica reale è coinvolta: sono solo trasformazioni di numeri.
 * ==========================================================================*/

(function () {
  const { AROMA_AXES, AROMA_BY_ID } = window.AURAE;

  /* --- Utilità colore -------------------------------------------------- */
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }
  function rgbToHex(r, g, b) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return "#" + c(r) + c(g) + c(b);
  }

  /* Mescola i colori degli aromi pesati per il numero di gocce */
  function blendColor(components) {
    let r = 0, g = 0, b = 0, total = 0;
    for (const c of components) {
      const aroma = AROMA_BY_ID[c.aromaId];
      if (!aroma || c.drops <= 0) continue;
      const { r: cr, g: cg, b: cb } = hexToRgb(aroma.color);
      r += cr * c.drops; g += cg * c.drops; b += cb * c.drops;
      total += c.drops;
    }
    if (total === 0) return "#6b6f76";
    return rgbToHex(r / total, g / total, b / total);
  }

  /* --- Profilo olfattivo ponderato ------------------------------------- */
  function computeProfile(components) {
    const acc = {}; AROMA_AXES.forEach((a) => (acc[a.key] = 0));
    let total = 0;
    for (const c of components) {
      const aroma = AROMA_BY_ID[c.aromaId];
      if (!aroma || c.drops <= 0) continue;
      for (const axis of AROMA_AXES) acc[axis.key] += (aroma.profile[axis.key] || 0) * c.drops;
      total += c.drops;
    }
    if (total > 0) for (const axis of AROMA_AXES) acc[axis.key] = acc[axis.key] / total;
    return acc;
  }

  /* --- Piramide olfattiva (testa/cuore/fondo in % di gocce) ------------- */
  function computePyramid(components) {
    const layers = { testa: 0, cuore: 0, fondo: 0 };
    let total = 0;
    for (const c of components) {
      const aroma = AROMA_BY_ID[c.aromaId];
      if (!aroma || c.drops <= 0) continue;
      layers[aroma.layer] += c.drops;
      total += c.drops;
    }
    const pct = { testa: 0, cuore: 0, fondo: 0 };
    if (total > 0) for (const k in layers) pct[k] = Math.round((layers[k] / total) * 100);
    return pct;
  }

  /* --- Intensità e persistenza simulate -------------------------------- */
  function computeMetrics(components) {
    const totalDrops = components.reduce((s, c) => s + (c.drops > 0 ? c.drops : 0), 0);
    const pyramid = computePyramid(components);
    // Intensità: cresce con le gocce ma satura (curva logaritmica dolce).
    const intensity = totalDrops === 0 ? 0
      : Math.min(100, Math.round(28 * Math.log2(totalDrops + 1)));
    // Persistenza: guidata dalla quota di note di fondo.
    const persistence = Math.round(pyramid.fondo * 0.7 + pyramid.cuore * 0.3);
    // Complessità: numero di aromi distinti attivi, normalizzato.
    const activeCount = components.filter((c) => c.drops > 0).length;
    const complexity = Math.min(100, activeCount * 16);
    return { totalDrops, intensity, persistence, complexity };
  }

  /* --- Descrittore dominante + nome-umore ------------------------------ */
  function describe(profile) {
    const entries = AROMA_AXES.map((a) => ({ key: a.key, label: a.label, val: profile[a.key] }));
    entries.sort((x, y) => y.val - x.val);
    const dominant = entries[0];
    const secondary = entries[1];

    const MOOD = {
      agrumato: ["Alba Citrina", "Scintilla", "Vetro Solare"],
      floreale: ["Giardino Sospeso", "Petalo di Seta", "Fiore Notturno"],
      legnoso:  ["Radice Profonda", "Foresta Quieta", "Legno di Luna"],
      speziato: ["Brace Viva", "Rotta delle Spezie", "Calore Nascosto"],
      fresco:   ["Aria Cristallo", "Respiro Alpino", "Onda Fredda"],
      dolce:    ["Nube Ambrata", "Carezza Gourmand", "Miele di Bruma"],
    };
    const pool = MOOD[dominant.key] || ["Miscela Ignota"];
    // Scelta deterministica (nessuna casualità → codici riproducibili).
    const idx = Math.round(secondary.val) % pool.length;
    return {
      dominant, secondary,
      moodName: pool[idx],
      caption: `Profilo dominante ${dominant.label.toLowerCase()} con un cenno ${secondary.label.toLowerCase()}.`,
    };
  }

  /* --- Codice ricetta condivisibile ------------------------------------ *
   * Formato compatto testuale: AURAE1:<nome>|id*drops,id*drops...
   * Anche codificabile in Base64 per URL. Nessun dato personale.        */
  function encodeRecipe(recipe) {
    const parts = recipe.components
      .filter((c) => c.drops > 0)
      .map((c) => `${c.aromaId}*${c.drops}`)
      .join(",");
    const name = (recipe.name || "Senza nome").replace(/[|]/g, " ");
    return `AURAE1:${name}|${parts}`;
  }

  function decodeRecipe(code) {
    try {
      let raw = String(code).trim();
      // Consenti anche l'incolla di un URL con #r=Base64
      const hashIdx = raw.indexOf("#r=");
      if (hashIdx !== -1) raw = decodeURIComponent(raw.slice(hashIdx + 3));
      // Se sembra Base64 (nessun ':'), prova a decodificarlo
      if (!raw.startsWith("AURAE1:") && /^[A-Za-z0-9+/=]+$/.test(raw)) {
        try { raw = atob(raw); } catch (_) { /* ignora */ }
      }
      if (!raw.startsWith("AURAE1:")) return null;
      const body = raw.slice("AURAE1:".length);
      const [name, partsStr] = body.split("|");
      const components = (partsStr || "").split(",").filter(Boolean).map((p) => {
        const [aromaId, drops] = p.split("*");
        return { aromaId: aromaId.trim(), drops: Math.max(0, parseInt(drops, 10) || 0) };
      }).filter((c) => AROMA_BY_ID[c.aromaId]);
      if (!components.length) return null;
      return { name: (name || "Ricetta importata").trim(), components };
    } catch (_) {
      return null;
    }
  }

  /* Codifica Base64 sicura per URL (per link condivisibili) */
  function toShareUrl(recipe) {
    const b64 = btoa(encodeRecipe(recipe));
    const base = location.href.split("#")[0];
    return `${base}#r=${encodeURIComponent(b64)}`;
  }

  /* --- Sintesi completa di una ricetta --------------------------------- */
  function synthesize(recipe) {
    const components = recipe.components || [];
    const profile = computeProfile(components);
    const pyramid = computePyramid(components);
    const metrics = computeMetrics(components);
    const color = blendColor(components);
    const desc = describe(profile);
    return { profile, pyramid, metrics, color, desc };
  }

  window.AURAE.Mixer = {
    blendColor, computeProfile, computePyramid, computeMetrics,
    describe, encodeRecipe, decodeRecipe, toShareUrl, synthesize,
  };
})();
