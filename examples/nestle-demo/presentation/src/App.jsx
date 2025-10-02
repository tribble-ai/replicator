import { useState } from 'react'
import './App.css'

// Slide Components
import Slide1_Title from './components/Slide1_Title'
import Slide2_Challenge from './components/Slide2_Challenge'
import Slide3_Solution from './components/Slide3_Solution'
import Slide4_Platform from './components/Slide4_Platform'
import Slide5_Demo from './components/Slide5_Demo'
import Slide6_Impact from './components/Slide6_Impact'
import Slide7_Next from './components/Slide7_Next'

const slides = [
  { id: 1, component: Slide1_Title, title: 'Title' },
  { id: 2, component: Slide2_Challenge, title: 'The Challenge' },
  { id: 3, component: Slide3_Solution, title: 'The Solution' },
  { id: 4, component: Slide4_Platform, title: 'Platform Architecture' },
  { id: 5, component: Slide5_Demo, title: 'Demo Overview' },
  { id: 6, component: Slide6_Impact, title: 'Business Impact' },
  { id: 7, component: Slide7_Next, title: 'Next Steps' }
]

function App() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const next = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  const prev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0))
  const goTo = (index) => setCurrentSlide(index)

  const CurrentSlideComponent = slides[currentSlide].component

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') next()
    else if (e.key === 'ArrowLeft') prev()
  }

  return (
    <div className="presentation" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="slide-container">
        <CurrentSlideComponent />
      </div>

      {/* Navigation */}
      <div className="nav-controls">
        <button onClick={prev} disabled={currentSlide === 0} className="nav-btn">
          ← Prev
        </button>
        <div className="slide-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goTo(index)}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              title={slide.title}
            />
          ))}
        </div>
        <button onClick={next} disabled={currentSlide === slides.length - 1} className="nav-btn">
          Next →
        </button>
      </div>

      {/* Slide counter */}
      <div className="slide-counter">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  )
}

export default App
