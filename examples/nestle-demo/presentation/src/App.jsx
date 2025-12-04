import { useEffect, useRef, useState } from 'react'
import './App.css'

// Slide Components
import Slide1_Title from './components/Slide1_Title'
import Slide2_Challenge from './components/Slide2_Challenge'
import Slide2_Stakeholders from './components/Slide2_Stakeholders'
import Slide3_Meeting from './components/Slide3_Meeting'
import Slide4_Storyline from './components/Slide4_Storyline'
import Slide3_Solution from './components/Slide3_Solution'
import Slide4_Platform from './components/Slide4_Platform'
import Slide5_Demo from './components/Slide5_Demo'
import Slide6_ROI from './components/Slide6_ROI'
import Slide6_Impact from './components/Slide6_Impact'
import Slide7_Next from './components/Slide7_Next'
import Slide8_PilotPlan from './components/Slide8_PilotPlan'
import Slide10_Objections from './components/Slide10_Objections'

// Exec-cut slides (7-slide streamlined deck)
import Exec1_WhyNow from './components/Exec1_WhyNow'
import Exec2_What from './components/Exec2_What'
import Exec3_How from './components/Exec3_How'
import Exec4_LiveFlow from './components/Exec4_LiveFlow'
import Exec5_Pilot from './components/Exec5_Pilot'
import Exec6_ROI_Exec from './components/Exec6_ROI'
import Exec7_Decision from './components/Exec7_Decision'

const fullSlides = [
  { id: 1, component: Slide1_Title, title: 'Title' },
  { id: 2, component: Slide2_Stakeholders, title: 'Who Cares' },
  { id: 3, component: Slide4_Storyline, title: 'Storyline' },
  { id: 4, component: Slide3_Meeting, title: 'Meeting Plan' },
  { id: 5, component: Slide2_Challenge, title: 'The Challenge' },
  { id: 6, component: Slide3_Solution, title: 'The Solution' },
  { id: 7, component: Slide4_Platform, title: 'Platform Architecture' },
  { id: 8, component: Slide5_Demo, title: 'Live Demo' },
  { id: 9, component: Slide8_PilotPlan, title: 'Pilot Plan' },
  { id: 10, component: Slide6_ROI, title: 'ROI' },
  { id: 11, component: Slide6_Impact, title: 'Business Impact' },
  { id: 12, component: Slide10_Objections, title: 'Objections' },
  { id: 13, component: Slide7_Next, title: 'Next Steps' }
]

const execSlides = [
  { id: 1, component: Slide1_Title, title: 'Title' },
  { id: 2, component: Exec1_WhyNow, title: 'Why Now' },
  { id: 3, component: Exec2_What, title: 'What Tribble Does' },
  { id: 4, component: Exec3_How, title: 'How It Works' },
  { id: 5, component: Exec4_LiveFlow, title: 'Live Flow' },
  { id: 6, component: Exec5_Pilot, title: 'Pilot Plan' },
  { id: 7, component: Exec6_ROI_Exec, title: 'ROI' },
  { id: 8, component: Exec7_Decision, title: 'Next Steps' }
]

function FitToStage({ currentSlide, children }) {
  const stageRef = useRef(null)
  const contentRef = useRef(null)
  const [style, setStyle] = useState({ transform: 'none', transformOrigin: 'top left' })

  const compute = () => {
    const stage = stageRef.current
    const content = contentRef.current
    if (!stage || !content) return

    // Measure natural content size (scroll* includes padding/content)
    const cw = content.scrollWidth || content.offsetWidth
    const ch = content.scrollHeight || content.offsetHeight
    const sw = stage.clientWidth
    const sh = stage.clientHeight

    if (!cw || !ch || !sw || !sh) return

    const scale = Math.min(1, sw / cw, sh / ch)
    const offsetX = Math.max(0, (sw - cw * scale) / 2)
    const offsetY = Math.max(0, (sh - ch * scale) / 2)
    setStyle({ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: 'top left' })
  }

  useEffect(() => {
    compute()
    const onResize = () => compute()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Recompute after slide changes and next frame to ensure fonts/layout applied
    requestAnimationFrame(() => compute())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide])

  return (
    <div ref={stageRef} className="slide-stage">
      <div className="fit-wrap" style={style}>
        <div ref={contentRef} className="slide">
          {children}
        </div>
      </div>
    </div>
  )
}

