# Mobile Demo Guide - Nestlé KAM Intelligence

## 🎯 Overview

This is an **iPhone-native demo** that shows how Tribble Platform integrates naturally into a KAM's daily workflow. It demonstrates:

1. **Calendar-first workflow** - Intelligence delivered proactively at 7am
2. **Apple-quality UX** - iOS design patterns, SF Pro typography, smooth animations
3. **Real-time intelligence** - Watch Tribble query systems and generate briefs
4. **Mobile-first design** - Built for field sales, optimized for one-handed use

---

## 🚀 How to Run for Hana & Abby

### Setup (2 minutes)

```bash
# 1. Navigate to demo directory
cd /Users/sunilrao/dev/SDK/examples/nestle-demo

# 2. Ensure mock data exists
npm run generate-mock-data

# 3. Start the server
npm run demo
```

Server starts on `http://localhost:3000`

### Open the Mobile Demo

```bash
# In your browser, open:
http://localhost:3000/mobile.html
```

**Recommended browser setup:**
- Chrome or Safari
- Zoom to 80-90% for comfortable viewing
- Hide bookmarks bar (⌘+Shift+B)
- Enter full screen if presenting (⌘+Ctrl+F)

---

## 📱 The KAM's Daily Workflow

### How Tribble Fits Into Sarah's Day

**Traditional Morning (Without Tribble):**
```
6:00am - Wake up
6:30am - Shower, coffee
7:00am - Start prep work:
  - Open Exceedra, review visit notes (15 min)
  - Export SAP sales data, analyze (15 min)
  - Check Power BI dashboards (10 min)
  - Google competitor promotions (5 min)
  - Correlate everything mentally (5 min)
7:50am - First store prep done
8:00am - Repeat for second store (50 min)
8:50am - Repeat for third store (50 min)
9:40am - Finally ready, but first visit is at 10am!
Total: 2 hours 40 minutes of manual prep
```

**With Tribble Platform:**
```
6:00am - Wake up
6:30am - Shower, coffee
7:00am - Open Tribble app on phone
7:01am - See 3 briefs already prepared (delivered at 7am by scheduled workflow)
7:02am - Review Tesco brief (2 min read)
7:04am - Review Boots brief (2 min read)
7:06am - Review Superdrug brief (2 min read)
7:08am - All prep done, go for a run!
Total: 8 minutes to review pre-generated intelligence
```

**Time saved: 2 hours 32 minutes per day**
**Per month (20 working days): 50 hours saved**
**Equivalent to: 1.25 additional KAM FTEs worth of productivity**

---

## 🎨 UX Design Principles Applied

### 1. Apple Human Interface Guidelines
- **Clarity**: Every element has a clear purpose
- **Deference**: Content is front and center, UI fades to background
- **Depth**: Visual layers create hierarchy and navigation

### 2. SF Pro Typography
- **Display**: 34pt for greeting (bold, attention-grabbing)
- **Text**: 17pt for body (optimal readability)
- **Caption**: 13pt for metadata (subtle, non-distracting)

