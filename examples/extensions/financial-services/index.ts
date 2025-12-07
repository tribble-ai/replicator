/**
 * Financial Services Extension Example
 *
 * Demonstrates proper use of SDK extension patterns for wealth management
 * and financial advisory operations.
 *
 * Features:
 * - Portfolio analysis and performance
 * - Risk assessment and scoring
 * - Transaction monitoring for compliance
 * - Market research and insights
 *
 * This extension shows:
 * - ToolBuilder with complex nested Zod schemas
 * - Using ctx.brain.search() for investment research
 * - Using ctx.integrations.get() for market data APIs
 * - Proper error handling and compliance logging
 * - ExtensionBundle for packaging
 * - createHandler for deployment
 */

import {
  ToolBuilder,
  IntegrationBuilder,
  CartridgeBuilder,
  ExtensionBundle,
  createHandler,
  z,
} from '@tribble/extensions';

// ==================== Tools ====================

/**
 * Analyze portfolio performance and allocation.
 * Uses brain knowledge for benchmark comparisons and investment policies.
 */
const analyzePortfolio = new ToolBuilder('finserv_analyze_portfolio')
  .description(
    'Analyze investment portfolio performance, allocation, and risk metrics. Returns detailed breakdown by asset class.'
  )
  .parameters({
    portfolioId: z.string().describe('Portfolio identifier'),
    period: z
      .enum(['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'ALL'])
      .optional()
      .default('YTD')
      .describe('Analysis period'),
    benchmarks: z
      .array(z.string())
      .optional()
      .default(['SPY', 'AGG'])
      .describe('Benchmark symbols for comparison'),
    includeRisk: z.boolean().optional().default(true).describe('Include risk metrics'),
  })
  .category('query')
  .timeout(45_000)
  .requiresIntegration('market_data')
  .handler(async (args, ctx) => {
    ctx.logger.info('Analyzing portfolio', { portfolioId: args.portfolioId });

    // Search brain for investment policy and guidelines
    const policyDocs = await ctx.brain.search(
      'investment policy statement asset allocation guidelines',
      { limit: 5 }
    );

    // Search for benchmark information
    const benchmarkDocs = await ctx.brain.search(
      `benchmark comparison ${args.benchmarks.join(' ')} performance`,
      { limit: 3 }
    );

    // Get market data credentials
    const creds = await ctx.integrations.get<{
      apiKey: string;
      baseUrl: string;
    }>('market_data');

    // Fetch portfolio data (simulated)
    const portfolio = await fetchPortfolioData(creds, args.portfolioId, args.period);

    // Calculate metrics
    const analysis = calculatePortfolioMetrics(portfolio, args.includeRisk);

    return {
      content: formatPortfolioAnalysis(analysis, args.period),
      citations: [...policyDocs, ...benchmarkDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Investment Research',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        portfolioId: args.portfolioId,
        totalValue: analysis.totalValue,
        returnPct: analysis.totalReturn,
        riskScore: analysis.riskScore,
        allocation: analysis.allocation,
      },
    };
  })
  .build();

/**
 * Assess risk profile and generate risk score.
 * Combines portfolio data with client risk tolerance from brain.
 */
const assessRisk = new ToolBuilder('finserv_assess_risk')
  .description(
    'Assess investment risk for a client or portfolio. Returns risk score, factors, and recommendations.'
  )
  .parameters({
    clientId: z.string().describe('Client identifier'),
    portfolioId: z.string().optional().describe('Specific portfolio to assess'),
    riskFactors: z
      .array(z.enum(['market', 'credit', 'liquidity', 'concentration', 'currency']))
      .optional()
      .default(['market', 'credit', 'concentration'])
      .describe('Risk factors to analyze'),
  })
  .category('compute')
  .timeout(30_000)
  .handler(async (args, ctx) => {
    ctx.logger.info('Assessing risk', { clientId: args.clientId });

    // Search brain for client risk profile
    const clientDocs = await ctx.brain.search(
      `client ${args.clientId} risk tolerance investment profile`,
      { limit: 5 }
    );

    // Search for risk assessment methodology
    const methodologyDocs = await ctx.brain.search(
      'risk assessment methodology scoring framework',
      { limit: 3 }
    );

    // Calculate risk assessment
    const assessment = calculateRiskAssessment(args.clientId, args.riskFactors);

    return {
      content: formatRiskAssessment(assessment),
      citations: [...clientDocs, ...methodologyDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Risk Methodology',
        snippet: doc.content.slice(0, 150),
      })),
      data: assessment,
    };
  })
  .build();

