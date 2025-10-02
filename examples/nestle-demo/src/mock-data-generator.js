import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// UK Store Database with realistic profiles
const STORE_PROFILES = [
  {
    storeId: 'UK12345',
    name: 'Tesco Extra Manchester Arndale',
    retailer: 'Tesco',
    format: 'Extra',
    city: 'Manchester',
    region: 'North West',
    postcode: 'M4 3AQ',
    size: 'Large',
    footfall: 'High',
    demographics: 'Urban, Mixed Age, ABC1',
    storeManager: 'David Thompson',
    managerPreferences: 'Data-driven, responsive to category performance',
    categorySpace: { adultNutrition: 24, immunity: 12, vitamins: 18 }
  },
  {
    storeId: 'UK12346',
    name: 'Boots Liverpool One',
    retailer: 'Boots',
    format: 'Flagship',
    city: 'Liverpool',
    region: 'North West',
    postcode: 'L1 8JQ',
    size: 'Large',
    footfall: 'Very High',
    demographics: 'Urban, Young Professionals, ABC1',
    storeManager: 'Sarah Mitchell',
    managerPreferences: 'Innovation-focused, promotional activity',
    categorySpace: { adultNutrition: 18, immunity: 15, vitamins: 20 }
  },
  {
    storeId: 'UK12347',
    name: 'Superdrug Manchester Market Street',
    retailer: 'Superdrug',
    format: 'Standard',
    city: 'Manchester',
    region: 'North West',
    postcode: 'M1 1WA',
    size: 'Medium',
    footfall: 'High',
    demographics: 'Urban, Young Adults, C1C2',
    storeManager: 'James Parker',
    managerPreferences: 'Price-conscious, value promotions',
    categorySpace: { adultNutrition: 12, immunity: 8, vitamins: 15 }
  },
  {
    storeId: 'UK12348',
    name: 'Tesco Extra Birmingham Fort',
    retailer: 'Tesco',
    format: 'Extra',
    city: 'Birmingham',
    region: 'West Midlands',
    postcode: 'B24 9FP',
    size: 'Large',
    footfall: 'High',
    demographics: 'Suburban, Families, ABC1C2',
    storeManager: 'Priya Sharma',
    managerPreferences: 'Family-focused, seasonal campaigns',
    categorySpace: { adultNutrition: 20, immunity: 10, vitamins: 16 }
  },
  {
    storeId: 'UK12349',
    name: 'Boots Leeds Trinity',
    retailer: 'Boots',
    format: 'Standard',
    city: 'Leeds',
    region: 'Yorkshire',
    postcode: 'LS1 6HW',
    size: 'Medium',
    footfall: 'High',
    demographics: 'Urban, Mixed Age, ABC1',
    storeManager: 'Emma Richardson',
    managerPreferences: 'Health-focused, educational materials',
    categorySpace: { adultNutrition: 16, immunity: 12, vitamins: 18 }
  }
];

// Product Catalog
const PRODUCTS = [
  { sku: 'NHS-001', name: 'Boost Plus Vanilla 200ml', category: 'Adult Nutrition', price: 2.49, margin: 0.32 },
  { sku: 'NHS-002', name: 'Boost Plus Chocolate 200ml', category: 'Adult Nutrition', price: 2.49, margin: 0.32 },
  { sku: 'NHS-003', name: 'Boost Glucose Control', category: 'Adult Nutrition', price: 2.99, margin: 0.35 },
  { sku: 'NHS-004', name: 'Resource Protein Drink', category: 'Adult Nutrition', price: 2.79, margin: 0.33 },
  { sku: 'NHS-101', name: 'Immunity+ Daily Support', category: 'Immunity', price: 12.99, margin: 0.42 },
  { sku: 'NHS-102', name: 'Immunity+ Kids Gummies', category: 'Immunity', price: 9.99, margin: 0.40 },
  { sku: 'NHS-103', name: 'Immunity+ Elderberry Syrup', category: 'Immunity', price: 14.99, margin: 0.45 },
  { sku: 'NHS-201', name: 'Vitality Multi-Vitamin', category: 'Vitamins', price: 8.99, margin: 0.38 },
  { sku: 'NHS-202', name: 'Vitamin D3 1000IU', category: 'Vitamins', price: 6.99, margin: 0.36 },
  { sku: 'NHS-203', name: 'Omega-3 Fish Oil', category: 'Vitamins', price: 11.99, margin: 0.40 }
];

// Campaign Library
const CAMPAIGNS = [
  {
    id: 'Q4_2025_Immunity',
    name: 'Q4 2025 Immunity Push',
    products: ['NHS-101', 'NHS-102', 'NHS-103'],
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    mechanics: '3 for 2 on Immunity range',
    materials: ['POS display', 'Shelf wobblers', 'Educational leaflets']
  },
  {
    id: 'Winter_Wellness',
    name: 'Winter Wellness 2025',
    products: ['NHS-101', 'NHS-201', 'NHS-202'],
    startDate: '2025-11-01',
    endDate: '2026-02-28',
    mechanics: '£5 off when you spend £20+',
    materials: ['Window cling', 'Checkout dividers', 'Recipe cards']
  }
];

