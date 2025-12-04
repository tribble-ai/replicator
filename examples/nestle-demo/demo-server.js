// Lightweight demo server for offline/controlled-run presentations
// Serves static assets from ./public and mocks the API responses

import express from 'express'

const app = express()
app.use(express.json())

// Simple CORS (avoid extra deps)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Static files (tablet/phone HTML live here)
app.use(express.static('./public'))

// ---------- NAM endpoints ----------
app.get('/nam/overview', (req, res) => {
  res.json({
    summary: {
      revenue90d: 1248600,
      yoyGrowthAvg: 0.087,
      oosIncidents: 5,
      actionsLast60d: 142
    },
    categoryMix: [
      { category: 'Immunity', revenue: 169000, mix: 0.19 },
      { category: 'Adult Nutrition', revenue: 243000, mix: 0.26 },
      { category: 'Pediatrics', revenue: 205000, mix: 0.22 },
      { category: 'Tube & Liquid Nutrition', revenue: 286000, mix: 0.31 },
      { category: 'Weight & Wellness', revenue: 148600, mix: 0.12 }
    ],
    leaderboard: [
      { storeId:'UK12345', name:'Tesco Extra Manchester Arndale', retailer:'Tesco', revenue90d: 42300, yoyGrowth: 0.16 },
      { storeId:'UK12346', name:'Boots Liverpool One', retailer:'Boots', revenue90d: 38100, yoyGrowth: 0.09 },
      { storeId:'UK12347', name:'Superdrug Manchester Market Street', retailer:'Superdrug', revenue90d: 21400, yoyGrowth: -0.08 },
      { storeId:'UK22311', name:'Asda Leeds White Rose', retailer:'Asda', revenue90d: 45700, yoyGrowth: 0.22 },
      { storeId:'UK99810', name:'Waitrose Altrincham', retailer:'Waitrose', revenue90d: 31200, yoyGrowth: 0.05 }
    ],
    riskAlerts: [
      { title:'Boost Plus OOS 4 days', storeName:'Tesco Extra Manchester Arndale' },
      { title:'Vitamin display compliance < 60%', storeName:'Superdrug Manchester Market Street' }
    ]
  })
})

app.get('/nam/kams', (req, res) => {
  res.json({
    kams: [
      { name:'Sarah Williams', territory:'North West', stores:['UK12345','UK12347','UK22311'], performanceScore: 86, meetingsThisWeek: 7, revenue90d: 148900,
        coachingNeeds:['Close on next steps','Link actions to sales'] },
      { name:'Tom Davies', territory:'London & South East', stores:['UK99810'], performanceScore: 79, meetingsThisWeek: 5, revenue90d: 132400,
        coachingNeeds:['Better OOS escalation'] },
      { name:'Priya Shah', territory:'Midlands & Wales', stores:['UK88331'], performanceScore: 91, meetingsThisWeek: 8, revenue90d: 156700,
        coachingNeeds:['Promo compliance follow‑through'] }
    ]
  })
})

app.get('/nam/calls', (req, res) => {
  res.json({
    calls: [
      { id:'CALL-1001', camName:'Sarah Williams', date:'2025-10-10T09:30:00Z',
        storeName:'Tesco Extra Manchester Arndale', sentiment:'positive',
        transcriptSnippet:'…we saw +12% on Immunity once the end‑cap moved…',
        topics:['Display','Promo','OOS'] },
      { id:'CALL-1002', camName:'Tom Davies', date:'2025-10-09T14:10:00Z',
        storeName:'Waitrose Altrincham', sentiment:'neutral',
        transcriptSnippet:'…availability ok, but secondary placement pending…',
        topics:['Availability','Secondary placement'] }
    ]
  })
})