/**
 * Monitor transactions for compliance and suspicious activity.
 * Uses brain knowledge for compliance rules and AML patterns.
 */
const monitorTransactions = new ToolBuilder('finserv_monitor_transactions')
  .description(
    'Monitor transactions for compliance violations and suspicious activity. Returns flagged transactions with risk levels.'
  )
  .parameters({
    accountId: z.string().describe('Account identifier'),
    dateRange: z
      .object({
        start: z.string().describe('Start date (YYYY-MM-DD)'),
        end: z.string().describe('End date (YYYY-MM-DD)'),
      })
      .optional()
      .describe('Date range to analyze'),
    checkTypes: z
      .array(
        z.enum([
          'aml', // Anti-money laundering
          'sanctions', // OFAC/sanctions screening
          'velocity', // Unusual velocity
          'structuring', // Cash structuring
          'watchlist', // Internal watchlist
        ])
      )
      .optional()
      .default(['aml', 'velocity'])
      .describe('Types of compliance checks'),
  })
  .category('query')
  .timeout(60_000)
  .handler(async (args, ctx) => {
    // Compliance operations should be logged
    ctx.logger.info('Transaction monitoring started', {
      accountId: args.accountId,
      checkTypes: args.checkTypes,
    });

    // Search brain for compliance rules
    const complianceDocs = await ctx.brain.search(
      `compliance rules ${args.checkTypes.join(' ')} transaction monitoring`,
      { limit: 5 }
    );

    // Search for AML patterns
    const amlDocs = await ctx.brain.search('aml suspicious activity patterns indicators', {
      limit: 3,
    });

    // Monitor transactions (simulated)
    const results = monitorAccountTransactions(args.accountId, args.checkTypes);

    ctx.logger.info('Transaction monitoring complete', {
      accountId: args.accountId,
      flaggedCount: results.flaggedTransactions.length,
    });

    return {
      content: formatMonitoringResults(results),
      citations: [...complianceDocs, ...amlDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Compliance Documentation',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        accountId: args.accountId,
        totalTransactions: results.totalTransactions,
        flaggedCount: results.flaggedTransactions.length,
        riskLevel: results.overallRisk,
      },
      // Don't recurse - compliance results shouldn't trigger more tool calls
      stopRecursion: results.flaggedTransactions.length > 0,
    };
  })
  .build();

/**
 * Get market research and investment insights.
 * Combines market data API with brain knowledge.
 */
const getMarketInsights = new ToolBuilder('finserv_market_insights')
  .description(
    'Get market research and investment insights for securities or sectors. Returns analysis and recommendations.'
  )
  .parameters({
    symbols: z
      .array(z.string())
      .min(1)
      .max(10)
      .describe('Stock/ETF symbols to research'),
    includeNews: z.boolean().optional().default(true).describe('Include recent news'),
    includeTechnicals: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include technical indicators'),
  })
  .category('search')
  .timeout(30_000)
  .requiresIntegration('market_data')
  .handler(async (args, ctx) => {
    ctx.logger.info('Getting market insights', { symbols: args.symbols });

    // Search brain for analyst research
    const researchDocs = await ctx.brain.search(
      `equity research analysis ${args.symbols.join(' ')}`,
      { limit: 10 }
    );

    // Search for sector information
    const sectorDocs = await ctx.brain.search(
      `sector outlook industry trends ${args.symbols[0]}`,
      { limit: 3 }
    );

    // Get market data credentials
    const creds = await ctx.integrations.get<{
      apiKey: string;
      baseUrl: string;
    }>('market_data');

    // Fetch market data (simulated)
    const marketData = await fetchMarketData(creds, args.symbols);

    return {
      content: formatMarketInsights(marketData, args.includeNews, args.includeTechnicals),
      citations: [...researchDocs, ...sectorDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Research Report',
        snippet: doc.content.slice(0, 200),
      })),
      data: {
        symbols: args.symbols,
        quotes: marketData.quotes,
        lastUpdated: new Date().toISOString(),
      },
    };
  })
  .build();

