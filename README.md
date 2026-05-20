# FocusCal 🎯

**Personal adaptive calendar** — university exams, medical appointments, workouts.

## Privacy-first

- ✅ All data saved **only on your device** (localStorage)
- ✅ Zero servers, zero databases, zero sharing
- ✅ Works offline (PWA with Service Worker)
- ✅ Installable as an app on iOS/Android/Desktop

## Deploy on GitHub Pages

1. **Create a repository** on GitHub (e.g., `focuscal`)
2. **Upload all files** to the repo root:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
3. **Go to Settings → Pages** of the repository
4. Under "Source" select `main` branch, root `/`
5. Save. In 1-2 minutes the app is live at `https://dimuzzo.github.io/focuscal/`

### Future updates
Just push the new files — GitHub Pages updates automatically.

## Features

| Feature | Details |
|---------|----------|
| **Views** | Monthly calendar, Schedule (60 days), Focus today |
| **Categories** | 📚 Study, 🩺 Health, 🏋️ Sport, 💡 Other |
| **Priority** | High / Medium / Low |
| **Repetition** | Daily / Weekly / Monthly |
| **Notifications** | Device push + Email (via local client) |
| **Shortcuts** | `N` new event, `T` today, `C/A/F` switch view |
| **Backup** | Export/import JSON |

## Notifications

### Device (push)
- Click "Request notification permission" in the Notifications section
- Notifications are triggered via setTimeout (works with tab open) or via Service Worker push

### Email
- Set your email in Settings → Notifications
- At the time of the reminder, FocusCal opens your local email client (mailto:) with the pre-filled message
- **No data is sent online**

## Data structure (localStorage)
```
focuscal_events   →  Array of events (all private, browser only)
focuscal_settings →  Settings (name, local email, notification preferences)
focuscal_scheduled → Queued reminders
```

---

Made with ❤️ — Zero backend, zero tracking, all yours.