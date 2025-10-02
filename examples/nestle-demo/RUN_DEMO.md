# 🚀 Quick Start - Run the Demo

## For Hana & Abby Meeting

### 1. Start the Server (1 command)

```bash
cd /Users/sunilrao/dev/SDK/examples/nestle-demo && npm run demo
```

### 2. Open Mobile Demo

**In your browser, go to:**
```
http://localhost:3000/mobile.html
```

**Recommended:**
- Zoom browser to 80-90%
- Hide bookmarks bar (⌘+Shift+B in Chrome/Safari)
- Full screen for presenting (⌘+Ctrl+F)

### 3. Demo Flow (5 minutes)

**Show the iPhone screen. Sarah's Monday morning at 9:15am.**

1. **Point out "Today's Visits" - 3 stores**
   - First visit (Tesco) already has "Brief Ready ✓"
   - "Tribble prepared this at 7am—proactive intelligence"

2. **Tap the second visit card (Boots Liverpool)**
   - Watch loading animation (2 seconds)
   - "Tribble is querying Exceedra, SAP, Power BI autonomously"

3. **Show the brief that loads**
   - Executive summary
   - Metrics in green (+12%, +8%)
   - Next best actions with PROOF from similar stores
   - "Birmingham Fort did this → +15% lift"

4. **Scroll through the brief**
   - "iOS-quality UX, not a clunky enterprise tool"
   - "Built for Sarah's workflow, not against it"

5. **Close and return**
   - "All 3 visits ready. Sarah went from 2 hours of prep to 8 minutes"

---

## Key Messages

1. **"Tribble works BEFORE Sarah wakes up"** (7am scheduled workflow)
2. **"Tribble DECIDES what data to query"** (autonomous intelligence)
3. **"Every recommendation has PROOF"** (similar store evidence)
4. **"This is iPhone-quality UX"** (Apple design standards)

---

## If Demo Fails

Backup options in order:

1. **Restart server**: `lsof -ti:3000 | xargs kill -9 && npm run demo`
2. **Show static screenshots**: `output/` folder has generated briefs
3. **Use DEMO_SCRIPT.md**: Detailed walkthrough of all features

---

## Files for Reference

- **MOBILE_DEMO_GUIDE.md** - Complete design & workflow documentation
- **DEMO_SCRIPT.md** - Full demo script with talking points
- **TRIBBLE_PLATFORM_VALUE.md** - Why Tribble vs generic AI
- **README.md** - Complete platform capabilities

---

**You're ready! Open http://localhost:3000/mobile.html and show them the future of field sales.**