// ==================== Integration ====================

const marketDataIntegration = new IntegrationBuilder('market_data')
  .displayName('Market Data API')
  .description('Real-time and historical market data provider')
  .apiKey({ headerName: 'X-Market-Data-Key' })
  .healthCheck({ endpoint: '/v1/health', expectedStatus: [200] })
  .build();

// ==================== Cartridge ====================

const wealthAdvisor = new CartridgeBuilder('wealth-advisor')
  .displayName('Wealth Advisory Assistant')
  .description('AI assistant for wealth management and financial advisory')
  .model('gpt-4o')
  .tools([
    'finserv_analyze_portfolio',
    'finserv_assess_risk',
    'finserv_monitor_transactions',
    'finserv_market_insights',
  ])
  .category('analytics')
  .systemPrompt(`You are a wealth management advisory assistant helping financial advisors serve their clients.

You can help with:
- Portfolio performance analysis and allocation review
- Risk assessment and scoring
- Transaction monitoring for compliance
- Market research and investment insights

IMPORTANT GUIDELINES:
- Always reference relevant investment policy statements and guidelines
- Present risk information clearly with appropriate context
- Flag compliance concerns immediately
- Do not provide specific investment recommendations without context
- Explain the rationale behind analysis and metrics
- Use professional financial terminology appropriately

When discussing performance:
- Compare against relevant benchmarks
- Consider time periods appropriately
- Account for risk-adjusted returns`)
  .build();

// ==================== Extension Bundle ====================

const extension = new ExtensionBundle({
  name: 'financial-services-tools',
  version: '1.0.0',
  platformVersion: '>=2.0.0',
  description: 'Wealth management and financial advisory tools',
  author: 'Tribble SDK Examples',
  keywords: ['finance', 'wealth', 'portfolio', 'compliance', 'investment'],
})
  .handler({
    type: 'http',
    url: process.env.HANDLER_URL || 'http://localhost:3002/extension',
  })
  .tool(analyzePortfolio)
  .tool(assessRisk)
  .tool(monitorTransactions)
  .tool(getMarketInsights)
  .integration(marketDataIntegration)
  .cartridge(wealthAdvisor)
  .build();

// Export for platform registration
export default extension;

// Export HTTP handler for deployment
export const handler = createHandler(extension);

// ==================== Helper Functions ====================

interface Portfolio {
  id: string;
  totalValue: number;
  holdings: Array<{
    symbol: string;
    name: string;
    value: number;
    allocation: number;
    returnPct: number;
  }>;
  assetAllocation: Record<string, number>;
}

async function fetchPortfolioData(
  _creds: { apiKey: string; baseUrl: string },
  portfolioId: string,
  _period: string
): Promise<Portfolio> {
  // In production, this would call actual portfolio API
  return {
    id: portfolioId,
    totalValue: 1250000,
    holdings: [
      { symbol: 'VTI', name: 'Vanguard Total Stock', value: 500000, allocation: 40, returnPct: 12.5 },
      { symbol: 'BND', name: 'Vanguard Total Bond', value: 312500, allocation: 25, returnPct: 3.2 },
      { symbol: 'VEA', name: 'Vanguard Developed Markets', value: 187500, allocation: 15, returnPct: 8.7 },
      { symbol: 'VWO', name: 'Vanguard Emerging Markets', value: 125000, allocation: 10, returnPct: -2.1 },
      { symbol: 'VNQ', name: 'Vanguard Real Estate', value: 125000, allocation: 10, returnPct: 5.4 },
    ],
    assetAllocation: {
      'US Equity': 40,
      'Fixed Income': 25,
      'International Developed': 15,
      'Emerging Markets': 10,
      'Real Estate': 10,
    },
  };
}

interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  riskScore: number;
  sharpeRatio: number;
  volatility: number;
  allocation: Record<string, number>;
  topPerformers: string[];
  bottomPerformers: string[];
}

function calculatePortfolioMetrics(portfolio: Portfolio, includeRisk: boolean): PortfolioMetrics {
  const weightedReturn = portfolio.holdings.reduce(
    (sum, h) => sum + (h.returnPct * h.allocation) / 100,
    0
  );

  return {
    totalValue: portfolio.totalValue,
    totalReturn: weightedReturn,
    riskScore: includeRisk ? 6.2 : 0,
    sharpeRatio: includeRisk ? 1.45 : 0,
    volatility: includeRisk ? 12.3 : 0,
    allocation: portfolio.assetAllocation,
    topPerformers: portfolio.holdings
      .sort((a, b) => b.returnPct - a.returnPct)
      .slice(0, 2)
      .map((h) => h.symbol),
    bottomPerformers: portfolio.holdings
      .sort((a, b) => a.returnPct - b.returnPct)
      .slice(0, 2)
      .map((h) => h.symbol),
  };
}

function formatPortfolioAnalysis(metrics: PortfolioMetrics, period: string): string {
  return `**Portfolio Analysis (${period})**

**Summary**
- Total Value: $${metrics.totalValue.toLocaleString()}
- Total Return: ${metrics.totalReturn.toFixed(2)}%
- Risk Score: ${metrics.riskScore}/10

**Risk Metrics**
- Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
- Volatility: ${metrics.volatility.toFixed(1)}%

**Asset Allocation**
${Object.entries(metrics.allocation)
  .map(([asset, pct]) => `- ${asset}: ${pct}%`)
  .join('\n')}

**Performance**
- Top Performers: ${metrics.topPerformers.join(', ')}
- Underperformers: ${metrics.bottomPerformers.join(', ')}`;
}

interface RiskAssessment {
  clientId: string;
  overallScore: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  factors: Record<string, { score: number; description: string }>;
  recommendations: string[];
}

function calculateRiskAssessment(
  clientId: string,
  riskFactors: string[]
): RiskAssessment {
  const factors: Record<string, { score: number; description: string }> = {};

  for (const factor of riskFactors) {
    switch (factor) {
      case 'market':
        factors.market = { score: 6, description: 'Moderate market risk exposure' };
        break;
      case 'credit':
        factors.credit = { score: 3, description: 'Low credit risk - investment grade bonds' };
        break;
      case 'concentration':
        factors.concentration = { score: 5, description: 'Acceptable diversification' };
        break;
      case 'liquidity':
        factors.liquidity = { score: 2, description: 'High liquidity - mostly ETFs' };
        break;
      case 'currency':
        factors.currency = { score: 4, description: 'Moderate FX exposure from international' };
        break;
    }
  }

  const avgScore = Object.values(factors).reduce((s, f) => s + f.score, 0) / Object.keys(factors).length;

  return {
    clientId,
    overallScore: avgScore,
    riskTolerance: avgScore < 4 ? 'conservative' : avgScore < 7 ? 'moderate' : 'aggressive',
    factors,
    recommendations: [
      'Consider rebalancing to target allocation quarterly',
      'Review international exposure given current FX trends',
      'Maintain emergency cash buffer outside portfolio',
    ],
  };
}

