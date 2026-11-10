import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Education } from './components/Education'
import { Stack } from './components/Stack'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { useTheme } from './hooks/useTheme'
import { useReveal } from './hooks/useReveal'

export default function App() {
  const { theme, toggle } = useTheme()
  useReveal()

  return (
    <>
      <a className="skip-link" href="#work">Skip to content</a>
      <Header theme={theme} onToggleTheme={toggle} />
      <main>
        <Hero dark={theme === 'dark'} />
        <Work />
        <About />
        <Experience />
        <Education />
        <Stack />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
