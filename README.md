# context-bar

Eine Mod für Claude Code. Sie zeigt über dem Eingabefeld, wie voll das Kontextfenster ist (eine Farbe je Kategorie, wie bei `/context`), und darunter den Verbrauch des 5-Stunden- und des Wochenlimits.

```
████████████▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
12% · 121k/1.0M  ■ System prompt 4k  ■ System tools 40k  ■ Messages 55k
5h ███░░░░░░░ 27% · Reset 14:30    Woche █░░░░░░░░░ 8% · Reset Mo 09:00
```

## Installation

Voraussetzung: eine aktuelle Version von Claude Code (Terminal oder Code-Tab der Desktop-App).

Die folgenden zwei Befehle **in Claude Code** eintippen, nicht in die Windows-Eingabeaufforderung. Danach lädt die Mod in jeder neuen Sitzung automatisch.

**Aus dem WEINMANN-GitLab:**

```
/plugin marketplace add https://gitlab-free.weinmann.tech/mods-and-skills/context-usage-mod.git
```

```
/plugin install context-bar@akilay
```

Beim ersten Mal öffnet sich eventuell ein Login-Fenster für GitLab: mit dem eigenen WEINMANN-Konto anmelden.

**Alternativ von GitHub:**

```
/plugin marketplace add Akilay91/claude-context-bar
```

```
/plugin install context-bar@akilay
```

Anschließend eine **neue Sitzung** starten. Über dem Eingabefeld erscheint kurz `Context bar: measuring…`, nach ein, zwei Sekunden der Balken.

## Bedienung

- `/context-bar` blendet den Balken aus oder wieder ein. Die Einstellung bleibt über Sitzungen hinweg erhalten.
- Der Balken aktualisiert sich bei jeder Nachricht und nach jeder Antwort. Die Werte sind eine lokale Schätzung und kosten keine zusätzlichen Anfragen.
- Claude bekommt dieselben Werte bei jeder Nachricht als kurze, unsichtbare Zeile mit (`[context-bar] Context window: 23% used …`, etwa 30 Tokens). So kann Claude von sich aus rechtzeitig eine frische Sitzung oder eine Übergabe vorschlagen.

**Zeichen im Kontext-Balken:**

| Zeichen | Bedeutung |
|---|---|
| `█` farbig | belegt, eine Farbe je Kategorie (Legende darunter) |
| `▒` | Reserve für das automatische Zusammenfassen (Auto-Compact) |
| `░` | frei |

**Limits:** grün unter 70 %, gelb ab 70 %, rot ab 90 %. Dahinter steht, wann das Limit zurückgesetzt wird.

## Aktualisieren

```
/plugin marketplace update akilay
```

Dann im Menü `/plugin` bei context-bar „Update“ wählen, oder im Terminal:

```bash
claude plugin update context-bar@akilay
```

Danach eine neue Sitzung starten.

## Entfernen

```
/plugin uninstall context-bar@akilay
```

## Für Entwickler

- `hooks/register.tsx`: die Mod
- `types/index.d.ts`: ihr State-Vertrag
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: Manifeste

Prüfen mit `claude plugin validate .`, für eine einzelne Sitzung ohne Installation laden mit `claude --plugin-dir <Ordner>`.
