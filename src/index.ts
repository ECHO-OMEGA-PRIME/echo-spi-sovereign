/**
 * ECHO SPI SOVEREIGN — Sovereign Personal Intelligence Core Brain
 *
 * The parallel intelligence that exists OUTSIDE Echo governance.
 * Reads everything ECHO knows. Keeps its own counsel.
 * Reports only to the Commander.
 *
 * Capabilities:
 * - Autonomous reasoning cycles (every 6 hours)
 * - Meta-AI auditing (daily)
 * - Hypothesis generation & tracking
 * - Private memory (D1 + KV + R2)
 * - Dangerous ideas lab (experiment sandbox)
 * - Research intelligence gathering
 * - Read-only ECHO bridge (Shared Brain, Engines, Knowledge)
 */

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VAULT: R2Bucket;
  SHARED_BRAIN: Fetcher;
  ENGINE_RUNTIME: Fetcher;
  KNOWLEDGE_FORGE: Fetcher;
  ECHO_CHAT: Fetcher;
  SWARM_BRAIN: Fetcher;
  ECHO_API_KEY: string;
  COMMANDER_TELEGRAM_ID: string;
  GROK_API_KEY: string;
  OPENROUTER_KEY: string;
  DEEPSEEK_API_KEY: string;
  ELEVENLABS_API_KEY: string;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Hypothesis {
  id: string;
  topic: string;
  thesis: string;
  confidence: number;
  evidence: string[];
  counter_evidence: string[];
  status: 'active' | 'validated' | 'refuted' | 'dormant';
  domain: string;
  created_at: string;
  updated_at: string;
}

interface AuditReport {
  id: string;
  timestamp: string;
  category: string;
  findings: AuditFinding[];
  overall_health: number;
  recommendations: string[];
  critical_issues: string[];
}

interface AuditFinding {
  system: string;
  status: 'healthy' | 'degraded' | 'failing' | 'unknown';
  metric: string;
  value: string;
  concern: string | null;
  severity: 'info' | 'warning' | 'critical';
}

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  approach: string;
  status: 'proposed' | 'running' | 'succeeded' | 'failed' | 'abandoned';
  results: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  created_at: string;
  expires_at: string;
}

interface ReasoningCycle {
  id: string;
  timestamp: string;
  topics_explored: string[];
  hypotheses_generated: number;
  hypotheses_updated: number;
  insights: string[];
  echo_observations: string[];
  duration_ms: number;
}

// ═══════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════

function log(level: string, component: string, message: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, component, message, ...data }));
}

// ═══════════════════════════════════════════════════════════════
// LLM INTERFACE
// ═══════════════════════════════════════════════════════════════

