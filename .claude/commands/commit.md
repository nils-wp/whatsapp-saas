# Commit Skill

Erstellt einen sauberen Git Commit mit standardisiertem Format.

## Workflow

1. `git status` prüfen
2. `git diff --stat` für Überblick
3. Änderungen analysieren und Commit-Typ bestimmen:
   - `feat:` - Neue Features
   - `fix:` - Bugfixes
   - `refactor:` - Code-Refactoring
   - `docs:` - Dokumentation
   - `style:` - Formatierung
   - `test:` - Tests
   - `chore:` - Sonstiges

4. Commit erstellen mit HEREDOC:
```bash
git add . && git commit -m "$(cat <<'EOF'
<type>: <kurze Beschreibung>

<optionale Details>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

5. Optional: `git push` wenn angefragt

## Regeln
- Commit-Message auf Englisch
- Erste Zeile max. 72 Zeichen
- Keine .env oder Credential-Dateien committen
- Immer Co-Author-Tag hinzufügen
