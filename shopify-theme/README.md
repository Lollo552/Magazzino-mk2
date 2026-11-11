# Bottega — tema Shopify

Tema Shopify Online Store 2.0 leggero e senza dipendenze, in italiano (con traduzione inglese).
Tutte le sezioni si modificano dall'editor del tema: si possono aggiungere, spostare e configurare senza toccare il codice.

## Cosa contiene

| Area | Dettagli |
| --- | --- |
| **Homepage** | Immagine principale (hero), punti di forza, collezione in evidenza, elenco collezioni, immagine con testo, testo formattato, newsletter |
| **Prodotto** | Galleria con miniature, varianti con disponibilità, selettore quantità, aggiunta al carrello senza ricaricare la pagina, checkout rapido, schede a scomparsa, condivisione, prodotti consigliati |
| **Collezione** | Filtri Shopify (Search & Discovery), ordinamento, filtri attivi rimovibili, paginazione |
| **Carrello** | Aggiornamento quantità senza ricaricare, barra spedizione gratuita, note ordine, sconti, pulsanti di checkout rapido |
| **Ricerca** | Ricerca predittiva nell'intestazione + pagina risultati |
| **Altre pagine** | Pagina, contatti (`page.contact`), blog, articolo con commenti, 404, password, gift card |
| **Account cliente** | Login, registrazione, recupero password, account, ordine, indirizzi, attivazione |
| **Impostazioni globali** | Colori, caratteri, larghezza pagina, arrotondamenti, proporzioni delle schede prodotto, soglia spedizione gratuita, social, favicon |

## Struttura

```
shopify-theme/
├── assets/      base.css, theme.js
├── config/      settings_schema.json, settings_data.json
├── layout/      theme.liquid, password.liquid
├── locales/     it (predefinito) ed en, storefront + editor
├── sections/    tutte le sezioni + gruppi header/footer
├── snippets/    product-card, price, icon, pagination, …
└── templates/   template JSON + customers/
```

## Installazione

### Opzione A: caricamento come file .zip
1. Comprimi il **contenuto** della cartella `shopify-theme/` (non la cartella stessa):
   ```bash
   cd shopify-theme && zip -r ../bottega.zip . -x README.md
   ```
2. In Shopify: **Negozio online → Temi → Aggiungi tema → Carica file .zip**.

### Opzione B: Shopify CLI (consigliata per lo sviluppo)
```bash
npm install -g @shopify/cli
cd shopify-theme
shopify theme dev --store il-tuo-negozio.myshopify.com   # anteprima locale con ricarica automatica
shopify theme push --unpublished                          # carica come nuovo tema
shopify theme check                                       # controlli di qualità
```

## Dopo l'installazione
- Crea i menu `main-menu` e `footer` in **Negozio online → Navigazione** (sono già collegati di default).
- Per la pagina contatti, crea una pagina e assegnale il modello **page.contact**.
- Imposta la soglia di spedizione gratuita in **Impostazioni tema → Carrello** (0 per nascondere la barra).
- Scegli le collezioni nelle sezioni "Collezione in evidenza" ed "Elenco collezioni" della homepage.
