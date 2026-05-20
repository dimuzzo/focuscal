# FocusCal 🎯

**Calendario adattivo personale** — sessione universitaria, visite mediche, allenamenti.

## Privacy-first

- ✅ Tutti i dati salvati **solo sul tuo dispositivo** (localStorage)
- ✅ Zero server, zero database, zero condivisione
- ✅ Funziona offline (PWA con Service Worker)
- ✅ Installabile come app su iOS/Android/Desktop

## Deploy su GitHub Pages

1. **Crea un repository** su GitHub (es. `focuscal`)
2. **Carica tutti i file** nella root del repo:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
3. **Vai su Settings → Pages** del repository
4. Sotto "Source" seleziona `main` branch, root `/`
5. Salva. In 1-2 minuti l'app è live su `https://tuousername.github.io/focuscal/`

### Aggiornamenti futuri
Basta fare push dei nuovi file — GitHub Pages aggiorna automaticamente.

## Funzionalità

| Feature | Dettagli |
|---------|----------|
| **Viste** | Calendario mensile, Agenda (60 giorni), Focus oggi |
| **Categorie** | 📚 Studio, 🩺 Salute, 🏋️ Sport, 💡 Altro |
| **Priorità** | Alta / Media / Bassa |
| **Ripetizioni** | Giornaliera / Settimanale / Mensile |
| **Notifiche** | Push del dispositivo + Email (via client locale) |
| **Shortcuts** | `N` nuovo evento, `T` oggi, `C/A/F` cambia vista |
| **Backup** | Esporta/importa JSON |

## Notifiche

### Dispositivo (push)
- Click "Richiedi permesso notifiche" nella sezione Notifiche
- Le notifiche vengono triggerate via setTimeout (funziona con tab aperta) o via Service Worker push

### Email
- Imposta la tua email in Impostazioni → Notifiche
- Al momento del promemoria, FocusCal apre il tuo client email locale (mailto:) con il messaggio pre-compilato
- **Nessun dato viene inviato online**

## Struttura dati (localStorage)

```
focuscal_events   →  Array di eventi (tutto privato, solo browser)
focuscal_settings →  Impostazioni (nome, email locale, preferenze notifiche)
focuscal_scheduled → Promemoria in coda
```

---

Made with ❤️ — Zero backend, zero tracking, tutto tuo.
