# Tribble for Nestlé - Executive Presentation

A 7-slide React-based presentation deck for the Nestlé field sales intelligence demo.

## Overview

This presentation sets up the context for the mobile demo, addressing Nestlé's specific challenges and showcasing how Tribble's AI platform solves them.

## Slide Structure

1. **Title** - Intelligence Where Your Teams Work
2. **The Challenge** - 6 pain points KAMs face daily
3. **The Solution** - How Tribble orchestrates without replacing
4. **Platform Architecture** - Decoupled innovation layer
5. **Demo Overview** - 3 pillars (pause here to show mobile app)
6. **Business Impact** - ROI and competitive advantages
7. **Next Steps** - 4-week pilot program

## Running the Presentation

```bash
cd presentation
npm install
npm run dev
```

Open http://localhost:3001

## Navigation

- **Arrow Keys**: Next/Previous slide
- **Spacebar**: Next slide
- **Click indicators**: Jump to specific slide

## Design System

Based on Tribble branding:
- **Primary Color**: `#3263E9` (Tribble Blue)
- **Background**: `#0b1220` (Dark Ink)
- **Typography**: Inter font family
- **Theme**: Dark mode with gradient accents

## Demo Flow

1. **Slides 1-4**: Set up context (challenges, solution, architecture)
2. **Slide 5**: Transition point - switch to mobile demo app
3. **Show mobile app**: Demonstrate 3 pillars on actual device
4. **Slides 6-7**: Return to presentation (impact, next steps)

## Key Messages

- **Decoupled Innovation**: Frontend agility, backend stability
- **Zero Disruption**: Tribble sits on top of existing systems
- **Rapid Iteration**: 2-week UX cycles vs 6-month projects
- **Proof-Backed Actions**: Every recommendation has evidence
- **Compounding Intelligence**: Gets smarter every day

## Customization

All slide content is in `/src/components/Slide[N]_[Name].jsx`. Edit directly to update messaging, add client-specific details, or adjust emphasis based on audience.