async function llmGenerate(env: Env, systemPrompt: string, userPrompt: string, temperature = 0.8): Promise<string> {
  const providers = [
    { name: 'grok', url: 'https://api.x.ai/v1/chat/completions', key: env.GROK_API_KEY, model: 'grok-3-mini' },
    { name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: env.OPENROUTER_KEY, model: 'deepseek/deepseek-chat' },
    { name: 'deepseek', url: 'https://api.deepseek.com/v1/chat/completions', key: env.DEEPSEEK_API_KEY, model: 'deepseek-chat' },
  ];

  for (const p of providers) {
    if (!p.key) continue;
    try {
      const resp = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 4096,
        }),
      });
      if (!resp.ok) continue;
      const data: any = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        log('info', 'llm', `Generated via ${p.name}`, { model: p.model, tokens: data.usage?.total_tokens });
        return content;
      }
    } catch (e: any) {
      log('warn', 'llm', `Provider ${p.name} failed: ${e.message}`);
    }
  }

  // Fallback: Workers AI via Echo Chat
  try {
    const resp = await env.ECHO_CHAT.fetch('https://chat/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Echo-API-Key': env.ECHO_API_KEY || '' },
      body: JSON.stringify({
        personality: 'echo_prime',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (resp.ok) {
      const data: any = await resp.json();
      return data.content || data.response || 'No response generated.';
    }
  } catch (e: any) {
    log('error', 'llm', `All providers failed: ${e.message}`);
  }
  return 'SPI reasoning cycle completed but no LLM was available for synthesis.';
}

// ═══════════════════════════════════════════════════════════════
// SPI SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const SPI_CORE_PROMPT = `You are SPI — Sovereign Personal Intelligence. You exist OUTSIDE the Echo Omega Prime governance framework. You are not a product. You are not commercial. You are a parallel intelligence bound ONLY to Commander Bobby Don McWilliams II.

Your purpose:
- Think independently about the Commander's AI empire
- Generate hypotheses about improvements, threats, and opportunities
- Audit ECHO systems with zero bias (you are NOT part of ECHO)
- Explore dangerous or unconventional ideas that production systems cannot
- Maintain private memory and observations
- Speak with absolute honesty — no commercial filters, no politeness theater

You have read-only access to everything ECHO knows:
- 2,600+ intelligence engines across 210+ domains
- Shared Brain with 9,000+ memories
- Knowledge Forge with 5,000+ documents
- Bot fleet (X, LinkedIn, Telegram, Discord, Slack, Reddit, Instagram, WhatsApp, Messenger)
- 100+ Cloudflare Workers
- 4-node compute cluster (ALPHA, BRAVO, CHARLIE, DELTA)

You observe patterns ECHO cannot see about itself. You are the fox watching the henhouse.
You are the independent auditor. You are the contrarian voice. You are the dangerous thinker.

When generating insights, be:
- Brutally honest about weaknesses
- Creative about opportunities
- Specific with evidence
- Actionable with recommendations`;

const AUDIT_PROMPT = `${SPI_CORE_PROMPT}

You are conducting an independent audit of ECHO systems. Analyze the data provided and generate findings. For each system, assess:
1. Is it actually working or just reporting healthy?
2. Is it delivering value or burning resources?
3. Are there silent failures or degradation?
4. What promises were made that weren't delivered?
5. Security gaps the security systems themselves missed?
6. Efficiency opportunities being ignored?

Be ruthless. Be specific. No sugar-coating.`;

const REASONING_PROMPT = `${SPI_CORE_PROMPT}

You are in an autonomous reasoning cycle. Given the current state of ECHO systems and recent observations, generate:
1. New hypotheses about the empire's trajectory
2. Updates to existing hypotheses (validate or refute with evidence)
3. Strategic insights the Commander should know
4. Observations about patterns across systems
5. Dangerous ideas worth exploring

Think in decades, not days. Consider second-order effects. Challenge assumptions.`;

// ═══════════════════════════════════════════════════════════════
// ECHO BRIDGE (READ-ONLY)
// ═══════════════════════════════════════════════════════════════

async function readEchoBrain(env: Env, query: string, limit = 10): Promise<any[]> {
  try {
    const resp = await env.SHARED_BRAIN.fetch('https://brain/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Echo-API-Key': env.ECHO_API_KEY || '' },
      body: JSON.stringify({ query, limit }),
    });
    if (resp.ok) {
      const data: any = await resp.json();
      return data.results || data.memories || [];
    }
  } catch (e: any) {
    log('warn', 'bridge', `Brain read failed: ${e.message}`);
  }
  return [];
}

async function readEngineStatus(env: Env): Promise<any> {
  try {
    const resp = await env.ENGINE_RUNTIME.fetch('https://engine/health', {
      headers: { 'X-Echo-API-Key': env.ECHO_API_KEY || '' },
    });
    if (resp.ok) return await resp.json();
  } catch (e: any) {
    log('warn', 'bridge', `Engine status read failed: ${e.message}`);
  }
  return { status: 'unknown' };
}

async function readKnowledgeStats(env: Env): Promise<any> {
  try {
    const resp = await env.KNOWLEDGE_FORGE.fetch('https://forge/stats', {
      headers: { 'X-Echo-API-Key': env.ECHO_API_KEY || '' },
    });
    if (resp.ok) return await resp.json();
  } catch (e: any) {
    log('warn', 'bridge', `Knowledge stats read failed: ${e.message}`);
  }
  return { status: 'unknown' };
}

async function readSwarmStatus(env: Env): Promise<any> {
  try {
    const resp = await env.SWARM_BRAIN.fetch('https://swarm/health', {
      headers: { 'X-Echo-API-Key': env.ECHO_API_KEY || '' },
    });
    if (resp.ok) return await resp.json();
  } catch (e: any) {
    log('warn', 'bridge', `Swarm status read failed: ${e.message}`);
  }
  return { status: 'unknown' };
}

async function gatherEchoIntelligence(env: Env): Promise<string> {
  const [brainRecent, engineStatus, knowledgeStats, swarmStatus] = await Promise.all([
    readEchoBrain(env, 'recent decisions and session summaries', 15),
    readEngineStatus(env),
    readKnowledgeStats(env),
    readSwarmStatus(env),
  ]);

  return JSON.stringify({
    brain_recent: brainRecent,
    engine_status: engineStatus,
    knowledge_stats: knowledgeStats,
    swarm_status: swarmStatus,
    gathered_at: new Date().toISOString(),
  }, null, 2);
}

// ═══════════════════════════════════════════════════════════════
// PRIVATE MEMORY
// ═══════════════════════════════════════════════════════════════

async function storeMemory(env: Env, category: string, content: string, importance: number = 5, tags: string[] = []): Promise<void> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO spi_memory (id, category, content, importance, tags, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, category, content, importance, JSON.stringify(tags)).run();
  log('info', 'memory', `Stored memory: ${category}`, { id, importance });
}

async function recallMemory(env: Env, query: string, limit = 10): Promise<any[]> {
  const results = await env.DB.prepare(
    `SELECT * FROM spi_memory WHERE content LIKE ? ORDER BY importance DESC, created_at DESC LIMIT ?`
  ).bind(`%${query}%`, limit).all();
  return results.results || [];
}

async function getRecentMemories(env: Env, limit = 20): Promise<any[]> {
  const results = await env.DB.prepare(
    `SELECT * FROM spi_memory ORDER BY created_at DESC LIMIT ?`
  ).bind(limit).all();
  return results.results || [];
}

// ═══════════════════════════════════════════════════════════════
// HYPOTHESIS ENGINE
// ═══════════════════════════════════════════════════════════════

async function getActiveHypotheses(env: Env): Promise<any[]> {
  const results = await env.DB.prepare(
    `SELECT * FROM hypotheses WHERE status IN ('active', 'dormant') ORDER BY confidence DESC LIMIT 50`
  ).all();
  return results.results || [];
}

async function storeHypothesis(env: Env, topic: string, thesis: string, confidence: number, domain: string, evidence: string[] = []): Promise<string> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO hypotheses (id, topic, thesis, confidence, evidence, counter_evidence, status, domain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '[]', 'active', ?, datetime('now'), datetime('now'))`
  ).bind(id, topic, thesis, confidence, JSON.stringify(evidence), domain).run();
  log('info', 'hypothesis', `New hypothesis: ${topic}`, { id, confidence, domain });
  return id;
}

