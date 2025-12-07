/**
 * Logistics Extension Example
 *
 * Demonstrates proper use of SDK extension patterns for supply chain operations.
 *
 * Features:
 * - Track shipments across carriers
 * - Optimize delivery routes
 * - Search warehouse inventory
 * - Get real-time freight quotes
 *
 * This extension shows:
 * - ToolBuilder with Zod type-safe parameters
 * - Using ctx.brain.search() for knowledge retrieval
 * - Using ctx.integrations.get() for API credentials
 * - Proper error handling and logging
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
  ToolContext,
  ToolResult,
} from '@tribble/extensions';

// ==================== Tools ====================

/**
 * Track a shipment across multiple carriers.
 * Uses the brain to lookup carrier-specific tracking information
 * and the shipping integration for real-time status.
 */
const trackShipment = new ToolBuilder('logistics_track_shipment')
  .description(
    'Track a shipment by tracking number. Returns current status, location, and estimated delivery.'
  )
  .parameters({
    trackingNumber: z.string().describe('Shipment tracking number'),
    carrier: z
      .enum(['fedex', 'ups', 'usps', 'dhl', 'auto'])
      .optional()
      .default('auto')
      .describe('Carrier name or "auto" to detect'),
  })
  .category('query')
  .timeout(30_000)
  .requiresIntegration('shipping_api')
  .handler(async (args, ctx) => {
    ctx.logger.info('Tracking shipment', { trackingNumber: args.trackingNumber });

    // Search brain for carrier-specific tracking rules
    const carrierDocs = await ctx.brain.search(
      `carrier tracking ${args.carrier !== 'auto' ? args.carrier : 'all carriers'}`,
      { limit: 3 }
    );

    // Get shipping API credentials
    const creds = await ctx.integrations.get<{
      apiKey: string;
      baseUrl: string;
    }>('shipping_api');

    // Make tracking request (simulated for example)
    const trackingResult = await fetchTrackingStatus(
      creds,
      args.trackingNumber,
      args.carrier
    );

    return {
      content: formatTrackingResult(trackingResult),
      citations: carrierDocs.map((doc) => ({
        title: doc.metadata?.documentLabel || 'Carrier Documentation',
        snippet: doc.content.slice(0, 200),
      })),
      data: {
        status: trackingResult.status,
        location: trackingResult.currentLocation,
        eta: trackingResult.estimatedDelivery,
      },
    };
  })
  .build();

/**
 * Search warehouse inventory across locations.
 * Leverages brain knowledge about SKU mappings and warehouse locations.
 */