// Generate Exceedra Visit History
function generateExceedraVisits(storeId, count = 3) {
  const visits = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = 21 * (i + 1); // Every 3 weeks
    const visitDate = new Date(today);
    visitDate.setDate(visitDate.getDate() - daysAgo);

    visits.push({
      visitId: `VIS-${storeId}-${String(i + 1).padStart(3, '0')}`,
      storeId,
      visitDate: visitDate.toISOString().split('T')[0],
      kamEmail: 'sarah.williams@nestle.com',
      kamName: 'Sarah Williams',
      duration: 45 + Math.floor(Math.random() * 30),
      objectives: [
        i === 0 ? 'Check winter display execution' : null,
        i === 1 ? 'Introduce Q4 Immunity campaign' : null,
        i === 2 ? 'Review category performance' : null,
        'Resolve OOS issues',
        'Optimize shelf positioning'
      ].filter(Boolean),
      actionsCompleted: [
        {
          action: i === 0 ? 'Secured agreement for 2x additional facings on Immunity+ range' :
                  i === 1 ? 'Set up Q4 Immunity POS display in health aisle' :
                  'Repositioned Adult Nutrition to eye-level shelf',
          outcome: i === 0 ? 'Manager committed to implementation by next visit' :
                   i === 1 ? 'Display live, manager positive on initial customer interest' :
                   'Improved visibility, manager noted positive customer feedback',
          followUp: i === 0 ? 'Verify display execution and track sales impact' : null
        }
      ],
      issuesIdentified: i === 1 ? [
        { issue: 'Boost Plus Vanilla OOS for 3 days', severity: 'High', resolution: 'Ordered emergency stock' }
      ] : [],
      storeCondition: { cleanliness: 'Good', stockLevels: i === 1 ? 'Fair' : 'Good', merchandising: 'Excellent' },
      managerFeedback: i === 0 ? 'Very receptive to data-driven suggestions' :
                       i === 1 ? 'Concerned about stock availability, pleased with campaign materials' :
                       'Happy with category performance, wants to expand immunity range',
      nextSteps: [
        i === 0 ? 'Follow up on winter display execution' : null,
        'Monitor OOS situations',
        'Review sales impact of recent changes'
      ].filter(Boolean)
    });
  }

  return visits.reverse(); // Most recent first
}

// Generate SAP Sales Data
function generateSAPSalesData(storeId, days = 90) {
  const salesData = {
    storeId,
    reportDate: new Date().toISOString().split('T')[0],
    period: `${days} days`,
    categorySales: [],
    skuPerformance: [],
    territoryComparison: {}
  };

  // Category-level sales
  const categories = ['Adult Nutrition', 'Immunity', 'Vitamins'];
  categories.forEach((category, idx) => {
    const baseRevenue = 15000 + Math.random() * 10000;
    const growth = idx === 1 ? 0.12 : (idx === 0 ? 0.08 : 0.03); // Immunity growing fastest

    salesData.categorySales.push({
      category,
      revenue: Math.round(baseRevenue),
      units: Math.round(baseRevenue / 8.5),
      growth: growth,
      vsTerritory: idx === 1 ? 0.05 : (idx === 0 ? 0.02 : -0.01),
      share: category === 'Adult Nutrition' ? 0.42 : (category === 'Immunity' ? 0.35 : 0.23)
    });
  });

  // SKU-level performance
  PRODUCTS.forEach((product, idx) => {
    const baseUnits = 300 + Math.random() * 200;
    const isTopPerformer = idx % 3 === 0;

    salesData.skuPerformance.push({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitsSold: Math.round(baseUnits),
      revenue: Math.round(baseUnits * product.price),
      growth: isTopPerformer ? 0.15 : (Math.random() * 0.1 - 0.02),
      oosIncidents: idx === 0 ? 2 : (Math.random() > 0.8 ? 1 : 0),
      avgPrice: product.price,
      priceVsTerritory: Math.random() * 0.1 - 0.05
    });
  });

  return salesData;
}

// Generate Power BI Dashboard Data
function generatePowerBIDashboard(storeId) {
  const months = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const month = new Date(today);
    month.setMonth(month.getMonth() - i);

    const baseRevenue = 20000 + Math.random() * 5000;
    const seasonalFactor = [0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.1, 1.05, 1.0, 1.1, 1.2, 1.3][month.getMonth()];

    months.push({
      month: month.toISOString().slice(0, 7),
      totalRevenue: Math.round(baseRevenue * seasonalFactor),
      totalUnits: Math.round(baseRevenue * seasonalFactor / 9.2),
      adultNutritionRevenue: Math.round(baseRevenue * seasonalFactor * 0.42),
      immunityRevenue: Math.round(baseRevenue * seasonalFactor * 0.35),
      vitaminsRevenue: Math.round(baseRevenue * seasonalFactor * 0.23),
      footfall: 12000 + Math.round(Math.random() * 3000),
      conversionRate: 0.18 + Math.random() * 0.05
    });
  }

  return {
    storeId,
    period: '12 months',
    trend: months,
    kpis: {
      avgMonthlyRevenue: Math.round(months.reduce((sum, m) => sum + m.totalRevenue, 0) / 12),
      yoyGrowth: 0.08,
      categoryMix: { adultNutrition: 0.42, immunity: 0.35, vitamins: 0.23 }
    }
  };
}

