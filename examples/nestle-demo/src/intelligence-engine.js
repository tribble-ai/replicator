/**
 * Intelligence Engine - Analyzes data and generates insights
 */
export class IntelligenceEngine {
  constructor(dataService) {
    this.dataService = dataService;
  }

  /**
   * Generate next best actions based on store data and similar store successes
   */
  async generateNextBestActions(storeId, context = {}) {
    const [profile, visits, sales, similarSuccesses, competitors] = await Promise.all([
      this.dataService.getStoreProfile(storeId),
      this.dataService.getExceedraVisits(storeId, 3),
      this.dataService.getSAPSalesData(storeId),
      this.dataService.getSimilarStoreSuccesses(storeId),
      this.dataService.getCompetitorIntel(storeId)
    ]);

    const actions = [];

    // Action 1: Similar store success replication
    if (similarSuccesses.length > 0) {
      const topSuccess = similarSuccesses.sort((a, b) => b.results.categoryLift - a.results.categoryLift)[0];
      actions.push({
        action: topSuccess.successAction,
        priority: 'high',
        rationale: `Store profile matches ${topSuccess.storeName} (${Math.round(topSuccess.similarity * 100)}% similarity). They achieved ${Math.round(topSuccess.results.categoryLift * 100)}% category lift with this action.`,
        expectedImpact: `+${Math.round(topSuccess.results.categoryLift * 100)}-${Math.round(topSuccess.results.categoryLift * 120)}% category lift`,
        evidence: [
          `${topSuccess.storeName} Case Study`,
          `${topSuccess.results.unitIncrease} additional units sold`,
          `£${topSuccess.results.revenueIncrease.toLocaleString()} revenue increase`
        ],
        replicability: topSuccess.replicability,
        implementation: {
          timeline: '1-2 weeks',
          resources: ['POS materials', 'Staff training', 'Stock allocation'],
          dependencies: ['Store manager approval', 'Inventory availability']
        }
      });
    }

    // Action 2: OOS resolution (critical)
    const oosProducts = sales?.skuPerformance?.filter(sku => sku.oosIncidents > 0) || [];
    if (oosProducts.length > 0) {
      const topOOS = oosProducts.sort((a, b) => b.revenue - a.revenue)[0];
      const lostRevenue = Math.round(topOOS.revenue * 0.15); // Estimate 15% revenue loss per OOS incident

      actions.push({
        action: `Resolve out-of-stock issue for ${topOOS.name}`,
        priority: 'critical',
        rationale: `Product has had ${topOOS.oosIncidents} OOS incidents in past 90 days. This is a top revenue SKU (£${topOOS.revenue.toLocaleString()}).`,
        expectedImpact: `Prevent £${lostRevenue.toLocaleString()}/week revenue loss`,
        evidence: [
          `${topOOS.oosIncidents} OOS incidents recorded`,
          `£${topOOS.revenue.toLocaleString()} revenue at risk`,
          'Historical data shows 15% sales loss per OOS day'
        ],
        implementation: {
          timeline: 'Immediate',
          resources: ['Emergency stock order', 'Inventory audit'],
          dependencies: ['Distribution center availability']
        }
      });
    }

    // Action 3: Category growth opportunity
    const growthCategory = sales?.categorySales?.find(cat => cat.growth > 0.05 && cat.vsTerritory > 0) || null;
    if (growthCategory) {
      actions.push({
        action: `Expand ${growthCategory.category} range with additional SKUs and promotional display`,
        priority: 'high',
        rationale: `${growthCategory.category} growing at ${Math.round(growthCategory.growth * 100)}% vs territory average of ${Math.round((growthCategory.growth - growthCategory.vsTerritory) * 100)}%. Store is outperforming territory by ${Math.round(growthCategory.vsTerritory * 100)}%.`,
        expectedImpact: `+${Math.round(growthCategory.growth * 1.5 * 100)}% incremental growth`,
        evidence: [
          `Current growth rate: ${Math.round(growthCategory.growth * 100)}%`,
          `Store performance vs territory: +${Math.round(growthCategory.vsTerritory * 100)}%`,
          `Category revenue: £${growthCategory.revenue.toLocaleString()}`
        ],
        implementation: {
          timeline: '2-3 weeks',
          resources: ['Additional shelf space', 'Range extension', 'POS materials'],
          dependencies: ['Space reallocation', 'Product availability']
        }
      });
    }

    // Action 4: Competitive response
    if (competitors.length > 0) {
      const majorThreat = competitors.flatMap(c => c.promotions).find(p => p.threat === 'Medium' || p.threat === 'High');
      if (majorThreat) {
        actions.push({
          action: majorThreat.suggestedResponse,
          priority: 'medium',
          rationale: `Competitor running "${majorThreat.offer}" for ${majorThreat.duration}. Threat level: ${majorThreat.threat}.`,
          expectedImpact: 'Maintain category share during competitive pressure',
          evidence: [
            `Competitor promotion: ${majorThreat.offer}`,
            `Duration: ${majorThreat.duration}`,
            `Threat assessment: ${majorThreat.threat}`
          ],
          implementation: {
            timeline: '1 week',
            resources: ['Updated POS messaging', 'Staff briefing'],
            dependencies: ['Marketing approval']
          }
        });
    }
    }

    // Action 5: Follow-up from last visit
    if (visits.length > 0) {
      const lastVisit = visits[0];
      const pendingFollowUps = lastVisit.actionsCompleted
        .filter(ac => ac.followUp)
        .map(ac => ac.followUp);

      if (pendingFollowUps.length > 0) {
        actions.push({
          action: pendingFollowUps[0],
          priority: 'high',
          rationale: `Follow-up action from last visit (${lastVisit.visitDate}). Store manager is expecting update.`,
          expectedImpact: 'Maintain trust and demonstrate follow-through',
          evidence: [
            `Last visit action: ${lastVisit.actionsCompleted[0].action}`,
            `Manager feedback: ${lastVisit.managerFeedback}`
          ],
          implementation: {
            timeline: 'This visit',
            resources: ['Visit audit', 'Sales data review'],
            dependencies: ['None']
          }
        });
      }
    }

    return actions;
  }

