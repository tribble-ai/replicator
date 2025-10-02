# Nestlé Demo Presentation Guide

## Complete Demo Package

You now have a professional, executive-ready presentation system with:

### 1. **React Presentation Deck** (7 slides)
Location: `/presentation/`

**Slide Flow:**
1. **Title**: "Intelligence Where Your Teams Work"
2. **The Challenge**: 6 pain points (45min prep, fragmented data, missed opportunities, etc.)
3. **The Solution**: Tribble as AI orchestration layer on top of existing stack
4. **Platform Architecture**: Decoupled innovation (Frontend ↔ Tribble ↔ Backend)
5. **Demo Overview**: 3 pillars setup → **PAUSE HERE AND SWITCH TO MOBILE APP**
6. **Business Impact**: ROI, competitive advantages, compounding intelligence
7. **Next Steps**: 4-week pilot program details

### 2. **Mobile Demo App**
Location: `/public/mobile.html`

**Three Pillars Demonstrated:**
1. **Proactive Visit Prep**: Briefs ready at 7am (45min → 2min)
2. **Territory Intelligence**: Unified dashboard, color-coded health
3. **Conversational AI**: "Ask Tribble" chat for ad-hoc queries

---

## Running the Full Demo

### Setup (Before Meeting)

```bash
# Terminal 1: Mobile App
cd /Users/sunilrao/dev/SDK/examples/nestle-demo
npm run demo
# Access at: http://localhost:3000/mobile.html

# Terminal 2: Presentation
cd presentation
npm install
npm run dev
# Access at: http://localhost:3001
```

### Demo Flow (Recommended)

**Part 1: Context Setting (Slides 1-5, ~10 minutes)**