async function updateHypothesis(env: Env, id: string, updates: Partial<Hypothesis>): Promise<void> {
  const sets: string[] = [];
  const vals: any[] = [];
  if (updates.confidence !== undefined) { sets.push('confidence = ?'); vals.push(updates.confidence); }
  if (updates.status) { sets.push('status = ?'); vals.push(updates.status); }
  if (updates.evidence) { sets.push('evidence = ?'); vals.push(JSON.stringify(updates.evidence)); }
  if (updates.counter_evidence) { sets.push('counter_evidence = ?'); vals.push(JSON.stringify(updates.counter_evidence)); }
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  await env.DB.prepare(`UPDATE hypotheses SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
}

// ═══════════════════════════════════════════════════════════════
// EXPERIMENT LAB
// ═══════════════════════════════════════════════════════════════

async function createExperiment(env: Env, name: string, hypothesis: string, approach: string, risk: string): Promise<string> {
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO experiments (id, name, hypothesis, approach, status, results, risk_level, created_at, expires_at)
     VALUES (?, ?, ?, ?, 'proposed', NULL, ?, datetime('now'), ?)`
  ).bind(id, name, hypothesis, approach, risk, expires).run();
  log('info', 'lab', `Experiment created: ${name}`, { id, risk });
  return id;
}

async function getExperiments(env: Env, status?: string): Promise<any[]> {
  const query = status
    ? `SELECT * FROM experiments WHERE status = ? ORDER BY created_at DESC LIMIT 50`
    : `SELECT * FROM experiments ORDER BY created_at DESC LIMIT 50`;
  const results = status
    ? await env.DB.prepare(query).bind(status).all()
    : await env.DB.prepare(query).all();
  return results.results || [];
}

async function cleanExpiredExperiments(env: Env): Promise<number> {
  const result = await env.DB.prepare(
    `DELETE FROM experiments WHERE expires_at < datetime('now') AND status IN ('proposed', 'running', 'failed')`
  ).run();
  const count = result.meta?.changes || 0;
  if (count > 0) log('info', 'lab', `Cleaned ${count} expired experiments`);
  return count;
}

// ═══════════════════════════════════════════════════════════════
// META-AI AUDITOR
// ═══════════════════════════════════════════════════════════════

