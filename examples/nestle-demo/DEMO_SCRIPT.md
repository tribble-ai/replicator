# Demo Script for 17th October Meeting

**Duration:** 9-10am GMT (10 minutes total)
**Audience:** Abby Dellow, Hana Nendl, Head of Field Sales UK&I
**Objective:** Demonstrate how Tribble Platform solves KAM pain points through connected intelligence

---

## Pre-Demo Checklist (5 min before)

- [ ] Server running: `npm run demo`
- [ ] Mock data generated: `npm run generate-mock-data`
- [ ] **Mobile demo open**: `http://localhost:3000/mobile.html`
- [ ] Browser at comfortable zoom level (80-90% recommended)
- [ ] Demo store verified: UK12345 (Tesco Manchester Arndale)
- [ ] Audio/screen sharing tested

---

## Opening (1 min)

**"Good morning Abby, Hana. Thank you for walking us through your KAMs' workflow and pain points. We've built Tribble Platform to fundamentally solve these challenges—not with a tool, but with a Connected Intelligence System."**

### Key Pain Points Tribble Solves
1. ✅ Call prep takes 45+ minutes → **Tribble autonomously queries all systems in seconds**
2. ✅ No AI summary of past visits/data → **Tribble understands your Exceedra history conversationally**
3. ✅ Missing next best action suggestions → **Tribble cross-references similar stores with proof**
4. ✅ Can't easily see what worked in similar stores → **Tribble finds patterns across your entire network**
5. ✅ Hard to link actions to sales impact → **Tribble writes back to systems and tracks outcomes**

**"This isn't generic AI. This is Tribble Platform—your autonomous intelligence layer. Let me show you..."**

---

## Scenario Setup (30 sec)

**"Sarah Williams is a KAM covering Greater Manchester. It's Monday morning at 9:15am, and she has 3 store visits today."**

**Show iPhone screen**

**"This is Sarah's morning. She wakes up, opens her phone, and Tribble has already prepared her day."**

**"Traditionally, Sarah would spend 45 minutes PER STORE:"**
- Manually reviewing Exceedra visit notes
- Pulling SAP sales reports
- Checking Power BI dashboards
- Googling competitor promotions
- Correlating everything mentally

**"That's over 2 hours of prep before her first visit. With Tribble Platform, she opens her phone and everything's ready."**

---

## Live Demo - Mobile UX (5 min)

