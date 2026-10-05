# context-bar

A Claude Code mod that draws the context window as a stacked bar above the prompt, one color per `/context` category, plus your 5-hour and weekly usage limits.

```
████████████▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
12% · 121k/1.0M  ■ System prompt 4k  ■ System tools 40k  ■ Messages 55k
5h ███░░░░░░░ 27% · Reset 14:30    Woche █░░░░░░░░░ 8% · Reset Mo 09:00
```

- `█` used, by category · `▒` autocompact buffer · `░` free space
- Limit colors: green below 70 %, yellow from 70 %, red from 90 %
- Refreshes after every turn, using a local estimate (no extra API calls)
- `/context-bar` shows or hides it; the choice persists across sessions

## Install

Inside Claude Code, so it loads in every session:

```
/plugin marketplace add Akilay91/claude-context-bar
/plugin install context-bar@akilay
```

Or for one session only:

```bash
git clone https://github.com/Akilay91/claude-context-bar
claude --plugin-dir ./claude-context-bar
```

Works in the terminal and in the desktop app's Code tab.

## Files

- `hooks/register.tsx` — the mod
- `types/index.d.ts` — its state contract
- `.claude-plugin/plugin.json` — manifest

Check it with `claude plugin validate .`
