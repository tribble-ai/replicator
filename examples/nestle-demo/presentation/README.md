# Tribble for Nestlé - Executive Presentation

A 7-slide React-based presentation deck for the Nestlé field sales intelligence demo.

## Overview

This presentation sets up the context for the mobile demo, addressing Nestlé's specific challenges and showcasing how Tribble's AI platform solves them.

## Slide Structure

1. **Title** - Intelligence Where Your Teams Work
2. **The Challenge** - 6 pain points KAMs face daily
3. **The Solution** - How Tribble orchestrates without replacing
4. **Platform Architecture** - Decoupled innovation layer
5. **Demo Overview** - 3 personas (NAM, KAM, Market) + Teams chat
6. **ROI** - Retail Execution & KAM Productivity (Nestlé UK)
7. **Business Impact** - Competitive advantages and outcomes
8. **Next Steps** - 4-week pilot program

## Running the Presentation

```bash
cd presentation
npm install
npm run dev
```

Open http://localhost:3001

### Options

- Exec cut (7 slides): append `?deck=exec` to the URL
- Deep link to a slide: `?s=5` (or `#/5`)
- Toggle print mode: press `p` (or use `?print`)
- Brand theme: `?brand=nestle` (uses :root[data-brand="nestle"])

## Navigation

- **Arrow Keys / Page Up/Down**: Next/Previous slide
- **Spacebar**: Next slide
- **Home/End**: First/Last slide
- **P**: Toggle print layout
- **Click indicators**: Jump to specific slide

## Design System

Based on Tribble branding:
- **Primary Color**: `#3263E9` (Tribble Blue)
- **Background**: `#0b1220` (Dark Ink)
- **Typography**: Inter font family
- **Theme**: Dark mode with gradient accents

Overrides for Nestlé:
- When `?brand=nestle` is set, :root CSS variables switch `--brand-primary` to `#165C96`.

## Demo Flow

1. **Slides 1-4**: Set up context (challenges, solution, architecture)
2. **Slide 5**: Transition point - switch to mobile demo app
3. **Show mobile + Teams**: Walk NAM and KAM flows on mobile and punch out to Tribble in Microsoft Teams; show Market desktop analytics
4. **Slides 6-7**: Return to presentation (impact, next steps)

## Key Messages

- **Decoupled Innovation**: Frontend agility, backend stability
- **Zero Disruption**: Tribble sits on top of existing systems
- **Rapid Iteration**: 2-week UX cycles vs 6-month projects
- **Proof-Backed Actions**: Every recommendation has evidence
- **Compounding Intelligence**: Gets smarter every day

## Customization

All slide content is in `/src/components/Slide[N]_[Name].jsx`. Edit directly to update messaging, add client-specific details, or adjust emphasis based on audience.