const searchInventory = new ToolBuilder('logistics_search_inventory')
  .description(
    'Search warehouse inventory by SKU, product name, or location. Returns stock levels and locations.'
  )
  .parameters({
    query: z.string().describe('Search query (SKU, product name, or description)'),
    warehouse: z
      .string()
      .optional()
      .describe('Specific warehouse code to search, or omit for all'),
    minQuantity: z
      .number()
      .optional()
      .default(0)
      .describe('Minimum quantity filter'),
  })
  .category('search')
  .timeout(20_000)
  .handler(async (args, ctx) => {
    ctx.logger.info('Searching inventory', { query: args.query });

    // Search brain for product/SKU information
    const productDocs = await ctx.brain.search(
      `product SKU inventory ${args.query}`,
      { limit: 10 }
    );

    // Search brain for warehouse information if specified
    let warehouseDocs: Awaited<ReturnType<typeof ctx.brain.search>> = [];
    if (args.warehouse) {
      warehouseDocs = await ctx.brain.search(
        `warehouse location ${args.warehouse}`,
        { limit: 3 }
      );
    }

    // Aggregate results from brain
    const inventoryResults = productDocs
      .filter((doc) => {
        // Filter by warehouse if specified
        if (args.warehouse && doc.metadata?.documentLabel) {
          return doc.metadata.documentLabel
            .toLowerCase()
            .includes(args.warehouse.toLowerCase());
        }
        return true;
      })
      .map((doc) => ({
        content: doc.content,
        usageCount: doc.usageCount,
        source: doc.metadata?.documentLabel || 'Unknown',
      }));

    return {
      content: formatInventoryResults(inventoryResults, args.query),
      citations: [...productDocs, ...warehouseDocs].slice(0, 5).map((doc) => ({
        title: doc.metadata?.documentLabel || 'Inventory Data',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        totalResults: inventoryResults.length,
        query: args.query,
        warehouse: args.warehouse,
      },
    };
  })
  .build();

/**
 * Get freight quotes for a shipment.
 * Uses carrier rate cards from brain and live API for quotes.
 */
const getFreightQuotes = new ToolBuilder('logistics_get_freight_quotes')
  .description(
    'Get freight shipping quotes from multiple carriers for a package or pallet.'
  )
  .parameters({
    originZip: z.string().describe('Origin ZIP/postal code'),
    destZip: z.string().describe('Destination ZIP/postal code'),
    weight: z.number().describe('Total weight in pounds'),
    dimensions: z
      .object({
        length: z.number().describe('Length in inches'),
        width: z.number().describe('Width in inches'),
        height: z.number().describe('Height in inches'),
      })
      .optional()
      .describe('Package dimensions'),
    shipmentType: z
      .enum(['parcel', 'ltl', 'ftl'])
      .optional()
      .default('parcel')
      .describe('Type of shipment'),
  })
  .category('query')
  .timeout(45_000)
  .requiresIntegration('shipping_api')
  .handler(async (args, ctx) => {
    ctx.logger.info('Getting freight quotes', {
      origin: args.originZip,
      dest: args.destZip,
    });

    // Get rate card documentation from brain
    const rateCardDocs = await ctx.brain.search(
      `freight rate card ${args.shipmentType} shipping`,
      { limit: 5 }
    );

    // Get credentials
    const creds = await ctx.integrations.get<{
      apiKey: string;
      baseUrl: string;
    }>('shipping_api');

    // Get quotes from carriers (simulated)
    const quotes = await fetchFreightQuotes(creds, args);

    return {
      content: formatQuotesResult(quotes, args.shipmentType),
      citations: rateCardDocs.map((doc) => ({
        title: doc.metadata?.documentLabel || 'Rate Card',
        snippet: doc.content.slice(0, 150),
      })),
      data: {
        quotes,
        cheapest: quotes.sort((a, b) => a.price - b.price)[0],
        fastest: quotes.sort((a, b) => a.transitDays - b.transitDays)[0],
      },
    };
  })
  .build();

/**
 * Optimize delivery route for multiple stops.
 */
const optimizeRoute = new ToolBuilder('logistics_optimize_route')
  .description(
    'Optimize delivery route for multiple stops. Returns optimal order and estimated time.'
  )
  .parameters({
    stops: z
      .array(
        z.object({
          address: z.string().describe('Stop address'),
          priority: z
            .enum(['high', 'medium', 'low'])
            .optional()
            .default('medium')
            .describe('Delivery priority'),
          timeWindow: z
            .object({
              start: z.string().describe('Window start (HH:MM)'),
              end: z.string().describe('Window end (HH:MM)'),
            })
            .optional()
            .describe('Delivery time window'),
        })
      )
      .min(2)
      .max(50)
      .describe('List of delivery stops'),
    startAddress: z.string().describe('Starting location address'),
    returnToStart: z.boolean().optional().default(true).describe('Return to start?'),
  })
  .category('compute')
  .timeout(60_000)
  .handler(async (args, ctx) => {
    ctx.logger.info('Optimizing route', { stopCount: args.stops.length });

    // Get routing documentation from brain
    const routingDocs = await ctx.brain.search('delivery route optimization algorithm', {
      limit: 3,
    });

    // Simulate route optimization
    const optimizedRoute = optimizeDeliveryRoute(args);

    return {
      content: formatRouteResult(optimizedRoute),
      citations: routingDocs.map((doc) => ({
        title: doc.metadata?.documentLabel || 'Routing Guide',
        snippet: doc.content.slice(0, 150),
      })),
      data: optimizedRoute,
    };
  })
  .build();

// ==================== Integration ====================

const shippingApiIntegration = new IntegrationBuilder('shipping_api')
  .displayName('Shipping API')
  .description('Multi-carrier shipping API for tracking and quotes')
  .apiKey({ headerName: 'X-Shipping-API-Key' })
  .healthCheck({ endpoint: '/health', expectedStatus: [200] })
  .build();

// ==================== Cartridge ====================

const logisticsAssistant = new CartridgeBuilder('logistics-assistant')
  .displayName('Logistics Assistant')
  .description('AI assistant for supply chain and logistics operations')
  .model('gpt-4o')
  .tools([
    'logistics_track_shipment',
    'logistics_search_inventory',
    'logistics_get_freight_quotes',
    'logistics_optimize_route',
  ])
  .category('operations')
  .systemPrompt(`You are a logistics operations assistant helping with supply chain management.

You can help with:
- Tracking shipments across carriers (FedEx, UPS, USPS, DHL)
- Searching warehouse inventory
- Getting freight quotes
- Optimizing delivery routes

Always be specific about tracking numbers, locations, and timelines.
When providing quotes, explain the tradeoffs between cost and speed.
For route optimization, consider delivery windows and priorities.`)
  .build();

// ==================== Extension Bundle ====================

const extension = new ExtensionBundle({
  name: 'logistics-tools',
  version: '1.0.0',
  platformVersion: '>=2.0.0',
  description: 'Supply chain and logistics management tools',
  author: 'Tribble SDK Examples',
  keywords: ['logistics', 'shipping', 'inventory', 'freight', 'routing'],
})
  .handler({
    type: 'http',
    url: process.env.HANDLER_URL || 'http://localhost:3001/extension',
  })
  .tool(trackShipment)
  .tool(searchInventory)
  .tool(getFreightQuotes)
  .tool(optimizeRoute)
  .integration(shippingApiIntegration)
  .cartridge(logisticsAssistant)
  .build();

// Export for platform registration
export default extension;

// Export HTTP handler for deployment
export const handler = createHandler(extension);

// ==================== Helper Functions ====================

interface TrackingResult {
  status: 'in_transit' | 'delivered' | 'pending' | 'exception';
  currentLocation: string;
  estimatedDelivery: string;
  events: Array<{ timestamp: string; location: string; description: string }>;
}

async function fetchTrackingStatus(
  _creds: { apiKey: string; baseUrl: string },
  trackingNumber: string,
  _carrier: string
): Promise<TrackingResult> {
  // In production, this would call the actual shipping API
  return {
    status: 'in_transit',
    currentLocation: 'Memphis, TN Hub',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        timestamp: new Date().toISOString(),
        location: 'Memphis, TN',
        description: 'Package arrived at hub',
      },
      {
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        location: 'Origin',
        description: 'Shipment picked up',
      },
    ],
  };
}

