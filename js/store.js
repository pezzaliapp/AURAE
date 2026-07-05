/* ============================================================================
 * AURÆ · Smell Printer Prototype
 * store.js — Archivio locale delle ricette (localStorage, nessun backend)
 *
 * Tutto resta sul dispositivo dell'utente. Nessun account, nessun server,
 * nessuna telemetria. Se localStorage non è disponibile, si degrada a
 * memoria volatile per non rompere l'esperienza.
 * ==========================================================================*/

(function () {
  const KEY = "aurae.recipes.v1";
  let memoryFallback = [];
  let usingMemory = false;

  function safeParse(str) {
    try { return JSON.parse(str); } catch (_) { return null; }
  }

  function readAll() {
    if (usingMemory) return memoryFallback.slice();
    try {
      const raw = localStorage.getItem(KEY);
      const arr = safeParse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      usingMemory = true;
      return memoryFallback.slice();
    }
  }

  function writeAll(list) {
    if (usingMemory) { memoryFallback = list.slice(); return true; }
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (_) {
      usingMemory = true;
      memoryFallback = list.slice();
      return false;
    }
  }

  /* Genera un id senza dipendenze (timestamp + contatore) */
  let _seq = 0;
  function makeId() {
    _seq = (_seq + 1) % 100000;
    return "r" + Date.now().toString(36) + _seq.toString(36);
  }

  function list() {
    return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function get(id) {
    return readAll().find((r) => r.id === id) || null;
  }

  function save(recipe) {
    const all = readAll();
    const now = Date.now();
    if (recipe.id) {
      const idx = all.findIndex((r) => r.id === recipe.id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...recipe, updatedAt: now };
        writeAll(all);
        return all[idx];
      }
    }
    const entry = {
      id: makeId(),
      name: recipe.name || "Ricetta senza nome",
      components: recipe.components || [],
      createdAt: now,
      updatedAt: now,
    };
    all.push(entry);
    writeAll(all);
    return entry;
  }

  function remove(id) {
    const all = readAll().filter((r) => r.id !== id);
    return writeAll(all);
  }

  function clearAll() {
    return writeAll([]);
  }

  /* Esporta l'intero archivio come oggetto JSON (per backup manuale) */
  function exportAll() {
    return { app: "AURAE", version: 1, exportedAt: Date.now(), recipes: readAll() };
  }

  function isVolatile() { return usingMemory; }

  window.AURAE = window.AURAE || {};
  window.AURAE.Store = { list, get, save, remove, clearAll, exportAll, isVolatile };
})();