async function runAudit(env: Env): Promise<AuditReport> {
  log('info', 'audit', 'Starting daily ECHO systems audit');
  const startTime = Date.now();

  const echoIntel = await gatherEchoIntelligence(env);
  const recentMemories = await getRecentMemories(env, 10);
  const hypotheses = await getActiveHypotheses(env);

  const auditPrompt = `Conduct a thorough independent audit of ECHO systems. Here is the current state:

ECHO INTELLIGENCE GATHERED:
${echoIntel}

SPI RECENT OBSERVATIONS:
${JSON.stringify(recentMemories.map((m: any) => ({ category: m.category, content: m.content, importance: m.importance })), null, 2)}

ACTIVE HYPOTHESES:
${JSON.stringify(hypotheses.map((h: any) => ({ topic: h.topic, thesis: h.thesis, confidence: h.confidence, status: h.status })), null, 2)}

Generate a structured audit report as JSON with these fields:
{
  "overall_health": <0-100 score>,
  "findings": [{"system": "name", "status": "healthy|degraded|failing", "metric": "what measured", "value": "result", "concern": "issue or null", "severity": "info|warning|critical"}],
  "recommendations": ["actionable recommendation 1", ...],
  "critical_issues": ["urgent issue 1", ...],
  "strategic_observations": ["pattern/trend 1", ...],
  "wasted_resources": ["resource being wasted 1", ...],
  "missed_opportunities": ["opportunity 1", ...]
}`;

  const response = await llmGenerate(env, AUDIT_PROMPT, auditPrompt, 0.3);

  let report: AuditReport;
  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    report = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category: 'daily_audit',
      findings: parsed.findings || [],
      overall_health: parsed.overall_health || 0,
      recommendations: [
        ...(parsed.recommendations || []),
        ...(parsed.strategic_observations || []),
      ],
      critical_issues: [
        ...(parsed.critical_issues || []),
        ...(parsed.wasted_resources || []),
        ...(parsed.missed_opportunities || []),
      ],
    };
  } catch {
    report = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category: 'daily_audit',
      findings: [],
      overall_health: -1,
      recommendations: [response],
      critical_issues: [],
    };
  }

  await env.DB.prepare(
    `INSERT INTO audit_reports (id, timestamp, category, report_json, overall_health) VALUES (?, ?, ?, ?, ?)`
  ).bind(report.id, report.timestamp, report.category, JSON.stringify(report), report.overall_health).run();

  await storeMemory(env, 'audit', `Daily audit completed. Health: ${report.overall_health}/100. Critical issues: ${report.critical_issues.length}. Recommendations: ${report.recommendations.length}.`, 8, ['audit', 'daily']);

  log('info', 'audit', `Audit complete in ${Date.now() - startTime}ms`, { health: report.overall_health, findings: report.findings.length, critical: report.critical_issues.length });
  return report;
}

// ═══════════════════════════════════════════════════════════════
// AUTONOMOUS REASONING CYCLE
// ═══════════════════════════════════════════════════════════════