**[Show iPhone interface at http://localhost:3000/mobile.html]**

### Step 1: Morning View - Calendar Integration (1 min)

**[Scroll through the iPhone interface]**

**"Look at Sarah's morning at 9:15am. Clean, beautiful, Apple-quality interface."**

Point out key elements:

1. **Personalized Greeting**
   - "Good morning Sarah Williams · North West Territory"
   - Monday, 30 September

2. **Today's Visits Section**
   - "3 stores"
   - Each visit is a card with time, store name, manager

3. **First Visit Card - Tesco Manchester (10:00 AM)**
   - "Brief Ready" ✓ (green badge)
   - Quick stats right on the card:
     - Immunity: +12% (green, good news)
     - Last Visit: 2 months ago
     - Actions: 4 ready

**"Notice: Tribble already prepared the Tesco brief at 7am this morning. Sarah woke up to a proactive briefing. This is the scheduled workflow capability—Tribble works BEFORE Sarah asks."**

4. **Second & Third Visits**
   - "Tap to prep" badges (orange, pending)
   - Boots Liverpool at 2:30pm
   - Superdrug Manchester at 4:45pm

**"These briefs aren't generated yet. Let's watch Tribble create one in real-time."**

---

### Step 2: Generate Brief in Real-Time (1 min)

**[Tap the second visit card: "Boots Liverpool One"]**

**Watch the loading animation:**
- Smooth iOS-style spinner
- "Generating brief..."
- "Tribble is querying Exceedra, SAP, and Power BI"

**Narrate while loading (1-2 seconds):**

**"Tribble Platform is AUTONOMOUSLY:"**
- Querying Exceedra API for visit history
- Pulling SAP sales data (90 days)
- Searching Power BI for performance trends
- Finding similar stores across the network
- Detecting risk patterns (OOS, pricing gaps)
- Generating proof-backed recommendations

**"Total time: 2 seconds. Sarah tapped once."**

**[Brief loads]**

---

### Step 3: The Brief - iOS Native Experience (2 min)

**[Show the full brief interface]**

**"This is NOT a PDF export. This is a native iOS experience designed for Sarah's workflow."**

#### **1. Hero Section**
- Store name: "Tesco Extra Manchester Arndale"
- Manager: "David Thompson · Tesco Extra"

#### **2. Critical Alert Badge** (if any)
- Red badge: "⚠️ 2 critical alerts"
- Immediately visible—Sarah knows what's urgent

#### **3. Executive Summary Card**
- Clean, readable 17pt SF Pro font
- "Store performing 'Excellent'. Immunity up 5%. Critical: Boost Plus OOS."

**"In 3 seconds of reading, Sarah knows exactly what's important."**

#### **4. Metrics Grid - Apple Health Style**
- Two cards side-by-side
- Immunity: £16.9K (+12% ↑ in green)
- Adult Nutrition: £24.3K (+8% ↑ in green)

**"Visual, scannable, color-coded. Green = good news."**

#### **5. Next Best Actions - THE GAME-CHANGER**

**[Scroll to actions section]**

**"Here's where Tribble's cross-system intelligence shines."**

**Action 1: Priority badge (🔴 High)**
- "Repositioned vitamins to seasonal display area"
- Impact: "+15-18% category lift"
- Evidence: "Tesco Birmingham Fort achieved 15% lift with this action"

**"Tribble searched the entire network, found Birmingham Fort (91% similar store), and says: 'They did this, got +15% lift, 312 units, £2,890 revenue.'"**

**"Sarah walks in with PROOF. The store manager can't say 'I don't think that'll work'—Birmingham already proved it."**

**Action 2 & 3:**
- Also prioritized (🟠 Medium)
- Also backed by similar store evidence
- Also with specific impact numbers

**"Every recommendation has proof. Every action is prioritized. Every metric is real."**

---

### Step 4: Mobile-Optimized UX (30 sec)

**[Scroll back to top, then swipe down to close brief]**

**"Notice the experience:"**
- Smooth animations (Apple-quality 60fps)
- Native iOS gestures
- Dark mode (battery-friendly for field work)
- SF Pro typography (same as Apple Health)
- Card-based design (easy to scan in-store)
- Pull-to-close gesture

**"This isn't a web app trying to look like iOS. This IS iOS-quality UX."**

**[Return to home view]**

**"Sarah can now tap the Tesco card again to review before her 10am visit, or move on to other briefs. Everything's ready."**

### Step 3: Review Generated Brief (3 min)

**Browser - Get Result:**
```bash
curl http://localhost:3000/kam/prep/JOBID/result | jq
```

Or open: `http://localhost:3000/kam/prep/JOBID/artifact/markdown`

### 🎯 **Highlight #1: Visit History Summary**

**"Look at this section..."**

```markdown
Recent Visit History
Last Visit: 2025-09-09
Recent Focus Areas: merchandising optimization, inventory management

Key Actions from Recent Visits:
- 2025-09-09: Secured agreement for 2x additional facings on Immunity+ range
  - Outcome: Manager committed to implementation by next visit
```

**"AI has summarized what happened last time and what needs follow-up. Sarah doesn't have to remember or re-read notes."**

### 🎯 **Highlight #2: Performance Analysis**

**"The system has analyzed sales data..."**

```markdown
Store Performance Analysis
Overall Assessment: Good

✅ Strengths:
- Adult Nutrition outperforming territory by 2%
- Immunity showing strong growth momentum (12%)

🎯 Opportunities:
- Immunity category showing strong growth momentum (12%)
```

**"This answers: 'How is the store doing?' in 3 seconds, not 15 minutes of manual analysis."**

### 🎯 **Highlight #3: Next Best Actions** (MOST IMPORTANT)

**"Here's where Tribble Platform's cross-system intelligence becomes powerful..."**

```markdown
🟠 Priority 1: Implemented Immunity+ end-cap display with educational materials

Priority Level: HIGH
Rationale: Store profile matches Boots Liverpool One (87% similarity).
           They achieved 11% category lift with this action.
Expected Impact: +11-13% category lift
Supporting Evidence:
- Boots Liverpool One Case Study
- 245 additional units sold
- £2,150 revenue increase

Implementation:
- Timeline: 1-2 weeks
- Resources: POS materials, Staff training, Stock allocation
- Dependencies: Store manager approval, Inventory availability

Replicability: High
```

**"This is THE game-changer. Tribble searched your entire network of stores, found Boots Liverpool One (87% match to Manchester Arndale), and says: 'They did this end-cap display, got +11% lift, 245 units, £2,150 revenue.' Sarah walks in with PROOF, not just a suggestion."**

**"The store manager can't say 'I don't think that'll work here.' Liverpool already proved it works."**

### 🎯 **Highlight #4: Risk Alerts**

```markdown
🚨 Risk Alerts

🔴 Boost Plus Vanilla - Out of Stock Risk (HIGH)
- 2 OOS incidents in past 90 days
- Impact: £315/week revenue at risk
- Action: Verify current stock levels and place emergency order if needed
```

**"Critical issues are surfaced automatically. Sarah can address them proactively before the manager brings them up."**

### 🎯 **Highlight #5: Talking Points**

**"The system even tailors the opening based on the store manager's preferences..."**

```markdown
Talking Points
Tailored for David Thompson (Data-driven, responsive to category performance)

1. "Your Immunity category is growing 12% vs 8% territory average"
   - Type: data-driven | Context: Opening statement to engage data-focused manager

2. "I wanted to recognize Adult Nutrition outperforming territory by 2%"
   - Type: recognition | Context: Build rapport by acknowledging success
```

**"Sarah knows David loves data, so she leads with numbers. This is relationship intelligence."**

### Step 4: Mobile One-Pager (30 sec)

**"For the actual visit, Sarah has this on her phone..."**

```bash
curl http://localhost:3000/kam/prep/JOBID/artifact/onepager
```

**Show mobile-optimized view:**
- Top 3 actions
- Key stats
- Critical alerts
- Opening line

**"Everything she needs at a glance while standing in the store."**

---

## Close with Impact: The Full Loop (2 min)

**"So what Sarah used to do in 45 minutes of manual work, Tribble Platform does autonomously in 20 seconds."**

**"But here's where Tribble Platform becomes truly transformational..."**

### Conversational Refinement (30 sec demo)

**"After reviewing the brief, Sarah has a follow-up question..."**

```bash
curl -X POST http://localhost:3000/kam/chat \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "UK12345",
    "kamEmail": "sarah.williams@nestle.com",
    "message": "Manager David Thompson hates long documents. Can you give me a visual one-pager instead?",
    "conversationId": "session-abc123"
  }' | jq
```

**Tribble responds:**
```
"I've regenerated the brief as a mobile-optimized one-pager with:
• Top 3 priority actions (visual icons)
• Key stats dashboard (immunity +12%, £16,916)
• Critical alert (Boost Plus OOS)
• Opening line for David
Ready to view at /artifact/onepager"
```

**"Notice: Tribble REMEMBERED the store context, the brief content, and David's preferences. This is conversational intelligence."**

### Write-Back & Impact Tracking (30 sec explanation)

**"After the visit, Sarah simply tells Tribble what happened..."**

```bash
curl -X POST http://localhost:3000/kam/post-visit \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "UK12345",
    "actions": ["Secured manager approval for Immunity+ display", "Resolved Boost Plus OOS"],
    "commitments": ["Q4 campaign participation"]
  }'
```

**"Tribble Platform automatically:"**
- ✅ Writes structured visit note to Exceedra API
- ✅ Updates Salesforce opportunity stage → "Committed"
- ✅ Creates calendar reminder for 2-week follow-up
- ✅ Notifies regional manager via Slack
- ✅ **Schedules workflow**: In 2 weeks, pull SAP data, check for immunity lift

**"Two weeks later, Tribble autonomously shows Sarah:"**
```
✅ Your Immunity+ display at UK12345 → +9% category lift
✅ OOS resolution recovered £630 in sales
✅ Replicate this playbook? 3 similar stores identified.
```

**"Now Sarah KNOWS what works. She can replicate success across her 20-store territory with confidence."**

---

## What Makes This Different (30 sec)

**"This isn't just AI. This isn't just faster data access. This is Tribble Platform—a Connected Intelligence System that:"**

1. **Autonomously queries** your enterprise systems (Exceedra, SAP, Power BI, SharePoint)
2. **Understands multimodal content** (campaign decks, images, playbooks)
3. **Generates visual intelligence** (charts, dashboards, slides)
4. **Maintains conversational context** (refine briefs in dialogue)
5. **Writes back to systems** (closed-loop intelligence)
6. **Works proactively** (scheduled workflows, impact tracking)

**"Generic AI APIs give you text generation. Tribble Platform gives you autonomous intelligence."**

**"That's what we wanted to show you today."**

---

## Q&A Anticipated (1 min buffer)

### **Q: "How does this integrate with our existing systems?"**
**A:** "Tribble Platform connects directly to your systems via their APIs—Exceedra REST API, SAP data warehouse connectors, Power BI REST API, SharePoint/Google Drive indexes. The Tribble Agent autonomously queries these on-demand. No ETL pipelines, no data warehousing required. We can also integrate the conversational interface into your existing mobile app, web portal, Slack, or Teams."

### **Q: "What about data privacy and security?"**
**A:** "All data stays within your Tribble Platform instance. We can deploy in your VPC, on-premise, or your preferred cloud environment. The Tribble Agent never shares store data externally—it queries your systems, synthesizes insights, and returns intelligence directly to your KAMs. We're SOC 2 compliant and support GDPR requirements."

### **Q: "Can we customize the recommendations and intelligence?"**
**A:** "Absolutely. Tribble Platform is configurable at every level. You can adjust similarity scoring thresholds, add custom action templates, set territory-specific rules, define what 'success' looks like, and even train the agent on your specific playbooks and campaign materials. The more you feed it, the smarter it gets."

### **Q: "How accurate are the similar store matches?"**
**A:** "Tribble uses multi-factor similarity across region, format, demographics, footfall, manager preferences, and historical performance patterns. You saw 87% match for Liverpool-Central. We typically surface 3-5 matches above 80% similarity. The matching algorithm is tunable, and KAMs can provide feedback to refine future matches."

### **Q: "What if there's no historical data for a new store?"**
**A:** "Great question. For new stores, Tribble Platform falls back to region-wide patterns, retailer-specific benchmarks, and demographic proxies. It explicitly flags 'limited historical data' in the brief and adjusts confidence scores accordingly. As visit data accumulates, the intelligence improves automatically."

### **Q: "How long to deploy this for our team?"**
**A:** "We can have a pilot running for 5-10 KAMs within 2-3 weeks. Week 1: Connect Tribble to your systems (Exceedra, SAP, Power BI, SharePoint). Week 2: Pilot with your KAMs, gather feedback. Week 3: Refine and scale. The Tribble SDK accelerates this significantly—no custom development needed."

### **Q: "This looks complex. How much development effort is required?"**
**A:** "That's the beauty of Tribble Platform. Generic AI would require 4-6 months of custom development—ETL pipelines, data warehouses, custom integrations. With Tribble, it's 2-3 weeks because the platform DOES the work. The Tribble Agent autonomously queries systems, understands content, generates visuals, writes back. You're not building infrastructure—you're connecting to a complete intelligence system."

### **Q: "What about multimodal capabilities—can it really understand our campaign decks?"**
**A:** "Yes. Tribble Platform has native multimodal understanding. Upload your Q4 Immunity campaign deck (PowerPoint, PDF, images), and Tribble can reference specific slides, extract visual insights, and recommend which slides to show for a specific store. For example: 'Show slide 7 with the growth chart—it resonates with this store's data-driven manager.' That's not possible with generic text-only AI."

---

## Post-Demo Follow-Up

**"We'd love to set up a pilot with a small group of KAMs to prove Tribble Platform's value in your environment. Here's what that looks like:**

### **3-Week Pilot Plan**

**Week 1: Platform Setup**
- Connect Tribble Platform to your systems (Exceedra API, SAP, Power BI, SharePoint)
- Upload campaign materials, playbooks, enablement content
- Configure workflows (morning briefings, post-visit tracking)
- Deploy conversational interface (Slack/Teams/mobile)

**Week 2: Pilot with 5-10 KAMs**
- KAMs use Tribble alongside existing workflow
- Daily feedback collection
- Track time savings, usage patterns, intelligence quality

**Week 3: Refine & Scale**
- Adjust based on KAM feedback (tone, format, data sources)
- Add custom playbooks and territory rules
- Expand to 20-30 KAMs
- Measure impact: time saved, action success rates, sales lift correlation

**Expected Outcomes:**
- 40+ minutes saved per visit (45min → 2-5min)
- Higher quality calls (data-backed recommendations)
- Proven action-to-impact tracking
- KAM confidence in what works

**"Would a pilot like this be valuable for Nestlé Health Science?"**

---

## Technical Backup (If Needed)

### If Demo Fails
**"Let me show you a pre-recorded version..."**

Or fall back to static artifacts:
```bash
# Show pre-generated brief
cat output/brief-sample-UK12345.md
```

### If Questions Go Deep Technical
**"Sunil can walk through the architecture..."**

Hand off to technical deep-dive on:
- Data ingestion pipelines
- Intelligence engine algorithms
- Tribble SDK integration
- Deployment options

---

## Success Metrics

**You've crushed it if they say:**
- ✅ "This would save our KAMs so much time"
- ✅ "The autonomous system queries are exactly what we need"
- ✅ "I love that it writes back to Exceedra automatically"
- ✅ "The conversational refinement is powerful"
- ✅ "Can we pilot this with our team?"
- ✅ "How quickly can we get this running?"

**Red flags to watch for & how to respond:**

**❌ "We already have tools that do this"**
→ **Response:** "What you have are tools that ACCESS data. Tribble Platform is a connected intelligence LAYER that autonomously SYNTHESIZES across all those tools. Your current tools can't query Exceedra + SAP + Power BI simultaneously, find similar stores with 87% match, and generate proof-backed recommendations in 20 seconds. That's the difference between data access and autonomous intelligence."

**❌ "This seems complicated"**
→ **Response:** "That's the beauty—it's complex underneath but simple for Sarah. She asks one question. Tribble does everything else. Show the mobile one-pager: 'This is what Sarah sees in-store. Top 3 actions, key stats, opening line. That's it.'"

**❌ "How much does it cost?"**
→ **Response:** "Let's focus on the pilot first. If we can save your 100 KAMs 40 minutes per visit, that's 70 hours per day across the team—equivalent to 9 full-time KAM positions of productivity unlocked. That's the ROI baseline. Let's prove the value with 5-10 KAMs first, then we'll discuss commercial terms based on measured impact."

**❌ "Can't we just use ChatGPT or generic AI?"**
→ **Response:** "Generic AI gives you text generation. You'd still need to build ETL pipelines, data warehouses, integrate with Exceedra/SAP/Power BI, create visual generation, implement write-back, and build scheduled workflows. That's 4-6 months of custom development and £300-500k. Tribble Platform IS that entire stack—pre-built, ready to connect. We deploy in 2-3 weeks, not months."

---

**Good luck! You've got this. 🚀**