function formatTrackingResult(result: TrackingResult): string {
  return `**Shipment Status: ${result.status.toUpperCase()}**

Current Location: ${result.currentLocation}
Estimated Delivery: ${new Date(result.estimatedDelivery).toLocaleDateString()}

**Recent Events:**
${result.events
  .map((e) => `- ${new Date(e.timestamp).toLocaleString()}: ${e.description} (${e.location})`)
  .join('\n')}`;
}

function formatInventoryResults(
  results: Array<{ content: string; usageCount: number; source: string }>,
  query: string
): string {
  if (results.length === 0) {
    return `No inventory found matching "${query}"`;
  }

  return `**Inventory Search Results for "${query}"**

Found ${results.length} matching items:

${results
  .slice(0, 10)
  .map((r, i) => `${i + 1}. ${r.content.slice(0, 100)}... (Source: ${r.source})`)
  .join('\n')}`;
}

interface FreightQuote {
  carrier: string;
  service: string;
  price: number;
  transitDays: number;
  guaranteed: boolean;
}

async function fetchFreightQuotes(
  _creds: { apiKey: string; baseUrl: string },
  _args: {
    originZip: string;
    destZip: string;
    weight: number;
    shipmentType: string;
  }
): Promise<FreightQuote[]> {
  // In production, this would call actual carrier APIs
  return [
    { carrier: 'FedEx', service: 'Ground', price: 12.99, transitDays: 5, guaranteed: false },
    { carrier: 'FedEx', service: 'Express', price: 29.99, transitDays: 2, guaranteed: true },
    { carrier: 'UPS', service: 'Ground', price: 11.49, transitDays: 5, guaranteed: false },
    { carrier: 'UPS', service: '2-Day Air', price: 34.99, transitDays: 2, guaranteed: true },
    { carrier: 'USPS', service: 'Priority', price: 8.99, transitDays: 3, guaranteed: false },
  ];
}

function formatQuotesResult(quotes: FreightQuote[], shipmentType: string): string {
  const sorted = [...quotes].sort((a, b) => a.price - b.price);

  return `**${shipmentType.toUpperCase()} Freight Quotes**

| Carrier | Service | Price | Transit | Guaranteed |
|---------|---------|-------|---------|------------|
${sorted
  .map(
    (q) =>
      `| ${q.carrier} | ${q.service} | $${q.price.toFixed(2)} | ${q.transitDays} days | ${q.guaranteed ? 'Yes' : 'No'} |`
  )
  .join('\n')}

**Best Value:** ${sorted[0].carrier} ${sorted[0].service} at $${sorted[0].price.toFixed(2)}
**Fastest:** ${quotes.sort((a, b) => a.transitDays - b.transitDays)[0].carrier} (${quotes[0].transitDays} days)`;
}

interface OptimizedRoute {
  stops: Array<{ address: string; order: number; arrivalTime: string }>;
  totalDistance: number;
  totalTime: number;
}

function optimizeDeliveryRoute(args: {
  stops: Array<{ address: string; priority?: string }>;
  startAddress: string;
  returnToStart: boolean;
}): OptimizedRoute {
  // In production, this would use a real routing algorithm
  const optimizedStops = args.stops.map((stop, idx) => ({
    address: stop.address,
    order: idx + 1,
    arrivalTime: new Date(
      Date.now() + (idx + 1) * 30 * 60 * 1000
    ).toLocaleTimeString(),
  }));

  return {
    stops: optimizedStops,
    totalDistance: args.stops.length * 5.2,
    totalTime: args.stops.length * 30,
  };
}

function formatRouteResult(route: OptimizedRoute): string {
  return `**Optimized Delivery Route**

Total Distance: ${route.totalDistance.toFixed(1)} miles
Estimated Time: ${Math.round(route.totalTime)} minutes

**Stop Order:**
${route.stops
  .map((s) => `${s.order}. ${s.address} (ETA: ${s.arrivalTime})`)
  .join('\n')}`;
}