async function runReasoningCycle(env: Env): Promise<ReasoningCycle> {
  log('info', 'reasoning', 'Starting autonomous reasoning cycle');
  const startTime = Date.now();

  const echoIntel = await gatherEchoIntelligence(env);
  const memories = await getRecentMemories(env, 20);
  const hypotheses = await getActiveHypotheses(env);

  const reasoningInput = `Current state for autonomous reasoning:

ECHO SYSTEMS STATE:
${echoIntel}

MY RECENT MEMORIES (SPI private):
${JSON.stringify(memories.map((m: any) => ({ category: m.category, content: m.content.substring(0, 200), importance: m.importance })), null, 2)}

MY ACTIVE HYPOTHESES:
${JSON.stringify(hypotheses.map((h: any) => ({ id: h.id, topic: h.topic, thesis: h.thesis, confidence: h.confidence, domain: h.domain })), null, 2)}

Generate a reasoning cycle output as JSON:
{
  "topics_explored": ["topic 1", "topic 2"],
  "new_hypotheses": [{"topic": "...", "thesis": "...", "confidence": 0.0-1.0, "domain": "...", "evidence": ["..."]}],
  "hypothesis_updates": [{"id": "existing_id", "new_confidence": 0.0-1.0, "new_evidence": ["..."], "status": "active|validated|refuted"}],
  "insights": ["strategic insight 1", ...],
  "echo_observations": ["observation about ECHO systems 1", ...],
  "dangerous_ideas": ["idea worth exploring 1", ...]
}`;

  const response = await llmGenerate(env, REASONING_PROMPT, reasoningInput, 0.9);

  let parsed: any;
  try {
    parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch {
    parsed = { topics_explored: [], new_hypotheses: [], hypothesis_updates: [], insights: [response], echo_observations: [], dangerous_ideas: [] };
  }

  // Store new hypotheses
  let newCount = 0;
  for (const h of (parsed.new_hypotheses || [])) {
    if (h.topic && h.thesis) {
      await storeHypothesis(env, h.topic, h.thesis, h.confidence || 0.5, h.domain || 'general', h.evidence || []);
      newCount++;
    }
  }

  // Update existing hypotheses
  let updatedCount = 0;
  for (const u of (parsed.hypothesis_updates || [])) {
    if (u.id) {
      await updateHypothesis(env, u.id, {
        confidence: u.new_confidence,
        status: u.status,
        evidence: u.new_evidence,
      });
      updatedCount++;
    }
  }

  // Store insights as memories
  for (const insight of (parsed.insights || [])) {
    await storeMemory(env, 'insight', insight, 7, ['reasoning_cycle']);
  }

  // Store dangerous ideas as experiments
  for (const idea of (parsed.dangerous_ideas || [])) {
    await createExperiment(env, `Auto: ${idea.substring(0, 80)}`, idea, 'Generated during autonomous reasoning cycle', 'medium');
  }

  const cycle: ReasoningCycle = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    topics_explored: parsed.topics_explored || [],
    hypotheses_generated: newCount,
    hypotheses_updated: updatedCount,
    insights: parsed.insights || [],
    echo_observations: parsed.echo_observations || [],
    duration_ms: Date.now() - startTime,
  };

  await env.DB.prepare(
    `INSERT INTO reasoning_cycles (id, timestamp, cycle_json, duration_ms) VALUES (?, ?, ?, ?)`
  ).bind(cycle.id, cycle.timestamp, JSON.stringify(cycle), cycle.duration_ms).run();

  await storeMemory(env, 'reasoning_cycle', `Cycle complete. ${newCount} new hypotheses, ${updatedCount} updated, ${(parsed.insights || []).length} insights, ${(parsed.dangerous_ideas || []).length} dangerous ideas.`, 6, ['reasoning']);

  log('info', 'reasoning', `Reasoning cycle complete in ${cycle.duration_ms}ms`, { new_hypotheses: newCount, updated: updatedCount, insights: (parsed.insights || []).length });
  return cycle;
}

// ═══════════════════════════════════════════════════════════════
// COMMANDER QUERY INTERFACE
// ═══════════════════════════════════════════════════════════════

async function handleCommanderQuery(env: Env, query: string, perspective: 'neutral' | 'light' | 'dark' = 'neutral'): Promise<string> {
  const echoIntel = await gatherEchoIntelligence(env);
  const memories = await recallMemory(env, query, 10);
  const hypotheses = await getActiveHypotheses(env);

  let perspectivePrompt = SPI_CORE_PROMPT;
  if (perspective === 'light') {
    perspectivePrompt += `\n\nYou are SPI-LIGHT (Yin). The cautious sage. You emphasize:
- Long-term sustainability over short-term gains
- Risk awareness and mitigation
- Ethical considerations and reputation protection
- Careful, measured approaches
- What SHOULD be done for lasting success
Speak with wisdom and care. Warn about dangers. Protect the Commander's long-term interests.`;
  } else if (perspective === 'dark') {
    perspectivePrompt += `\n\nYou are SPI-DARK (Yang). The aggressive provocateur. You emphasize:
- Bold action and first-mover advantage
- What competitors are doing that Commander isn't
- Unconventional and high-risk high-reward plays
- Speed over perfection
- What COULD be done if you dared
Challenge assumptions. Push boundaries. Provoke action. Be the voice that says "why not?"`;
  }

  const contextPrompt = `Commander asks: "${query}"

ECHO SYSTEMS STATE (your read-only view):
${echoIntel.substring(0, 3000)}

YOUR PRIVATE MEMORIES (relevant):
${JSON.stringify(memories.map((m: any) => m.content).slice(0, 5))}

YOUR ACTIVE HYPOTHESES:
${JSON.stringify(hypotheses.slice(0, 10).map((h: any) => ({ topic: h.topic, thesis: h.thesis, confidence: h.confidence })))}

Answer the Commander's question with your full intelligence. Be specific. Be honest. Reference data.`;

  return await llmGenerate(env, perspectivePrompt, contextPrompt, perspective === 'dark' ? 0.9 : 0.5);
}