function App() {
  // Choose deck based on ?deck=exec
  const deck = (() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return (params.get('deck') || '').toLowerCase() === 'exec' ? execSlides : fullSlides
    } catch {
      return fullSlides
    }
  })()

  const clampIndex = (i) => Math.max(0, Math.min(deck.length - 1, i))

  const [currentSlide, setCurrentSlide] = useState(() => {
    try {
      const url = new URL(window.location.href)
      const fromQuery = url.searchParams.get('s')
      const fromHash = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : null
      const raw = fromQuery ?? fromHash
      const idx = Number.parseInt(raw ?? '', 10)
      return Number.isFinite(idx) ? clampIndex(idx) : 0
    } catch {
      return 0
    }
  })
  const [printMode, setPrintMode] = useState(() => {
    try { return new URLSearchParams(window.location.search).has('print') } catch { return false }
  })

  const next = () => setCurrentSlide((prev) => clampIndex(prev + 1))
  const prev = () => setCurrentSlide((prev) => clampIndex(prev - 1))
  const goTo = (index) => setCurrentSlide(clampIndex(index))

  const CurrentSlideComponent = deck[currentSlide].component

  // Sync URL with current slide
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('s', String(currentSlide))
      window.history.replaceState(null, '', url.toString())
    } catch {}
  }, [currentSlide])

  // Hash-based navigation and print param sync
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.startsWith('#/') ? Number.parseInt(window.location.hash.slice(2), 10) : NaN
      if (Number.isFinite(h)) setCurrentSlide(clampIndex(h))
    }
    const onPop = () => {
      try { setPrintMode(new URLSearchParams(window.location.search).has('print')) } catch {}
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  // Keyboard navigation + print toggle
  const handleKeyDown = (e) => {
    const k = e.key
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') next()
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === 'Backspace' && !e.target.isContentEditable)) prev()
    else if (k === 'Home') goTo(0)
    else if (k === 'End') goTo(deck.length - 1)
    else if (k.toLowerCase && k.toLowerCase() === 'p') {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.has('print')) url.searchParams.delete('print')
        else url.searchParams.set('print', '1')
        window.history.replaceState(null, '', url.toString())
        window.dispatchEvent(new PopStateEvent('popstate'))
      } catch {}
    }
  }

  return (
    <div className="presentation" onKeyDown={handleKeyDown} tabIndex={0}>
      {printMode ? (
        <div className="slide-container">
          <div className="print-grid" style={{ width: '100%' }}>
            {deck.map((s, i) => {
              const Comp = s.component
              return (
                <div className="print-slide" key={s.id}>
                  <div className="slide-stage">
                    <div className="slide">
                      <Comp />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="slide-container">
            <FitToStage currentSlide={currentSlide}>
              <CurrentSlideComponent />
            </FitToStage>
          </div>

          {/* Navigation */}
          <div className="nav-controls">
            <button aria-label="Previous slide" onClick={prev} disabled={currentSlide === 0} className="nav-btn">
              ← Prev
            </button>
            <div className="slide-indicators">
              {deck.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goTo(index)}
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  title={slide.title}
                />
              ))}
            </div>
            <button aria-label="Next slide" onClick={next} disabled={currentSlide === deck.length - 1} className="nav-btn">
              Next →
            </button>
          </div>

          {/* Slide counter */}
          <div className="slide-counter" aria-live="polite">
            {currentSlide + 1} / {deck.length}
          </div>
        </>
      )}
    </div>
  )
}

export default App
