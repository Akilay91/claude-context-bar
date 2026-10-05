import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Limit, Segment, Snapshot } from '../types'

const snapshot = { plugin: 'context-bar', key: 'snapshot' } as const
const isVisible = { plugin: 'context-bar', key: 'isVisible' } as const

const GLYPH: Record<Segment['kind'], string> = { used: '█', buffer: '▒', free: '░' }

const rank = (kind: Segment['kind']) => (kind === 'used' ? 0 : kind === 'buffer' ? 1 : 2)

const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`

// Split `width` cells across segments by share; every non-empty segment gets at least one.
const cellWidths = (segments: Segment[], total: number, width: number) => {
  const exact = segments.map(s => (total > 0 ? (s.tokens / total) * width : 0))
  const cells = exact.map((x, i) => (segments[i].tokens > 0 ? Math.max(1, Math.floor(x)) : 0))
  let left = width - cells.reduce((a, b) => a + b, 0)
  const order = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .filter(o => segments[o.i].tokens > 0)
    .sort((a, b) => b.rest - a.rest)
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length) {
    cells[order[k].i] += 1
    left -= 1
  }
  // Too many one-cell minimums: take back from the widest.
  while (left < 0) {
    cells[cells.indexOf(Math.max(...cells))] -= 1
    left += 1
  }
  return cells
}

const LIMIT_LABELS: Record<string, string> = { five_hour: '5h', seven_day: 'Woche', spend_limit: 'Budget' }

const toLimits = (rows: readonly SessionRateLimit[]): Limit[] =>
  rows.map(r => ({
    label: LIMIT_LABELS[r.kind] ?? r.kind,
    percent: Math.round(r.percentUsed),
    resetsAt: r.resetsAt ? Date.parse(r.resetsAt) || undefined : undefined,
  }))

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

const formatReset = (at: number, now: number) => {
  const d = new Date(at)
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return at - now < 24 * 3600 * 1000 ? hhmm : `${WEEKDAYS[d.getDay()]} ${hhmm}`
}

const limitColor = (percent: number) => (percent >= 90 ? '#d9534f' : percent >= 70 ? '#e0a020' : '#4caf50')

async function refresh($: EngineInterface) {
  try {
    const usage = await $.session.usage({ breakdown: 'summary' })
    const b = usage.context.breakdown
    if (!b) return false
    const segments: Segment[] = b.categories
      .flatMap(c => (c.kind === 'deferred' ? [] : [{ name: c.name, tokens: c.tokens, color: c.color, kind: c.kind }]))
      // used first, then the compaction buffer, free space at the end of the bar
      .sort((a, z) => rank(a.kind) - rank(z.kind))
    const snap: Snapshot = {
      segments,
      limits: toLimits(usage.rateLimits),
      takenAt: await $.clock.now(),
      maxTokens: b.rawMaxTokens,
      totalTokens: b.totalTokens,
      percent: b.percentage,
    }
    await $.state.set(snapshot, snap)
    return true
  } catch {
    // no session bound yet, or the breakdown failed: keep the last bar
    return false
  }
}

// At startup the session may not be bound yet: retry until the first breakdown lands.
function refreshUntilReady($: EngineInterface) {
  const retry = $.clock.every(2000, () => {
    void refresh($).then(ok => {
      if (ok) retry.cancel()
    })
  })
  void refresh($).then(ok => {
    if (ok) retry.cancel()
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'context-bar',
      description: 'Toggle the context window bar above the prompt',
    })
    const saved = await $.store.get('isVisible')
    await $.state.set(isVisible, saved !== false)
    const result = await next(e)
    refreshUntilReady($)

    return result
  })

  on('prompt.submit', async ($, e, next) => {
    void refresh($)

    return next(e)
  })

  on('command.run', { command: 'context-bar' }, async $ => {
    const { value = true } = await $.state.get(isVisible)
    const now = !value
    await $.state.set(isVisible, now)
    await $.store.set('isVisible', now)
    if (now) {
      await refresh($)
    }

    return { text: now ? 'Context bar shown.' : 'Context bar hidden.' }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { value: visible = true } = await $.state.get(isVisible)
    if (e.props.hasSurvey || !visible) return next(e)
    const { value: snap } = await $.state.get(snapshot)
    const { Box, Text } = $.ui.resolve(e)
    if (!snap || snap.segments.length === 0) {
      return <Text dimColor>Context bar: measuring… (/context-bar hides it)</Text>
    }

    const label = `${snap.percent}% · ${formatTokens(snap.totalTokens)}/${formatTokens(snap.maxTokens)}  `
    // leave room for the band's own padding, which the viewport does not count
    const width = Math.max(10, (e.viewport?.columns ?? 80) - 8)
    const total = snap.segments.reduce((a, s) => a + s.tokens, 0)
    const cells = cellWidths(snap.segments, total, width)
    const used = snap.segments.filter(s => s.kind === 'used' && s.tokens > 0)

    return (
      <Box flexDirection="column">
        <Text>
          {snap.segments.map((s, i) => (
            <Text color={s.color}>{GLYPH[s.kind].repeat(cells[i])}</Text>
          ))}
        </Text>
        <Text wrap="wrap">
          <Text bold>{label}</Text>
          {used.map(s => (
            <Text>
              <Text color={s.color}>■</Text>
              <Text dimColor>{` ${s.name} ${formatTokens(s.tokens)}  `}</Text>
            </Text>
          ))}
        </Text>
        {(snap.limits ?? []).length > 0 && (
          <Text wrap="wrap">
            {(snap.limits ?? []).map(l => {
              const filled = Math.min(10, Math.round(l.percent / 10))
              return (
                <Text>
                  <Text bold>{`${l.label} `}</Text>
                  <Text color={limitColor(l.percent)}>{'█'.repeat(filled)}</Text>
                  <Text dimColor>{'░'.repeat(10 - filled)}</Text>
                  <Text>{` ${l.percent}%`}</Text>
                  <Text dimColor>
                    {l.resetsAt ? ` · Reset ${formatReset(l.resetsAt, snap.takenAt)}` : ''}
                    {'    '}
                  </Text>
                </Text>
              )
            })}
          </Text>
        )}
      </Box>
    )
  })
}