app.get('/nam/calls/CALL-1001', (req, res) => {
  res.json({
    id:'CALL-1001',
    camName:'Sarah Williams',
    managerName:'David Thompson',
    storeName:'Tesco Extra Manchester Arndale',
    type:'Coaching',
    date:'2025-10-10T09:30:00Z',
    durationMin:27,
    transcript:[
      { speaker:'Sarah', ts:'00:05', text:'Following up on last visit’s vitamin display…' },
      { speaker:'Manager', ts:'00:18', text:'We can move it closer to pharmacy this week.' },
      { speaker:'Sarah', ts:'01:03', text:'That typically adds 12–20%—I’ll share the playbook.' }
    ],
    analytics:{
      sentimentScore:0.78,
      questions:{ cam:7, manager:4 },
      interruptions:{ cam:1, manager:0 },
      talkRatio:{ cam:0.56, manager:0.44 },
      sentimentTimeline:[0.4,0.6,0.7,0.8,0.75,0.82,0.78],
      actionItems:[
        { text:'Reposition vitamin display to end‑cap', owner:'Store', due:'2025-10-16' },
        { text:'Escalate Boost Plus OOS to supply chain', owner:'KAM', due:'2025-10-15' }
      ],
      followUps:[
        { text:'Check lift after 2 weeks', when:'2025-10-28' }
      ],
      topicsConfidence:[
        { topic:'Display', confidence:0.92 },
        { topic:'OOS', confidence:0.88 },
        { topic:'Training', confidence:0.63 }
      ]
    },
    coachingNotesSuggested:'Good questioning; close with a dated next step next time.'
  })
})

app.get('/nam/explain', (req, res) => {
  const { metric, category, storeId } = req.query
  if (metric === 'revenue90d') {
    return res.json({
      title:'Revenue up 8.7% YoY (90d)',
      summary:'Lift driven by Immunity (+12%) and Adult Nutrition (+8%), concentrated in Tesco and Asda large formats.',
      drivers:['End‑cap compliance ↑','Reduced OOS on Boost Plus','Manager training completion ↑'],
      suggestions:['Replicate end‑cap playbook in 6 similar stores','Escalate OOS SLA breaches','Schedule refresher training for two lagging stores']
    })
  }
  if (metric === 'categoryMix' && category === 'Immunity') {
    return res.json({
      title:'Immunity +12%',
      summary:'End‑cap + proximity to pharmacy drove incremental pick‑ups.',
      drivers:['Secondary placement','Promo bundle','Shelf visibility'],
      suggestions:['Secure 2‑week end‑cap at Boots Liverpool One','Refresh shelf strips at Superdrug Market St']
    })
  }
  if (metric === 'store' && storeId === 'UK12345') {
    return res.json({
      title:'Tesco Extra Manchester · Playbook',
      summary:'Two actions executed; OOS reduced from 4→0 days; +£2.9k in 2 weeks.',
      drivers:['End‑cap','OOS resolution','Staff briefing'],
      suggestions:['Copy to 3 matched Tesco Extras','Track 14‑day lift']
    })
  }
  res.json({ title:'Insight', summary:'Demo default', drivers:[], suggestions:[] })
})

// ---------- KAM prep endpoints ----------
app.post('/kam/prep/start', (req, res) => {
  res.json({ jobId:'JOB-123' })
})
app.get('/kam/prep/JOB-123/status', (req, res) => {
  res.json({ status:'completed' })
})
app.get('/kam/prep/JOB-123/result', (req, res) => {
  res.json(makeBrief('UK12346', 'Boots Liverpool One', 'Sarah Mitchell', 'Boots', 'Flagship'))
})
app.get('/kam/intelligence/:storeId', (req, res) => {
  const { storeId } = req.params
  if (storeId === 'UK12345') {
    return res.json(makeBrief('UK12345','Tesco Extra Manchester Arndale','David Thompson','Tesco','Extra'))
  }
  res.json(makeBrief(storeId,'Demo Store','Store Manager','Retailer','Format'))
})

function makeBrief(id, name, manager, retailer, format){
  return {
    storeProfile:{ id, name, storeManager:manager, retailer, format },
    brief:{
      executiveSummary:`${name}: Immunity trending +12% WoW following display change. Two high‑impact actions identified; 1 critical risk to resolve (Boost Plus OOS).`,
      nextBestActions:[]
    },
    nextBestActions:[
      { priority:'HIGH', action:'Reposition vitamin display to end‑cap near pharmacy',
        expectedImpact:'+15–22% Immunity in 14 days',
        rationale:'Lift observed in 4 matched Tesco Extras last month (+£2.9k avg).' },
      { priority:'HIGH', action:'Resolve Boost Plus OOS via supply chain escalation',
        expectedImpact:'Recover ~£340/day',
        rationale:'4‑day OOS history with known demand; recoverable sales.' },
      { priority:'MEDIUM', action:'Manager training: new Adult Nutrition range',
        expectedImpact:'+5–8% over 30 days',
        rationale:'Stores with staff briefings converted 1.6x on new SKUs.' }
    ],
    riskAlerts:[
      { type:'OOS: Boost Plus', description:'4 days OOS; last delivery short‑shipped.' }
    ]
  }
}

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Demo server on http://localhost:${PORT}`))