  /**
   * Analyze store performance vs territory
   */
  async analyzePerformance(storeId) {
    const [sales, dashboard] = await Promise.all([
      this.dataService.getSAPSalesData(storeId),
      this.dataService.getPowerBIDashboard(storeId)
    ]);

    const analysis = {
      overall: 'Good',
      strengths: [],
      concerns: [],
      opportunities: []
    };

    // Analyze categories
    sales.categorySales.forEach(cat => {
      if (cat.vsTerritory > 0.03) {
        analysis.strengths.push(`${cat.category} outperforming territory by ${Math.round(cat.vsTerritory * 100)}%`);
      } else if (cat.vsTerritory < -0.03) {
        analysis.concerns.push(`${cat.category} underperforming territory by ${Math.round(Math.abs(cat.vsTerritory) * 100)}%`);
      }

      if (cat.growth > 0.08) {
        analysis.opportunities.push(`${cat.category} showing strong growth momentum (${Math.round(cat.growth * 100)}%)`);
      }
    });

    // Analyze trends
    if (dashboard?.kpis?.yoyGrowth > 0.05) {
      analysis.strengths.push(`Strong year-over-year growth: ${Math.round(dashboard.kpis.yoyGrowth * 100)}%`);
    }

    analysis.overall = analysis.concerns.length === 0 ? 'Excellent' :
                       analysis.concerns.length === 1 ? 'Good' : 'Needs Attention';

    return analysis;
  }

  /**
   * Generate visit history summary
   */
  async summarizeVisitHistory(storeId, count = 3) {
    const visits = await this.dataService.getExceedraVisits(storeId, count);

    if (visits.length === 0) {
      return 'No recent visit history available.';
    }

    const lastVisit = visits[0];
    const themes = [];

    // Extract themes from recent visits
    const allActions = visits.flatMap(v => v.actionsCompleted.map(ac => ac.action));
    if (allActions.some(a => a.toLowerCase().includes('display'))) {
      themes.push('merchandising optimization');
    }
    if (allActions.some(a => a.toLowerCase().includes('oos') || a.toLowerCase().includes('stock'))) {
      themes.push('inventory management');
    }
    if (allActions.some(a => a.toLowerCase().includes('promo') || a.toLowerCase().includes('campaign'))) {
      themes.push('promotional execution');
    }

    const summary = {
      visitCount: visits.length,
      lastVisitDate: lastVisit.visitDate,
      recentThemes: themes,
      keyActions: visits.flatMap(v => v.actionsCompleted.map(ac => ({
        date: v.visitDate,
        action: ac.action,
        outcome: ac.outcome
      }))).slice(0, 3),
      pendingFollowUps: visits.flatMap(v =>
        v.actionsCompleted.filter(ac => ac.followUp).map(ac => ac.followUp)
      ),
      managerRelationship: lastVisit.managerFeedback,
      storeCondition: lastVisit.storeCondition
    };

    return summary;
  }