// Generate Similar Store Success Cases
function generateSimilarStoreSuccesses(targetStoreId) {
  const store = STORE_PROFILES.find(s => s.storeId === targetStoreId);
  if (!store) return [];

  const similarStores = STORE_PROFILES.filter(s =>
    s.storeId !== targetStoreId &&
    (s.region === store.region || s.retailer === store.retailer)
  ).slice(0, 3);

  return similarStores.map((s, idx) => ({
    storeId: s.storeId,
    storeName: s.name,
    similarity: 0.85 + Math.random() * 0.1,
    matchFactors: ['Region', 'Store Format', 'Demographics'].slice(0, 2 + idx),
    successAction: [
      'Implemented Immunity+ end-cap display with educational materials',
      'Ran 3-for-2 promotion on Adult Nutrition range',
      'Repositioned vitamins to seasonal display area'
    ][idx],
    period: '4 weeks',
    results: {
      categoryLift: [0.11, 0.09, 0.15][idx],
      unitIncrease: [245, 189, 312][idx],
      revenueIncrease: Math.round([2150, 1680, 2890][idx])
    },
    replicability: ['High', 'Medium', 'High'][idx],
    notes: [
      'Store manager credits clear POS and staff training',
      'Price sensitivity observed, consider value messaging',
      'Seasonal timing (winter) was key factor'
    ][idx]
  }));
}

// Generate Competitor Intelligence
function generateCompetitorIntel(storeRetailer, region) {
  const competitors = ['Tesco', 'Boots', 'Superdrug', 'Asda', 'Morrisons'].filter(r => r !== storeRetailer);

  return competitors.slice(0, 2).map((retailer, idx) => ({
    retailer,
    weekCommencing: new Date().toISOString().split('T')[0],
    promotions: [
      {
        category: 'Adult Nutrition',
        offer: idx === 0 ? 'Buy 2 Get 1 Free on competing brand' : '20% off own-label nutrition drinks',
        duration: '2 weeks',
        threat: 'Medium',
        suggestedResponse: idx === 0 ? 'Highlight superior taste and NHS recommendation in POS' : 'Emphasize premium quality and clinical backing'
      },
      {
        category: 'Immunity',
        offer: idx === 0 ? '£3 off Vitamin C 1000mg tablets' : 'Elderberry syrup on rollback',
        duration: '1 week',
        threat: 'Low',
        suggestedResponse: 'Cross-promote with winter wellness messaging'
      }
    ],
    newProducts: idx === 0 ? ['Generic immunity gummies launched'] : [],
    outOfStock: idx === 1 ? ['Competitor premium nutrition drink range'] : []
  }));
}

// Main generation function
async function generateAllMockData() {
  console.log('Generating comprehensive mock data for Nestlé KAM Demo...\n');

  const outputDir = path.join(__dirname, '..', 'mock-data');
  await fs.mkdir(outputDir, { recursive: true });

  // Store profiles
  await fs.writeFile(
    path.join(outputDir, 'stores.json'),
    JSON.stringify(STORE_PROFILES, null, 2)
  );
  console.log('✓ Generated store profiles');

  // Product catalog
  await fs.writeFile(
    path.join(outputDir, 'products.json'),
    JSON.stringify(PRODUCTS, null, 2)
  );
  console.log('✓ Generated product catalog');

  // Campaigns
  await fs.writeFile(
    path.join(outputDir, 'campaigns.json'),
    JSON.stringify(CAMPAIGNS, null, 2)
  );
  console.log('✓ Generated campaign library');

  // Generate data for each store
  for (const store of STORE_PROFILES) {
    const storeData = {
      profile: store,
      exceedraVisits: generateExceedraVisits(store.storeId, 3),
      sapSales: generateSAPSalesData(store.storeId, 90),
      powerBIDashboard: generatePowerBIDashboard(store.storeId),
      similarStoreSuccesses: generateSimilarStoreSuccesses(store.storeId),
      competitorIntel: generateCompetitorIntel(store.retailer, store.region)
    };

    await fs.writeFile(
      path.join(outputDir, `store-${store.storeId}.json`),
      JSON.stringify(storeData, null, 2)
    );
    console.log(`✓ Generated comprehensive data for ${store.name} (${store.storeId})`);
  }

  console.log('\n✅ All mock data generated successfully!');
  console.log(`📁 Location: ${outputDir}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllMockData().catch(console.error);
}

export {
  STORE_PROFILES,
  PRODUCTS,
  CAMPAIGNS,
  generateExceedraVisits,
  generateSAPSalesData,
  generatePowerBIDashboard,
  generateSimilarStoreSuccesses,
  generateCompetitorIntel
};