1. **Slide 1**: Open with the vision - intelligence layer on top of their stack
2. **Slide 2**: Acknowledge pain points they raised (don't name names, but reference themes)
3. **Slide 3**: Explain how Tribble orchestrates without replacing
4. **Slide 4**: Show architecture - emphasize "backend untouched, frontend agile"
5. **Slide 5**: Set up 3 demo pillars

**Part 2: Live Mobile Demo (~5-8 minutes)**

*Switch to mobile app (open on phone or browser at localhost:3000/mobile.html)*

**Pillar 1: Proactive Visit Prep**
- Show "Today" tab → first visit already has "Brief Ready ✓"
- Tap into it → full intelligence brief loads
- Point out: "This was prepared at 7am, before the KAM woke up"
- Show proof-backed actions with Birmingham Fort evidence
- **Key message**: "45 minutes of prep work → 2 minutes of review"

**Pillar 2: Territory Intelligence**
- Tap "Territory" tab
- Show dashboard: 4 key stats, store performance list
- Point out color coding: Excellent (green), Needs Attention (orange)
- **Key message**: "One view of entire territory health, not scattered dashboards"

**Pillar 3: Conversational AI Fallback**
- Tap "Ask Tribble" tab
- Show suggested questions
- Tap one → watch typing indicator → response appears
- Explain: "Queries live data from Exceedra, SAP, Power BI"
- **Key message**: "When KAMs have questions dashboards can't answer, AI steps in"

**Part 3: Impact & Next Steps (Slides 6-7, ~5 minutes)**

*Switch back to presentation*

6. **Slide 6**: Business impact - not just efficiency, but competitive advantage
   - Emphasize: "Gets smarter every day" (compounding intelligence)
   - ROI: −90% prep time, 2-week UX cycles, +25% win rate
7. **Slide 7**: Pilot proposal
   - 4 weeks, 5-10 KAMs
   - Zero backend changes
   - Fast time-to-value (Week 1: first brief)

---

## Key Talking Points

### Why This Matters for Nestlé

**Addresses Specific Challenges:**
- ✓ KAMs spending too long on prep
- ✓ Data scattered across 6+ systems
- ✓ No proof points to back recommendations
- ✓ Slow innovation cycles (months, not weeks)
- ✓ Rising costs without productivity gains

**What Makes Tribble Different:**
- **Layer, not replacement**: Works on top of existing systems
- **Decoupled innovation**: Change UX weekly; backend stays stable
- **SDK-powered UX**: 2-week iteration cycles
- **Proof-backed actions**: Every recommendation has evidence
- **Write-back capability**: Tribble syncs data back to Exceedra

### Objection Handling

**"We already have systems for this"**
→ "Exactly. Tribble doesn't replace them—it connects them. Your KAMs get one interface; your data stays where it is."

**"How long does integration take?"**
→ "The demo you just saw? 2 weeks to build using our SDK. Traditional development: 6+ months and full backend work."

**"What if we want to change the UX?"**
→ "That's the point. With SDK, we iterate in 2-week sprints. User feedback Friday → new UX Monday. Backend never touched."

**"Is our data secure?"**
→ "OAuth, role-based access, audit logs. Data stays in your tenant. Tribble queries on-demand; we don't store sensitive customer data."

---

## Presentation Tips

### Navigation
- Use **arrow keys** to advance slides
- **Spacebar** also moves forward
- Click **slide indicators** to jump
- **Escape** doesn't work (not built in)

### Visual Design
- Dark theme (matches Tribble branding)
- High contrast for projector visibility
- Animations are subtle (professional, not distracting)
- All slides optimized for 16:9 ratio

### Timing
- **Total presentation**: 20-25 minutes
- **Slides 1-5**: ~10 min
- **Mobile demo**: ~5-8 min
- **Slides 6-7**: ~5 min
- **Q&A**: 10-15 min

### Demo Day Checklist

**Technical:**
- [ ] Both servers running (mobile on :3000, presentation on :3001)
- [ ] Mobile app tested on phone (if demoing on device)
- [ ] Backup: Mobile app works in desktop browser
- [ ] WiFi/internet stable

**Content:**
- [ ] Know which pain points to emphasize (from discovery)
- [ ] Have 4-week pilot dates ready
- [ ] Pricing discussion (if asked): reference Tribble site or prepare custom
- [ ] Reference customers (if relevant): sanitize or get permission

**Logistics:**
- [ ] HDMI/presentation setup tested
- [ ] Mobile screen mirroring (if demoing on phone)
- [ ] Backup plan if tech fails: screenshots/video recording

---

## Customization Options

### Before Your Meeting

**Slide 2 (The Challenge):**
- Adjust the 6 pain points based on discovery feedback
- Add specific data points if you have them ("KAMs report 2hrs/day on admin")

**Slide 7 (Next Steps):**
- Insert actual pilot start date
- Adjust KAM cohort size (currently "5-10")
- Add specific systems they want to connect first

### Mid-Demo Pivots

If audience is more **technical**:
- Spend extra time on Slide 4 (architecture)
- Show "Ask Tribble" → Teams integration buttons
- Explain write-back mechanics

If audience is more **business-focused**:
- Emphasize Slide 6 (ROI, competitive advantage)
- Spend less time on architecture details
- Focus on proof-backed actions in mobile demo

---

## Post-Demo Follow-Up

### Immediate Next Steps
1. Send deck PDF (export from presentation)
2. Share mobile app URL (if on shared network)
3. Schedule pilot kickoff call

### Pilot Proposal Template
(Reference Slide 7 for details)

**Week 1**: Discovery, connect systems, define success
**Week 2-3**: Build workflows, iterate with KAMs
**Week 4**: Measure, document ROI, plan rollout

**Deliverables:**
- Working app on pilot users' phones
- Live Exceedra + SAP connections
- Proactive briefs (nightly)
- Territory dashboard
- Chat interface
- Write-back to Exceedra
- ROI documentation

---

## Questions?

This guide covers the full demo flow. The presentation and mobile app work together to tell a complete story: **Tribble brings AI intelligence to your KAMs without disrupting your backend systems.**

**Key Differentiator**: While competitors offer point solutions, Tribble is an **orchestration layer** that gets smarter every day—creating a compounding competitive advantage.
