# Auth Page & Branding Fixes

## Kritische Probleme

1. **Falscher Name**: "ChatFlow" statt "Chatsetter" im Auth Layout
2. **Fake Testimonial**: Erfundenes Review von "Michael König" muss weg
3. **Dashboard Redirect**: User wird von / zu /accounts umgeleitet, Dashboard nicht erreichbar
4. **Logo-Problem**: Chatsetter Icon hängt falsch in der Ecke
5. **Design**: Sieht nicht aus wie Manychat/Whapi - zu simpel

---

## Aufgaben

### Agent 1: Branding & Testimonial Fix
- `app/(auth)/layout.tsx`: "ChatFlow" → "Chatsetter" ersetzen (2x)
- Fake Testimonial komplett entfernen
- ChatsetterLogo Komponente verwenden

### Agent 2: Dashboard Route Fix
- `app/page.tsx`: Redirect von /accounts zu / ändern (Dashboard als Home)
- Dashboard Page erstellen unter `app/(dashboard)/page.tsx`

### Agent 3: Auth Layout Redesign (Manychat Style)
- Cleanes, minimalistisches Design
- Zentriertes Login-Formular
- Kein überladenes Split-Screen Layout
- Professioneller SaaS Look
