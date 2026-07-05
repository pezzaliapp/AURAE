# AURÆ — Developer &amp; Technical Guide

Documentazione tecnica del prototipo AURÆ. Per la presentazione del progetto vedi **[README.md](./README.md)**.

> **Natura del progetto.** AURÆ è un prototipo **software e narrativo**. **Non** emette odori reali, **non** controlla hardware, **non** miscela sostanze e **non** fornisce istruzioni chimiche o costruttive. Tutti i valori (profili, intensità, persistenza) sono **fittizi ed estetici**.

---

## Stack tecnico

- **HTML / CSS / JavaScript vanilla** — nessun framework, nessun build step.
- **PWA** installabile con **Service Worker** per il funzionamento offline.
- **Nessuna dipendenza esterna**: nessun CDN, nessun font remoto, nessuna libreria.
- **Storage locale** via `localStorage` (nessun backend, nessun account, nessuna telemetria).
- **Percorsi relativi** (`./…`) ovunque → funziona identico in locale, in sottocartella e su GitHub Pages.
- **Font di sistema**: serif per i titoli, monospace per i dati.

---

## Struttura del progetto

```
smell-printer-prototype/
├── index.html               # App shell + tutte le sezioni (demo + concept startup)
├── manifest.webmanifest     # Manifest PWA (icone, nome, colori, scope)
├── sw.js                    # Service Worker (precache + offline)
├── .nojekyll                # Evita l'elaborazione Jekyll su GitHub Pages
├── README.md                # Documento di presentazione del progetto
├── DEVELOPER.md             # Questo file (guida tecnica)
├── PITCH.md                 # Pitch testuale per investitori
├── ROADMAP.md               # Roadmap in formato documento
├── IP-NOTICE.md             # Nota di proprietà intellettuale
├── css/
│   └── styles.css           # Stile completo (tema + sezioni startup)
├── js/
│   ├── aromas.js            # Dati della libreria di aromi (fittizi)
│   ├── mixer.js             # Motore di simulazione: profili, codici, colori
│   ├── store.js             # Archivio locale (localStorage con fallback)
│   └── app.js              # UI, interazioni, navigazione, PWA
└── icons/
    ├── icon.svg             # Icona app (purpose: any)
    ├── icon-maskable.svg    # Icona adattiva (purpose: maskable)
    ├── icon-192.png         # PNG 192×192
    ├── icon-512.png         # PNG 512×512
    └── icon-maskable-512.png# PNG maskable 512×512
```

### Ordine di caricamento degli script
`aromas.js` (dati) → `mixer.js` (logica) → `store.js` (persistenza) → `app.js` (UI). Ogni modulo espone la propria API sotto il namespace globale `window.AURAE`.

---

## Come funziona la simulazione

Ogni aroma ha un **profilo** immaginario su 6 assi (`agrumato, floreale, legnoso, speziato, fresco, dolce`) e una posizione nella **piramide olfattiva** (`testa / cuore / fondo`).

Aggiungendo "gocce" virtuali, il motore in `mixer.js` calcola una **media ponderata** per stimare:
- **colore** risultante della miscela,
- **intensità**, **persistenza** e **complessità**,
- distribuzione della **piramide** (percentuali testa/cuore/fondo),
- un **nome-umore** descrittivo.

È aritmetica su dati fittizi: **nessuna** proprietà chimica reale è coinvolta.

### Codici ricetta &amp; condivisione
Le ricette sono serializzabili in un **codice testuale compatto** e in un **link** (`#r=…`) per l'import. L'archivio è salvato in `localStorage`; è previsto un **export/backup** in JSON.

---

## Uso in locale

Tutto è statico; serve solo un piccolo server locale (il Service Worker richiede `http`/`https`, non `file://`):

```bash
# Opzione A — Python 3
python3 -m http.server 8080

# Opzione B — Node (senza installare nulla in modo permanente)
npx serve .
```

Poi apri <http://localhost:8080>. Puoi anche aprire `index.html` direttamente: l'app funziona, ma l'installazione PWA e la cache offline richiedono un server.

---

## Pubblicazione su GitHub Pages

Il progetto è **già compatibile** con GitHub Pages (percorsi relativi + `.nojekyll`).

1. **Carica i file** (dalla cartella del progetto):
   ```bash
   git init
   git add .
   git commit -m "AURÆ · Digital Olfactory Platform"
   git branch -M main
   git remote add origin https://github.com/<utente>/<repo>.git
   git push -u origin main
   ```

2. **Attiva Pages**: repo su GitHub → **Settings → Pages** →
   *Source*: **Deploy from a branch** → *Branch*: **main** → cartella **/ (root)** → **Save**.

3. Dopo circa un minuto l'app è online su
   `https://<utente>.github.io/<repo>/`.

> Repository di riferimento: <https://github.com/pezzaliapp/AURAE>
> URL Pages: <https://pezzaliapp.github.io/AURAE/>

In alternativa: qualsiasi hosting statico (Netlify, Cloudflare Pages, Vercel static).

---

## Service Worker &amp; cache

- Il Service Worker (`sw.js`) esegue il **precache** dell'app shell e serve i file offline.
- La versione della cache è definita da una costante (attuale: `aurae-v2`).
- **Dopo ogni aggiornamento dei file**, incrementa la versione (`aurae-v3`, …) per forzare il refresh offline sui dispositivi già installati.
- Essendo i percorsi **relativi**, PWA e Service Worker funzionano anche nella sottocartella `/<repo>/` tipica di GitHub Pages.

---

## Requisiti PWA (installabilità)

- `manifest.webmanifest` con `name`, `short_name`, `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`.
- Icone: SVG (`any` + `maskable`) e PNG **192×192** / **512×512** (`any` + `maskable`).
- Service Worker registrato con path relativo (`./sw.js`).

---

## Accessibilità &amp; compatibilità

- Rispetta `prefers-reduced-motion`.
- Contrasto elevato su tema scuro, focus visibile da tastiera, layout **mobile-first responsive**.
- Font di **sistema** (nessun download): serif per i titoli, monospace per i dati.
- Browser moderni (Chrome, Edge, Safari, Firefox). Installazione PWA ottimale su Chrome/Edge.

---

## Checklist prima della pubblicazione

- [x] Email di contatto configurata: **`info@alessandropezzali.it`** (in `index.html`, `PITCH.md`, `IP-NOTICE.md`).
- [ ] Verifica utente/nome del repository nel comando `git remote add`.
- [ ] Incrementa la versione della cache in `sw.js` se hai modificato i file.
- [ ] (Opzionale) Aggiorna la roadmap con eventuali novità.

---

## Possibili prossimi sviluppi (tecnici)

- Pagina **contatto** con form (richiederebbe un servizio esterno → oggi volutamente assente).
- **Export PDF** one-pager per investitori.
- **Multilingua** IT/EN completo.
- Più aromi e **famiglie olfattive**; salvataggio profili "mood".
- Prototipazione, con partner qualificati, di un **proof of concept** elettronico (fase futura, fuori da questo repository).

---

© 2026 Alessandro Pezzali. All rights reserved. — Vedi **[IP-NOTICE.md](./IP-NOTICE.md)**.