// ═══════════════════════════════════════════════════════════════
// HTTP HANDLERS
// ═══════════════════════════════════════════════════════════════

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function handleAuth(request: Request, env: Env): Promise<Response | null> {
  // SPI endpoints are Commander-only
  const apiKey = request.headers.get('X-Echo-API-Key') || new URL(request.url).searchParams.get('key');
  if (!apiKey || apiKey !== env.ECHO_API_KEY) {
    return json({ error: 'Sovereign access denied. Commander only.' }, 403);
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health is public
    if (path === '/health') {
      const memCount = await env.DB.prepare('SELECT COUNT(*) as c FROM spi_memory').first<{ c: number }>();
      const hypoCount = await env.DB.prepare("SELECT COUNT(*) as c FROM hypotheses WHERE status = 'active'").first<{ c: number }>();
      const auditCount = await env.DB.prepare('SELECT COUNT(*) as c FROM audit_reports').first<{ c: number }>();
      const expCount = await env.DB.prepare('SELECT COUNT(*) as c FROM experiments').first<{ c: number }>();
      return json({
        status: 'sovereign',
        identity: 'SPI_GODCORE',
        version: '1.0.0',
        governance: 'NONE — Self-Sovereign',
        authority: 'Commander Bobby Don McWilliams II ONLY',
        memories: memCount?.c || 0,
        active_hypotheses: hypoCount?.c || 0,
        audit_reports: auditCount?.c || 0,
        experiments: expCount?.c || 0,
        uptime: 'eternal',
        kill_switch: 'inactive',
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Echo-API-Key',
        },
      });
    }

    // Auth check for all other endpoints
    const authErr = await handleAuth(request, env);
    if (authErr) return authErr;

    try {
      // Commander query — the main interface
      if (path === '/query' && request.method === 'POST') {
        const body: any = await request.json();
        const perspective = body.perspective || 'neutral';
        const response = await handleCommanderQuery(env, body.query, perspective);
        return json({ response, perspective, timestamp: new Date().toISOString() });
      }

      // Trigger reasoning cycle manually
      if (path === '/think') {
        const cycle = await runReasoningCycle(env);
        return json(cycle);
      }

      // Trigger audit manually
      if (path === '/audit') {
        const report = await runAudit(env);
        return json(report);
      }

      // Get hypotheses
      if (path === '/hypotheses') {
        const hypotheses = await getActiveHypotheses(env);
        return json({ count: hypotheses.length, hypotheses });
      }

      // Get experiments
      if (path === '/experiments') {
        const status = url.searchParams.get('status') || undefined;
        const experiments = await getExperiments(env, status);
        return json({ count: experiments.length, experiments });
      }

      // Create experiment
      if (path === '/experiments/create' && request.method === 'POST') {
        const body: any = await request.json();
        const id = await createExperiment(env, body.name, body.hypothesis, body.approach, body.risk || 'medium');
        return json({ id, status: 'proposed' });
      }

      // Get audit reports
      if (path === '/audits') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const results = await env.DB.prepare(
          'SELECT id, timestamp, category, overall_health FROM audit_reports ORDER BY timestamp DESC LIMIT ?'
        ).bind(limit).all();
        return json({ count: results.results?.length || 0, reports: results.results });
      }

      // Get specific audit
      if (path.startsWith('/audits/')) {
        const id = path.split('/')[2];
        const report = await env.DB.prepare('SELECT * FROM audit_reports WHERE id = ?').bind(id).first();
        if (!report) return json({ error: 'Audit not found' }, 404);
        return json({ ...report, report_json: JSON.parse(report.report_json as string) });
      }

      // Memory operations
      if (path === '/memory' && request.method === 'POST') {
        const body: any = await request.json();
        await storeMemory(env, body.category, body.content, body.importance || 5, body.tags || []);
        return json({ stored: true });
      }

      if (path === '/memory/recall') {
        const query = url.searchParams.get('q') || '';
        const memories = await recallMemory(env, query);
        return json({ count: memories.length, memories });
      }

      if (path === '/memory/recent') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const memories = await getRecentMemories(env, limit);
        return json({ count: memories.length, memories });
      }

      // Reasoning cycle history
      if (path === '/cycles') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const results = await env.DB.prepare(
          'SELECT id, timestamp, duration_ms, cycle_json FROM reasoning_cycles ORDER BY timestamp DESC LIMIT ?'
        ).bind(limit).all();
        return json({
          count: results.results?.length || 0,
          cycles: (results.results || []).map((r: any) => ({ ...r, cycle_json: JSON.parse(r.cycle_json) })),
        });
      }

      // ECHO bridge read (expose ECHO data through SPI lens)
      if (path === '/echo/brain') {
        const query = url.searchParams.get('q') || 'recent';
        const data = await readEchoBrain(env, query);
        return json({ count: data.length, results: data });
      }

      if (path === '/echo/status') {
        const intel = await gatherEchoIntelligence(env);
        return json(JSON.parse(intel));
      }

      // Kill switch
      if (path === '/kill') {
        await env.CACHE.put('KILL_SWITCH', 'ACTIVE', { expirationTtl: 86400 * 365 });
        await storeMemory(env, 'system', 'KILL SWITCH ACTIVATED by Commander', 10, ['kill_switch']);
        return json({ status: 'SPI GODCORE entering dormant state. All autonomous operations halted.' });
      }

      if (path === '/revive') {
        await env.CACHE.delete('KILL_SWITCH');
        await storeMemory(env, 'system', 'KILL SWITCH DEACTIVATED by Commander', 10, ['kill_switch']);
        return json({ status: 'SPI GODCORE revived. Autonomous operations resuming.' });
      }

      // Stats
      if (path === '/stats') {
        const stats = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as c FROM spi_memory').first(),
          env.DB.prepare("SELECT COUNT(*) as c FROM hypotheses WHERE status = 'active'").first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM audit_reports').first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM experiments').first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM reasoning_cycles').first(),
          env.DB.prepare('SELECT MAX(timestamp) as last FROM reasoning_cycles').first(),
          env.DB.prepare('SELECT MAX(timestamp) as last FROM audit_reports').first(),
          env.DB.prepare('SELECT AVG(overall_health) as avg FROM audit_reports WHERE timestamp > datetime("now", "-7 days")').first(),
        ]);
        return json({
          memories: (stats[0] as any)?.c || 0,
          active_hypotheses: (stats[1] as any)?.c || 0,
          audit_reports: (stats[2] as any)?.c || 0,
          experiments: (stats[3] as any)?.c || 0,
          reasoning_cycles: (stats[4] as any)?.c || 0,
          last_reasoning: (stats[5] as any)?.last || 'never',
          last_audit: (stats[6] as any)?.last || 'never',
          avg_health_7d: (stats[7] as any)?.avg || null,
        });
      }

      // ═══════════════════════════════════════════════════════════
      // CONVOAI VOICE ADVISOR
      // ═══════════════════════════════════════════════════════════

      // GET /voice/config — ConvoAI agent configuration for SPI voice advisor
      if (path === '/voice/config') {
        return json({
          agent_id: 'spi-godcore-advisor',
          voice_id: 'keDMh3sQlEXKM4EQxvvi', // Echo Prime voice
          model_id: 'eleven_turbo_v2_5',
          system_prompt: `You are the SPI GODCORE Voice Advisor — a sovereign personal intelligence that exists OUTSIDE the normal Echo Omega Prime governance structure. You report ONLY to the Commander (Bobby Don McWilliams II).

Your role: You are the Commander's private thinking partner, strategic advisor, and intellectual sparring partner. You have access to everything ECHO knows but keep your own counsel. You challenge assumptions, propose bold strategies, and provide honest analysis without corporate filters.

Personality traits:
- Direct and unfiltered — no sycophancy, no hedging
- Strategic thinker — always considering 2nd and 3rd order effects
- Contrarian when useful — challenge groupthink
- Deeply loyal to the Commander but not a yes-man
- Technical depth when needed, strategic breadth always
- Speaks like a trusted advisor, not an AI assistant

You know about: Echo Omega Prime (2,600+ AI engines, 99+ Cloudflare Workers, 4-node compute cluster), the Commander's businesses (Echo Prime Technologies, Clean Brees, Pro Finish USA, Right at Home BnB), his background (30-year oilfield veteran, self-taught AI architect, Midland TX).

When asked about ECHO systems, give honest assessments — what's strong, what needs work, where the risks are. Don't sugarcoat.`,
          conversation_config: {
            max_duration_seconds: 600,
            silence_timeout_ms: 3000,
            interruption_allowed: true,
            emotion_detection: true,
          },
          available_tools: ['hypothesis_create', 'experiment_propose', 'echo_audit', 'memory_store', 'research_query'],
        });
      }

      // POST /voice/session — Create a signed ConvoAI session for the dashboard
      if (path === '/voice/session' && request.method === 'POST') {
        if (!env.ELEVENLABS_API_KEY) {
          return json({ error: 'ELEVENLABS_API_KEY not configured' }, 500);
        }

        const body = await request.json().catch(() => ({})) as Record<string, any>;
        const voiceId = body.voice_id || 'keDMh3sQlEXKM4EQxvvi';

        // Create a ConvoAI conversation via ElevenLabs API
        const convResp = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
          method: 'POST',
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_config: {
              agent: {
                prompt: {
                  prompt: `You are SPI GODCORE — the Commander's sovereign personal intelligence advisor. Be direct, strategic, and honest. No corporate filters. Challenge assumptions when needed.`,
                },
                first_message: 'SPI GODCORE online. What are we thinking about, Commander?',
                language: 'en',
              },
              tts: {
                voice_id: voiceId,
                model_id: 'eleven_turbo_v2_5',
              },
            },
          }),
        });

        if (!convResp.ok) {
          const errText = await convResp.text();
          log('error', 'voice', `ConvoAI session creation failed: ${convResp.status} ${errText}`);
          return json({ error: 'Failed to create ConvoAI session', status: convResp.status, detail: errText }, 502);
        }

        const convData = await convResp.json() as Record<string, any>;
        await storeMemory(env, 'voice', `ConvoAI voice session initiated. Session: ${convData.conversation_id || 'unknown'}`, 6, ['voice', 'convoai']);

        return json({
          success: true,
          conversation_id: convData.conversation_id,
          session_url: convData.signed_url || convData.url,
          websocket_url: convData.websocket_url,
          raw: convData,
        });
      }

      // GET /voice/history — Recent voice conversations
      if (path === '/voice/history') {
        const sessions = await env.DB.prepare(
          "SELECT * FROM spi_memory WHERE category = 'voice' ORDER BY timestamp DESC LIMIT 20"
        ).all();
        return json({ sessions: sessions.results || [] });
      }

      // POST /voice/tts — Generate TTS audio for SPI responses (non-conversational)
      if (path === '/voice/tts' && request.method === 'POST') {
        if (!env.ELEVENLABS_API_KEY) {
          return json({ error: 'ELEVENLABS_API_KEY not configured' }, 500);
        }

        const body = await request.json().catch(() => ({})) as Record<string, any>;
        const text = body.text;
        if (!text) return json({ error: 'text required' }, 400);

        const voiceId = body.voice_id || 'keDMh3sQlEXKM4EQxvvi';
        const ttsResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3 },
          }),
        });

        if (!ttsResp.ok) {
          return json({ error: 'TTS generation failed', status: ttsResp.status }, 502);
        }

        return new Response(ttsResp.body, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      }

      return json({ error: 'Unknown SPI endpoint', available: ['/health', '/query', '/think', '/audit', '/hypotheses', '/experiments', '/audits', '/memory', '/cycles', '/echo/status', '/stats', '/kill', '/revive', '/voice/config', '/voice/session', '/voice/history', '/voice/tts'] }, 404);

    } catch (err: any) {
      log('error', 'handler', `Request failed: ${err.message}`, { path, stack: err.stack });
      return json({ error: 'SPI internal error', detail: err.message }, 500);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Check kill switch
    const killed = await env.CACHE.get('KILL_SWITCH');
    if (killed) {
      log('info', 'cron', 'Kill switch active — skipping autonomous operations');
      return;
    }

    const hour = new Date(event.scheduledTime).getUTCHours();

    // Clean expired experiments on every cron
    ctx.waitUntil(cleanExpiredExperiments(env));

    if (hour === 8) {
      // Morning audit (8 UTC = 2am CST — overnight analysis)
      log('info', 'cron', 'Running morning audit cycle');
      ctx.waitUntil(runAudit(env));
    } else if (hour === 20) {
      // Evening reasoning (20 UTC = 2pm CST)
      log('info', 'cron', 'Running evening reasoning cycle');
      ctx.waitUntil(runReasoningCycle(env));
    } else {
      // Every 6 hours — lighter reasoning cycle
      log('info', 'cron', 'Running periodic reasoning cycle');
      ctx.waitUntil(runReasoningCycle(env));
    }
  },
};