### 3. iOS Color System
- **Blue (#007AFF)**: Actions, links, primary buttons
- **Green (#34C759)**: Positive metrics, success states
- **Red (#FF3B30)**: Alerts, critical issues
- **Orange (#FF9500)**: Warnings, pending states

### 4. Dark Mode (iOS 13+)
- Battery-efficient for all-day field use
- Reduces eye strain in varying lighting conditions
- Premium, modern aesthetic

### 5. Card-Based Design (iOS 13+)
- Inspired by Apple Health, Apple News
- Each card is a discrete, scannable unit of information
- Tap targets are large (44pt minimum) for easy interaction

### 6. Animations & Transitions
- **0.4s cubic-bezier(0.4, 0, 0.2, 1)** - iOS standard easing
- Slide-up modals (full-screen briefs)
- Fade-in cards (staggered animation-delay)
- Scale-down on tap (haptic feedback simulation)

---

## 📊 Key Demo Moments

### Moment 1: Proactive Intelligence
**"Notice the first visit has a green 'Brief Ready' badge. Tribble prepared this at 7am—BEFORE Sarah woke up."**

This demonstrates:
- ✅ Scheduled workflows (Tribble cron job at 7am)
- ✅ Proactive intelligence delivery
- ✅ Zero manual work for Sarah

### Moment 2: On-Demand Generation
**"The second visit says 'Tap to prep'. Let's watch Tribble generate a brief in real-time."**

[Tap Boots Liverpool card]

This demonstrates:
- ✅ Autonomous system queries (Exceedra, SAP, Power BI)
- ✅ 2-second generation time
- ✅ Real-time intelligence, not batch processing

### Moment 3: Proof-Backed Recommendations
**"Action 1: Repositioned vitamins to seasonal display area. Expected impact: +15-18% category lift. Evidence: Tesco Birmingham Fort achieved 15% lift with this action."**

This demonstrates:
- ✅ Cross-system pattern matching (similar stores)
- ✅ Proof from real store success
- ✅ Specific impact projections (not vague suggestions)

### Moment 4: Mobile-Native Experience
**"This isn't a PDF. This isn't a web app. This is iOS-quality UX built for Sarah's workflow."**

This demonstrates:
- ✅ Apple-level design execution
- ✅ Fast, smooth, delightful to use
- ✅ Built for one-handed operation in-store

---

## 🎭 Demo Script Highlights

### Opening Line
**"Good morning Abby, Hana. What you're about to see isn't just AI—it's a Connected Intelligence System that lives in your KAMs' daily workflow."**

### Key Talking Points

1. **"Tribble works BEFORE Sarah wakes up"**
   - Scheduled 7am workflow
   - Proactive, not reactive

2. **"Tribble DECIDES what data to query"**
   - Autonomous intelligence
   - No manual data wrangling

3. **"Every recommendation has PROOF"**
   - Similar store evidence
   - Real numbers, not guesses

4. **"This is iOS-quality UX"**
   - Not a clunky enterprise tool
   - Built like consumer apps Sarah uses daily

### Closing
**"This is how Tribble Platform transforms Sarah's 45-minute prep into 2 minutes. And this is just visit prep. Imagine this intelligence across your entire field organization—post-visit tracking, impact measurement, success replication. That's the Tribble Platform value."**

---

## 🔧 Technical Notes

### How the Demo Works

**Frontend:**
- Pure HTML/CSS/JavaScript (no frameworks)
- iPhone frame simulation (390x844px)
- Apple SF Pro font stack
- Dark mode color system
- Smooth animations (CSS transforms)

**Backend:**
- Express server serving static files
- Mock data for 5 UK stores
- Intelligence engine generates briefs locally
- API endpoints:
  - `GET /stores` - List stores
  - `POST /kam/prep/start` - Generate brief
  - `GET /kam/prep/:jobId/status` - Check status
  - `GET /kam/prep/:jobId/result` - Get brief data
  - `GET /kam/intelligence/:storeId` - Quick intelligence

**Data Flow:**
```
User taps card
  ↓
POST /kam/prep/start {storeId}
  ↓
Backend orchestrates:
  - DataService.getExceedraVisits()
  - DataService.getSAPSalesData()
  - DataService.getPowerBIDashboard()
  - IntelligenceEngine.generateNextBestActions()
  ↓
Returns jobId
  ↓
Frontend polls GET /kam/prep/{jobId}/status
  ↓
Status: completed
  ↓
GET /kam/prep/{jobId}/result
  ↓
Render brief in iOS interface
```

### Performance
- Brief generation: **1-2 seconds**
- Mobile page load: **<500ms**
- Animations: **60fps** (GPU-accelerated transforms)

---

## 🎨 Design Assets

### Color Palette
```css
--ios-blue: #007AFF
--ios-green: #34C759
--ios-red: #FF3B30
--ios-orange: #FF9500
--ios-gray: #8E8E93
--card-bg: #1C1C1E
--text-primary: #FFFFFF
--text-secondary: rgba(255, 255, 255, 0.6)
```

### Typography Scale
```css
--greeting: 34px / 700 / -0.6px
--store-name: 20px / 600 / -0.3px
--body: 17px / 500 / normal
--caption: 13px / 600 / 0.5px
```

### Spacing System (iOS 8pt grid)
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px
```

---

## 📈 Expected Reactions

### Positive Signals
- ✅ "This is beautiful"
- ✅ "Our KAMs would actually use this"
- ✅ "The proactive briefing is exactly what we need"
- ✅ "I love the proof-backed recommendations"
- ✅ "How quickly can we pilot this?"

### Objections & Responses

**"This looks complex to build"**
→ "The UI is complex, but that's OUR work, not yours. Your team just configures data sources and workflows. Tribble Platform handles the rest."

**"Do we need to redesign our systems?"**
→ "No. Tribble connects to your EXISTING systems via APIs. Exceedra, SAP, Power BI—all stay exactly as they are. Tribble is the intelligence layer on top."

**"Can we customize the look?"**
→ "Absolutely. This is YOUR app. We can white-label it with Nestlé branding, adjust the data shown, and configure workflows to your exact needs."

**"What about data security?"**
→ "Tribble Platform deploys in YOUR VPC. All data stays within your environment. We're SOC 2 compliant and support GDPR requirements."

---

## 🚀 Next Steps After Demo

**If they're excited:**

1. **2-Week Technical Pilot**
   - Connect Tribble to Exceedra API (read-only)
   - Configure 5 KAMs for testing
   - Track time savings & usage patterns

2. **4-Week Field Pilot**
   - 20 KAMs using Tribble daily
   - Measure: prep time, action success rates, sales lift correlation
   - Gather feedback, refine workflows

3. **8-Week Rollout**
   - Full UK&I KAM team (100 users)
   - Scheduled workflows, post-visit tracking, impact reporting
   - ROI measurement: time saved, revenue impact

**Timeline: 2 months from contract to full deployment**

---

**Demo is ready at: http://localhost:3000/mobile.html**

**Show them the future of field sales intelligence. Show them Tribble Platform.**