  /**
   * Generate talking points tailored to store manager
   */
  async generateTalkingPoints(storeId) {
    const [profile, sales, visits, performance] = await Promise.all([
      this.dataService.getStoreProfile(storeId),
      this.dataService.getSAPSalesData(storeId),
      this.dataService.getExceedraVisits(storeId, 1),
      this.analyzePerformance(storeId)
    ]);

    const talkingPoints = [];

    // Tailor to manager preferences
    if (profile.managerPreferences.toLowerCase().includes('data')) {
      const topCategory = sales.categorySales.sort((a, b) => b.growth - a.growth)[0];
      talkingPoints.push({
        point: `"Your ${topCategory.category} category is growing ${Math.round(topCategory.growth * 100)}% vs ${Math.round((topCategory.growth - topCategory.vsTerritory) * 100)}% territory average"`,
        type: 'data-driven',
        context: 'Opening statement to engage data-focused manager'
      });
    }

    // Acknowledge strengths
    if (performance.strengths.length > 0) {
      talkingPoints.push({
        point: `"I wanted to recognize ${performance.strengths[0].toLowerCase()}"`,
        type: 'recognition',
        context: 'Build rapport by acknowledging success'
      });
    }

    // Bridge to opportunity
    if (performance.opportunities.length > 0) {
      talkingPoints.push({
        point: `"Building on that momentum, I see an opportunity to..."`,
        type: 'opportunity',
        context: 'Transition to recommendation'
      });
    }

    // Reference last visit (relationship building)
    if (visits.length > 0) {
      const lastVisit = visits[0];
      talkingPoints.push({
        point: `"Last time we discussed ${lastVisit.actionsCompleted[0].action.toLowerCase()}, and I can see..."`,
        type: 'continuity',
        context: 'Demonstrate follow-through and attention'
      });
    }

    // Manager-specific approach
    if (profile.managerPreferences.toLowerCase().includes('promotional')) {
      talkingPoints.push({
        point: `"We have a new campaign launching that fits perfectly with your promotional calendar"`,
        type: 'campaign',
        context: 'Align with manager\'s promotional focus'
      });
    }

    return talkingPoints;
  }

  /**
   * Generate risk alerts
   */
  async generateRiskAlerts(storeId) {
    const [sales, visits, competitors] = await Promise.all([
      this.dataService.getSAPSalesData(storeId),
      this.dataService.getExceedraVisits(storeId, 3),
      this.dataService.getCompetitorIntel(storeId)
    ]);

    const alerts = [];

    // OOS risks
    const oosProducts = sales.skuPerformance.filter(sku => sku.oosIncidents > 0);
    oosProducts.forEach(sku => {
      alerts.push({
        type: 'oos',
        severity: sku.oosIncidents > 1 ? 'high' : 'medium',
        title: `${sku.name} - Out of Stock Risk`,
        description: `${sku.oosIncidents} OOS incidents in past 90 days`,
        impact: `£${Math.round(sku.revenue * 0.15).toLocaleString()}/week revenue at risk`,
        action: 'Verify current stock levels and place emergency order if needed'
      });
    });

    // Pricing alerts
    const pricingIssues = sales.skuPerformance.filter(sku => Math.abs(sku.priceVsTerritory) > 0.08);
    pricingIssues.forEach(sku => {
      alerts.push({
        type: 'pricing',
        severity: 'medium',
        title: `${sku.name} - Pricing Variance`,
        description: `${Math.round(sku.priceVsTerritory * 100)}% ${sku.priceVsTerritory > 0 ? 'above' : 'below'} territory average`,
        impact: sku.priceVsTerritory > 0 ? 'Potential competitive disadvantage' : 'Margin erosion risk',
        action: 'Review pricing strategy with store manager'
      });
    });

    // Competitive threats
    const majorThreats = competitors.flatMap(c =>
      c.promotions.filter(p => p.threat === 'High' || p.threat === 'Medium')
    );
    majorThreats.forEach(threat => {
      alerts.push({
        type: 'competitive',
        severity: threat.threat.toLowerCase(),
        title: `Competitor Activity - ${threat.category}`,
        description: threat.offer,
        impact: `${threat.threat} threat to category share`,
        action: threat.suggestedResponse
      });
    });

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
}