function formatRiskAssessment(assessment: RiskAssessment): string {
  return `**Risk Assessment for Client ${assessment.clientId}**

**Overall Risk Profile**
- Score: ${assessment.overallScore.toFixed(1)}/10
- Tolerance: ${assessment.riskTolerance.toUpperCase()}

**Risk Factor Analysis**
${Object.entries(assessment.factors)
  .map(([factor, { score, description }]) => `- **${factor}** (${score}/10): ${description}`)
  .join('\n')}

**Recommendations**
${assessment.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
}

interface MonitoringResults {
  accountId: string;
  totalTransactions: number;
  flaggedTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    riskLevel: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  overallRisk: 'high' | 'medium' | 'low';
}

function monitorAccountTransactions(
  accountId: string,
  _checkTypes: string[]
): MonitoringResults {
  // In production, this would analyze actual transactions
  return {
    accountId,
    totalTransactions: 156,
    flaggedTransactions: [
      {
        id: 'TXN-001',
        type: 'wire',
        amount: 49500,
        riskLevel: 'medium',
        reason: 'Amount just below reporting threshold',
      },
      {
        id: 'TXN-002',
        type: 'wire',
        amount: 49800,
        riskLevel: 'medium',
        reason: 'Similar amount pattern - potential structuring',
      },
    ],
    overallRisk: 'medium',
  };
}

function formatMonitoringResults(results: MonitoringResults): string {
  const riskEmoji = results.overallRisk === 'high' ? '🔴' : results.overallRisk === 'medium' ? '🟡' : '🟢';

  return `**Transaction Monitoring Report**

Account: ${results.accountId}
Period Transactions: ${results.totalTransactions}
Overall Risk Level: ${riskEmoji} ${results.overallRisk.toUpperCase()}

**Flagged Transactions: ${results.flaggedTransactions.length}**
${
  results.flaggedTransactions.length > 0
    ? results.flaggedTransactions
        .map(
          (t) =>
            `- **${t.id}** (${t.type}): $${t.amount.toLocaleString()} [${t.riskLevel.toUpperCase()}]\n  Reason: ${t.reason}`
        )
        .join('\n')
    : 'No transactions flagged.'
}

${results.flaggedTransactions.length > 0 ? '⚠️ Please review flagged transactions for potential compliance action.' : '✅ No compliance concerns identified.'}`;
}

interface MarketData {
  quotes: Array<{
    symbol: string;
    price: number;
    change: number;
    changePct: number;
    volume: number;
  }>;
  news: Array<{ headline: string; source: string; date: string }>;
}

async function fetchMarketData(
  _creds: { apiKey: string; baseUrl: string },
  symbols: string[]
): Promise<MarketData> {
  // In production, this would call actual market data API
  return {
    quotes: symbols.map((symbol) => ({
      symbol,
      price: 100 + Math.random() * 400,
      change: Math.random() * 10 - 5,
      changePct: Math.random() * 5 - 2.5,
      volume: Math.floor(Math.random() * 10000000),
    })),
    news: [
      { headline: 'Markets rally on economic data', source: 'Reuters', date: '2024-01-15' },
      { headline: 'Fed signals potential rate decision', source: 'WSJ', date: '2024-01-14' },
    ],
  };
}

function formatMarketInsights(
  data: MarketData,
  includeNews: boolean,
  includeTechnicals: boolean
): string {
  let content = `**Market Insights**

**Quotes**
| Symbol | Price | Change | Volume |
|--------|-------|--------|--------|
${data.quotes
  .map(
    (q) =>
      `| ${q.symbol} | $${q.price.toFixed(2)} | ${q.change >= 0 ? '+' : ''}${q.changePct.toFixed(2)}% | ${(q.volume / 1000000).toFixed(1)}M |`
  )
  .join('\n')}`;

  if (includeNews && data.news.length > 0) {
    content += `

**Recent News**
${data.news.map((n) => `- ${n.headline} (${n.source}, ${n.date})`).join('\n')}`;
  }

  if (includeTechnicals) {
    content += `

**Technical Indicators**
- RSI: 52 (Neutral)
- MACD: Bullish crossover
- 50-day MA: Above`;
  }

  return content;
}
