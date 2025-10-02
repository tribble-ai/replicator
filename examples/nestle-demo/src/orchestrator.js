import crypto from 'node:crypto';
import { actions } from '@tribble/sdk';

/**
 * Orchestrator - Coordinates multi-phase intelligence gathering and brief generation
 */
export class PrepOrchestrator {
  constructor({ tribble, dataService, intelligenceEngine, artifactGenerator }) {
    this.tribble = tribble;
    this.dataService = dataService;
    this.intelligence = intelligenceEngine;
    this.artifacts = artifactGenerator;
  }

  /**
   * Execute full pre-call prep orchestration
   */
  async execute(job, options = {}) {
    const { generateArtifacts = true, traceId } = options;

    try {
      // Phase 1: Data Collection
      await this._phaseDataCollection(job, traceId);

      // Phase 2: Intelligence Analysis
      await this._phaseIntelligenceAnalysis(job);

      // Phase 3: AI Brief Generation
      await this._phaseAIBriefGeneration(job, traceId);

      // Phase 4: Artifact Generation
      if (generateArtifacts) {
        await this._phaseArtifactGeneration(job);
      }

      job.status = 'completed';
      this._addLog(job, 'Orchestration completed successfully');

    } catch (error) {
      job.status = 'failed';
      job.errors.push(error.message);
      this._addLog(job, `Orchestration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phase 1: Multi-source data collection
   */
  async _phaseDataCollection(job, traceId) {
    job.status = 'collecting';
    this._addLog(job, 'Phase 1: Collecting data from multiple sources');
    this._broadcast(job, { type: 'phase', data: 'collecting' });

    const { storeId, dataSources = {} } = job;

    // Collect all data in parallel
    const [profile, visits, sales, dashboard, similarSuccesses, competitors, products, campaigns] = await Promise.all([
      this.dataService.getStoreProfile(storeId),
      this.dataService.getExceedraVisits(storeId, dataSources.exceedra?.visitHistoryCount || 3),
      this.dataService.getSAPSalesData(storeId, dataSources.sap?.period || '90 days'),
      this.dataService.getPowerBIDashboard(storeId, dataSources.powerbi?.period || '12 months'),
      this.dataService.getSimilarStoreSuccesses(storeId),
      this.dataService.getCompetitorIntel(storeId),
      this.dataService.getProducts(),
      this.dataService.getCampaigns()
    ]);

    if (!profile) {
      throw new Error(`Store profile not found for ${storeId}`);
    }

    job.collectedData = {
      profile,
      visits,
      sales,
      dashboard,
      similarSuccesses,
      competitors,
      products,
      campaigns
    };

    job.progress.collection = 100;
    this._addLog(job, `✓ Data collected: ${visits.length} visits, ${sales?.skuPerformance?.length || 0} SKUs, ${similarSuccesses.length} similar stores`);
  }

  /**
   * Phase 2: Intelligence analysis
   */
  async _phaseIntelligenceAnalysis(job) {
    job.status = 'analyzing';
    this._addLog(job, 'Phase 2: Analyzing data and generating insights');
    this._broadcast(job, { type: 'phase', data: 'analyzing' });

    const { storeId } = job;

    // Run intelligence analyses in parallel
    const [nextBestActions, performance, visitSummary, talkingPoints, riskAlerts] = await Promise.all([
      this.intelligence.generateNextBestActions(storeId),
      this.intelligence.analyzePerformance(storeId),
      this.intelligence.summarizeVisitHistory(storeId, 3),
      this.intelligence.generateTalkingPoints(storeId),
      this.intelligence.generateRiskAlerts(storeId)
    ]);

    job.intelligence = {
      nextBestActions,
      performance,
      visitSummary,
      talkingPoints,
      riskAlerts
    };

    job.progress.analysis = 100;
    this._addLog(job, `✓ Analysis complete: ${nextBestActions.length} actions, ${riskAlerts.length} alerts, ${talkingPoints.length} talking points`);
  }

  /**
   * Phase 3: AI-powered brief generation with Tribble
   */
  async _phaseAIBriefGeneration(job, traceId) {
    job.status = 'generating';
    this._addLog(job, 'Phase 3: Generating AI-powered brief with Tribble');
    this._broadcast(job, { type: 'phase', data: 'generating' });

    const { storeId, kamEmail, visitType = 'routine' } = job;
    const { profile, visits, sales, similarSuccesses, competitors } = job.collectedData;
    const { nextBestActions, performance, visitSummary, talkingPoints, riskAlerts } = job.intelligence;

    // Compose rich context for Tribble agent
    const prompt = this._composePrompt({
      profile,
      visits,
      sales,
      similarSuccesses,
      competitors,
      nextBestActions,
      performance,
      visitSummary,
      talkingPoints,
      riskAlerts,
      visitType
    });

    // Stream from Tribble agent
    let answer = '';
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), Number(process.env.PREP_TIMEOUT_MS || 300000));

    try {
      this._addLog(job, 'Streaming from Tribble agent...');
      this._broadcast(job, { type: 'status', data: 'streaming' });

      for await (const tok of this.tribble.agent.stream({
        conversationId: job.conversationId,
        message: prompt,
        signal: ac.signal
      })) {
        if (tok?.delta) {
          answer += tok.delta;
          job.progress.generation = Math.min(99, Math.floor(answer.length / 3000 * 100));
          this._broadcast(job, { type: 'delta', data: tok.delta });
        }
      }

      this._broadcast(job, { type: 'done' });
      job.progress.generation = 100;

      // Parse AI response
      const parsed = this.tribble.agent.parseJSON(answer);
      job.aiBrief = parsed;

      this._addLog(job, '✓ AI brief generated successfully');

    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Phase 4: Generate artifacts (Markdown, JSON, One-pager)
   */
  async _phaseArtifactGeneration(job) {
    job.status = 'finalizing';
    this._addLog(job, 'Phase 4: Generating artifacts');
    this._broadcast(job, { type: 'phase', data: 'finalizing' });

    const { profile } = job.collectedData;
    const { nextBestActions, performance, visitSummary, talkingPoints, riskAlerts } = job.intelligence;
    const { similarSuccesses, competitors } = job.collectedData;

    // Compile complete brief data
    const briefData = {
      executiveSummary: job.aiBrief?.executiveSummary || this._generateExecutiveSummary(job),
      visitHistory: visitSummary,
      performance,
      salesInsights: this._formatSalesInsights(job.collectedData.sales),
      nextBestActions,
      riskAlerts,
      similarStoreSuccesses: similarSuccesses,
      talkingPoints,
      competitorIntel: competitors,
      campaigns: job.collectedData.campaigns,
      aiBriefRaw: job.aiBrief
    };

    // Generate all artifacts in parallel
    const [markdown, onepager, json] = await Promise.all([
      this.artifacts.generateMarkdownBrief(job.id, briefData, profile),
      this.artifacts.generateOnePagerMarkdown(job.id, briefData, profile),
      this.artifacts.generateJSONOutput(job.id, briefData, profile)
    ]);

    job.artifacts = {
      markdown,
      onepager,
      json
    };

    job.progress.artifacts = 100;
    this._addLog(job, `✓ Artifacts generated: ${markdown.filename}, ${onepager.filename}, ${json.filename}`);
  }

  /**
   * Compose comprehensive prompt for Tribble agent
   */
  _composePrompt(context) {
    const {
      profile,
      visits,
      sales,
      similarSuccesses,
      competitors,
      nextBestActions,
      performance,
      visitSummary,
      talkingPoints,
      riskAlerts,
      visitType
    } = context;

    // Use Tribble SDK actions DSL for structured composition
    return actions.compose([
      // Core instruction
      actions.generate.brief({
        scope: 'nestle-kam-precall-prep',
        visitType,
        store: {
          id: profile.storeId,
          name: profile.name,
          retailer: profile.retailer,
          manager: profile.storeManager,
          managerPrefs: profile.managerPreferences
        },
        context: {
          lastVisit: visits[0]?.visitDate,
          visitCount: visits.length,
          performanceRating: performance.overall
        },
        instructions: `
You are an AI assistant for Nestlé Health Science Key Account Managers (KAMs). Generate a comprehensive pre-call intelligence brief for an upcoming store visit.

STORE CONTEXT:
- Store: ${profile.name} (${profile.storeId})
- Retailer: ${profile.retailer} - ${profile.format}
- Manager: ${profile.storeManager}
- Manager Preferences: ${profile.managerPreferences}
- Visit Type: ${visitType}

RECENT VISIT HISTORY:
${JSON.stringify(visitSummary, null, 2)}

SALES PERFORMANCE (90 days):
${JSON.stringify(sales, null, 2)}

PERFORMANCE ANALYSIS:
${JSON.stringify(performance, null, 2)}

NEXT BEST ACTIONS (AI-recommended):
${JSON.stringify(nextBestActions, null, 2)}

SIMILAR STORE SUCCESS CASES:
${JSON.stringify(similarSuccesses, null, 2)}

RISK ALERTS:
${JSON.stringify(riskAlerts, null, 2)}

TALKING POINTS:
${JSON.stringify(talkingPoints, null, 2)}

COMPETITOR INTELLIGENCE:
${JSON.stringify(competitors, null, 2)}

TASK:
Generate an executive summary (2-3 paragraphs) that:
1. Synthesizes the store's current situation and performance
2. Highlights the most critical insight or opportunity
3. Frames the recommended approach for this visit
4. References specific data points to build credibility

Return JSON with this structure:
{
  "executiveSummary": "...",
  "keyInsight": "...",
  "visitApproach": "...",
  "anticipatedObjections": ["..."],
  "successMetrics": ["..."]
}
`,
        outputs: {
          format: 'JSON',
          maxTokens: 1500
        }
      })
    ]);
  }

  /**
   * Generate fallback executive summary if AI fails
   */
  _generateExecutiveSummary(job) {
    const { profile } = job.collectedData;
    const { performance, nextBestActions, riskAlerts } = job.intelligence;

    const topAction = nextBestActions[0];
    const criticalAlerts = riskAlerts.filter(a => a.severity === 'high' || a.severity === 'critical');

    return `${profile.name} is currently rated as ${performance.overall} performance. ` +
           `${performance.strengths.length > 0 ? performance.strengths[0] + '. ' : ''}` +
           `${criticalAlerts.length > 0 ? `Critical attention needed: ${criticalAlerts[0].title}. ` : ''}` +
           `Top recommended action: ${topAction.action} - ${topAction.expectedImpact}.`;
  }

  /**
   * Format sales insights for brief
   */
  _formatSalesInsights(sales) {
    if (!sales) return null;

    const topPerformers = sales.skuPerformance
      .filter(sku => sku.growth > 0.05)
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 3);

    return {
      categorySales: sales.categorySales,
      topPerformers,
      territoryComparison: sales.territoryComparison
    };
  }

  /**
   * Broadcast SSE message to subscribers
   */
  _broadcast(job, payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const subscriber of job.subscribers) {
      try {
        subscriber.write(data);
      } catch (err) {
        // Subscriber disconnected, will be cleaned up
      }
    }
  }

  /**
   * Add timestamped log entry
   */
  _addLog(job, message) {
    const timestamp = new Date().toISOString();
    job.logs.push(`[${timestamp}] ${message}`);
  }
}