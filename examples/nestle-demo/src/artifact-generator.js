import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Artifact Generator - Creates formatted outputs (Markdown, JSON, PDF-ready)
 */
export class ArtifactGenerator {
  constructor(outputDir = './output') {
    this.outputDir = outputDir;
  }

  /**
   * Generate comprehensive Markdown brief
   */
  async generateMarkdownBrief(jobId, briefData, storeProfile) {
    const lines = [];
    const h = (text, level = 2) => `${'#'.repeat(level)} ${text}`;

    // Header
    lines.push(h('Nestlé Health Science - Pre-Call Intelligence Brief', 1));
    lines.push('');
    lines.push(`**Store:** ${storeProfile.name} (${storeProfile.storeId})`);
    lines.push(`**Retailer:** ${storeProfile.retailer} - ${storeProfile.format}`);
    lines.push(`**Location:** ${storeProfile.city}, ${storeProfile.region} (${storeProfile.postcode})`);
    lines.push(`**Manager:** ${storeProfile.storeManager}`);
    lines.push(`**Generated:** ${new Date().toLocaleString('en-GB')}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Executive Summary
    if (briefData.executiveSummary) {
      lines.push(h('Executive Summary'));
      lines.push(briefData.executiveSummary);
      lines.push('');
    }

    // Visit History Summary
    if (briefData.visitHistory) {
      lines.push(h('Recent Visit History'));
      lines.push(`**Last Visit:** ${briefData.visitHistory.lastVisitDate}`);
      lines.push(`**Recent Focus Areas:** ${briefData.visitHistory.recentThemes.join(', ')}`);
      lines.push('');

      if (briefData.visitHistory.keyActions.length > 0) {
        lines.push('**Key Actions from Recent Visits:**');
        briefData.visitHistory.keyActions.forEach(action => {
          lines.push(`- **${action.date}:** ${action.action}`);
          if (action.outcome) {
            lines.push(`  - *Outcome:* ${action.outcome}`);
          }
        });
        lines.push('');
      }

      if (briefData.visitHistory.pendingFollowUps.length > 0) {
        lines.push('**⚠️ Pending Follow-Ups:**');
        briefData.visitHistory.pendingFollowUps.forEach(fu => {
          lines.push(`- ${fu}`);
        });
        lines.push('');
      }
    }

    // Performance Analysis
    if (briefData.performance) {
      lines.push(h('Store Performance Analysis'));
      lines.push(`**Overall Assessment:** ${briefData.performance.overall}`);
      lines.push('');

      if (briefData.performance.strengths.length > 0) {
        lines.push('**✅ Strengths:**');
        briefData.performance.strengths.forEach(s => lines.push(`- ${s}`));
        lines.push('');
      }

      if (briefData.performance.opportunities.length > 0) {
        lines.push('**🎯 Opportunities:**');
        briefData.performance.opportunities.forEach(o => lines.push(`- ${o}`));
        lines.push('');
      }

      if (briefData.performance.concerns.length > 0) {
        lines.push('**⚠️ Areas of Concern:**');
        briefData.performance.concerns.forEach(c => lines.push(`- ${c}`));
        lines.push('');
      }
    }

    // Sales Insights
    if (briefData.salesInsights) {
      lines.push(h('Sales Insights (Last 90 Days)'));
      lines.push('');
      lines.push('| Category | Revenue | Growth | vs Territory |');
      lines.push('|----------|---------|--------|--------------|');
      briefData.salesInsights.categorySales.forEach(cat => {
        const growth = `${cat.growth > 0 ? '+' : ''}${Math.round(cat.growth * 100)}%`;
        const vsTerr = `${cat.vsTerritory > 0 ? '+' : ''}${Math.round(cat.vsTerritory * 100)}%`;
        lines.push(`| ${cat.category} | £${cat.revenue.toLocaleString()} | ${growth} | ${vsTerr} |`);
      });
      lines.push('');

      if (briefData.salesInsights.topPerformers) {
        lines.push('**Top Performing SKUs:**');
        briefData.salesInsights.topPerformers.forEach(sku => {
          lines.push(`- ${sku.name}: ${sku.unitsSold} units, +${Math.round(sku.growth * 100)}% growth`);
        });
        lines.push('');
      }
    }

    // Risk Alerts
    if (briefData.riskAlerts && briefData.riskAlerts.length > 0) {
      lines.push(h('🚨 Risk Alerts'));
      briefData.riskAlerts.forEach(alert => {
        const icon = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
        lines.push(`${icon} **${alert.title}** (${alert.severity.toUpperCase()})`);
        lines.push(`- ${alert.description}`);
        lines.push(`- *Impact:* ${alert.impact}`);
        lines.push(`- *Action:* ${alert.action}`);
        lines.push('');
      });
    }

    // Next Best Actions
    if (briefData.nextBestActions && briefData.nextBestActions.length > 0) {
      lines.push(h('🎯 Recommended Next Best Actions'));
      briefData.nextBestActions.forEach((action, idx) => {
        const priorityIcon = action.priority === 'critical' ? '🔴' :
                            action.priority === 'high' ? '🟠' :
                            action.priority === 'medium' ? '🟡' : '🟢';

        lines.push(h(`${priorityIcon} Priority ${idx + 1}: ${action.action}`, 3));
        lines.push(`**Priority Level:** ${action.priority.toUpperCase()}`);
        lines.push(`**Rationale:** ${action.rationale}`);
        lines.push(`**Expected Impact:** ${action.expectedImpact}`);

        if (action.evidence && action.evidence.length > 0) {
          lines.push('**Supporting Evidence:**');
          action.evidence.forEach(ev => lines.push(`- ${ev}`));
        }

        if (action.implementation) {
          lines.push('**Implementation:**');
          lines.push(`- Timeline: ${action.implementation.timeline}`);
          lines.push(`- Resources: ${action.implementation.resources.join(', ')}`);
          if (action.implementation.dependencies.length > 0) {
            lines.push(`- Dependencies: ${action.implementation.dependencies.join(', ')}`);
          }
        }

        if (action.replicability) {
          lines.push(`**Replicability:** ${action.replicability}`);
        }

        lines.push('');
      });
    }

    // Similar Store Success Cases
    if (briefData.similarStoreSuccesses && briefData.similarStoreSuccesses.length > 0) {
      lines.push(h('📊 Success Cases from Similar Stores'));
      briefData.similarStoreSuccesses.forEach(success => {
        lines.push(h(`${success.storeName} (${Math.round(success.similarity * 100)}% match)`, 3));
        lines.push(`**What They Did:** ${success.successAction}`);
        lines.push(`**Results (${success.period}):**`);
        lines.push(`- Category Lift: +${Math.round(success.results.categoryLift * 100)}%`);
        lines.push(`- Additional Units: ${success.results.unitIncrease}`);
        lines.push(`- Revenue Increase: £${success.results.revenueIncrease.toLocaleString()}`);
        lines.push(`**Match Factors:** ${success.matchFactors.join(', ')}`);
        if (success.notes) {
          lines.push(`**Notes:** ${success.notes}`);
        }
        lines.push('');
      });
    }

    // Talking Points
    if (briefData.talkingPoints && briefData.talkingPoints.length > 0) {
      lines.push(h('💬 Talking Points'));
      lines.push(`*Tailored for ${storeProfile.storeManager} (${storeProfile.managerPreferences})*`);
      lines.push('');
      briefData.talkingPoints.forEach((tp, idx) => {
        lines.push(`${idx + 1}. ${tp.point}`);
        lines.push(`   - *Type:* ${tp.type} | *Context:* ${tp.context}`);
        lines.push('');
      });
    }

    // Competitor Activity
    if (briefData.competitorIntel && briefData.competitorIntel.length > 0) {
      lines.push(h('🔍 Competitive Intelligence'));
      briefData.competitorIntel.forEach(comp => {
        lines.push(h(comp.retailer, 3));
        comp.promotions.forEach(promo => {
          const threatIcon = promo.threat === 'High' ? '🔴' : promo.threat === 'Medium' ? '🟡' : '🟢';
          lines.push(`${threatIcon} **${promo.category}:** ${promo.offer} (${promo.duration})`);
          lines.push(`- *Suggested Response:* ${promo.suggestedResponse}`);
          lines.push('');
        });
      });
    }

    // Pre-Visit Checklist
    lines.push(h('✅ Pre-Visit Checklist'));
    lines.push('- [ ] Review this brief (5 min)');
    lines.push('- [ ] Load POS materials and samples into vehicle');
    lines.push('- [ ] Verify stock levels with distribution center');
    lines.push('- [ ] Prepare iPad with sales data dashboard');
    lines.push('- [ ] Review store manager preferences');
    lines.push('- [ ] Check for any pending commitments from last visit');
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('*Generated by Tribble Sales Intelligence Platform*');
    lines.push(`*Job ID: ${jobId}*`);

    const markdown = lines.join('\n');

    await fs.mkdir(this.outputDir, { recursive: true });
    const filename = `brief-${jobId}-${storeProfile.storeId}.md`;
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, markdown, 'utf-8');

    return { filepath, filename, content: markdown };
  }

  /**
   * Generate mobile-optimized one-page summary
   */
  async generateOnePagerMarkdown(jobId, briefData, storeProfile) {
    const lines = [];

    lines.push(`# ${storeProfile.name}`);
    lines.push(`**${storeProfile.retailer}** | ${storeProfile.city} | ${storeProfile.storeManager}`);
    lines.push('');

    // Top 3 Actions
    lines.push('## 🎯 Top 3 Actions');
    (briefData.nextBestActions || []).slice(0, 3).forEach((action, idx) => {
      lines.push(`${idx + 1}. **${action.action}**`);
      lines.push(`   ${action.expectedImpact}`);
    });
    lines.push('');

    // Key Stats
    if (briefData.salesInsights) {
      lines.push('## 📊 Key Stats');
      briefData.salesInsights.categorySales.slice(0, 2).forEach(cat => {
        lines.push(`- ${cat.category}: £${cat.revenue.toLocaleString()} (+${Math.round(cat.growth * 100)}%)`);
      });
      lines.push('');
    }

    // Alerts
    const criticalAlerts = (briefData.riskAlerts || []).filter(a => a.severity === 'high' || a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      lines.push('## 🚨 Alerts');
      criticalAlerts.forEach(alert => {
        lines.push(`- **${alert.title}:** ${alert.description}`);
      });
      lines.push('');
    }

    // Quick Talking Points
    if (briefData.talkingPoints && briefData.talkingPoints.length > 0) {
      lines.push('## 💬 Opening');
      lines.push(briefData.talkingPoints[0].point);
      lines.push('');
    }

    const markdown = lines.join('\n');
    const filename = `onepager-${jobId}-${storeProfile.storeId}.md`;
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, markdown, 'utf-8');

    return { filepath, filename, content: markdown };
  }

  /**
   * Generate structured JSON output
   */
  async generateJSONOutput(jobId, briefData, storeProfile) {
    const output = {
      meta: {
        jobId,
        storeId: storeProfile.storeId,
        storeName: storeProfile.name,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      },
      store: storeProfile,
      brief: briefData
    };

    await fs.mkdir(this.outputDir, { recursive: true });
    const filename = `brief-${jobId}-${storeProfile.storeId}.json`;
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf-8');

    return { filepath, filename, content: output };
  }
}