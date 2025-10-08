# Quick Start Guide - Nestlé KAM Demo

Get the **Tribble Platform demo** running in **under 2 minutes** to see autonomous connected intelligence in action.

## Prerequisites
- Node.js 18+ installed
- Terminal access

## Installation

```bash
# 1. Navigate to demo directory
cd /Users/sunilrao/dev/SDK/examples/nestle-demo

# 2. Install dependencies
npm install

# 3. Generate mock data (creates 5 UK stores with full intelligence)
npm run generate-mock-data

# 4. Start the Tribble Platform demo server (serves mobile + NAM views)
npm run demo
```

Server starts on `http://localhost:3000`

Open views:

```text
CAM (store-level):   http://localhost:3000/mobile.html
NAM (territory iPad): http://localhost:3000/mobile-nam.html
```

**What this simulates:** Tribble Platform autonomously querying Exceedra, SAP, Power BI, and SharePoint to generate intelligence.

## Test the Demo

### Quick Test (30 seconds)

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. List stores
curl http://localhost:3000/stores | jq

# 3. Get quick intelligence for demo store
curl http://localhost:3000/kam/intelligence/UK12345 | jq
```

### Full Demo Flow (2 minutes)

```bash
# 1. Start a prep job for Tesco Manchester
curl -X POST http://localhost:3000/kam/prep/start \
  -H "Content-Type: application/json" \
  -d '{"storeId":"UK12345"}' | jq

# 2. Copy the jobId from response, then check status
curl http://localhost:3000/kam/prep/YOUR_JOB_ID/status | jq

# 3. Get the complete result (wait ~2 seconds for completion)
curl http://localhost:3000/kam/prep/YOUR_JOB_ID/result | jq

# 4. Download the markdown brief
curl http://localhost:3000/kam/prep/YOUR_JOB_ID/artifact/markdown
```

## Available Demo Stores

- **UK12345**: Tesco Extra Manchester Arndale (Primary demo store)
- **UK12346**: Boots Liverpool One
- **UK12347**: Superdrug Manchester Market Street
- **UK12348**: Tesco Extra Birmingham Fort
- **UK12349**: Boots Leeds Trinity

## Tribble Platform Capabilities Demonstrated

This demo showcases the core Tribble Platform differentiators:

✅ **Autonomous Multi-System Queries** - Tribble decides what data to pull from Exceedra, SAP, Power BI
✅ **Cross-System Intelligence Synthesis** - Finds patterns across visit history, sales data, and performance dashboards
✅ **Similar Store Pattern Matching** - 87-91% similarity scoring across your network
✅ **Proof-Backed Recommendations** - Every action has evidence from real stores that succeeded
✅ **Risk Alert Discovery** - Automatic detection of OOS, pricing gaps, competitive threats
✅ **Manager-Tailored Intelligence** - Conversation style adapted to store manager preferences
✅ **Mobile-Optimized Output** - One-pager for in-store reference
✅ **Visual Intelligence Generation** - Dashboard-ready JSON analytics

**Not shown in demo but available in Tribble Platform:**
- 🎨 **Multimodal Understanding** - Read campaign decks, reference specific slides, understand images
- 💬 **Conversational Multi-Turn** - Refine briefs through dialogue with context memory
- 📊 **Visual Generation** - Create charts, dashboards, PowerPoint slides
- ✍️ **Transactional Write-Back** - Update Exceedra, Salesforce, create tasks
- ⏰ **Scheduled Workflows** - Proactive morning briefings, impact tracking
- 🌐 **Real-Time Web Research** - Live competitive intelligence from retailer websites

## Demo Mode vs Production

**Current Mode**: Standalone Demo (perfect for testing)
- Uses local mock data (5 UK stores: Tesco, Boots, Superdrug)
- Simulates autonomous Tribble Agent queries
- No Tribble API credentials required
- Perfect for offline presentations

**Production Mode**: Full Tribble Platform Integration
- Connect to real Exceedra API, SAP, Power BI, SharePoint
- Tribble Agent autonomously queries live systems
- Multimodal understanding of uploaded campaign materials
- Conversational multi-turn interface
- Write-back to transactional systems
- Scheduled proactive workflows

**To switch to production:**
```bash
# 1. Create .env file with Tribble credentials
cp .env.example .env
nano .env  # Add TRIBBLE_BASE_URL, TRIBBLE_TOKEN, TRIBBLE_EMAIL

# 2. Start production server (uses Tribble SDK)
npm start
```

## Troubleshooting

**Port already in use:**
```bash
# Kill existing process on port 3000
lsof -ti:3000 | xargs kill -9
npm run demo
```

**Mock data missing:**
```bash
npm run generate-mock-data
```

**Dependencies error:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Run the demo**: `npm run demo`
2. **Test Tribble Platform simulation**: Use curl commands above to see autonomous intelligence
3. **Review generated briefs**: Check `output/` folder for comprehensive intelligence artifacts
4. **Read platform value**: See `TRIBBLE_PLATFORM_VALUE.md` for why Tribble vs generic AI
5. **Prepare for demo meeting**: See `DEMO_SCRIPT.md` for 17th Oct walkthrough

## Understanding Tribble Platform Value

**Generic AI approach (OpenAI, Anthropic APIs directly):**
- You feed it text → It generates text
- YOU do: ETL pipelines, data aggregation, formatting, visualization, system integration
- 4-6 months development, £300-500k investment
- Stale data (batch updates)

**Tribble Platform approach:**
- Tribble Agent autonomously queries your systems on-demand
- Platform understands multimodal content (PDFs, decks, images)
- Platform generates visuals (charts, dashboards, slides)
- Platform writes back to systems (Exceedra, Salesforce)
- Platform runs scheduled workflows (proactive intelligence)
- 2-3 weeks deployment, £15-25k + licensing

**Tribble Platform = AI + Data Layer + Execution Engine + Visual Generation + Write-Back**

## Support

Questions? Check:
- `README.md` - Complete Tribble Platform capabilities and use cases
- `TRIBBLE_PLATFORM_VALUE.md` - Functional benefits, ROI, decision matrix
- `DEMO_SCRIPT.md` - Step-by-step demo walkthrough with objection handling
- `src/` - Source code showing SDK integration patterns
