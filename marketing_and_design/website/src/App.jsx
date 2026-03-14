import './App.css';

const features = [
  {
    title: 'Mic intelligence',
    description:
      'Ambient microphones read room energy—cheers, chatter, silence. That signal tells AtmosAI when the crowd is alive, flat, or somewhere in between.',
    icon: '🎤',
  },
  {
    title: 'Camera vision',
    description:
      'On-venue cameras estimate presence and attention without identifying individuals. We pair sight with sound so analytics reflect what’s really happening in the room.',
    icon: '📷',
  },
  {
    title: 'Analytics → ads',
    description:
      'Noise level, crowd density, and event context feed a live model. Screens show the right promotion when attention is high—or intervention content when it’s not.',
    icon: '📊',
  },
  {
    title: 'Quiet room boost',
    description:
      'When noise drops too low, AtmosAI doesn’t wait. It launches trivia, polls, or quick games on the big screen so the room wakes up before the energy flatlines.',
    icon: '🔊',
  },
  {
    title: 'Game-night mode',
    description:
      'On game nights, schedules and crowd spikes line up with wings, buckets, and beer promos—timed to big plays and commercial breaks so ads feel native, not random.',
    icon: '🏀',
  },
  {
    title: 'Unified screens',
    description:
      'Every display stays in sync: same pulse from the crowd, same moment to switch creative. One venue, one brain.',
    icon: '🔄',
  },
];

function App() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner page">
          <span className="logo-text">AtmosAI</span>
          <div className="nav-links">
            <a href="#sense">Sense</a>
            <a href="#moments">Moments</a>
            <a href="#features">Platform</a>
          </div>
          <a href="#contact" className="nav-cta">
            Get in touch
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-visual" aria-hidden="true">
          <div className="wave-wrap">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <div className="hero-orbs">
            <span className="orb orb-a" />
            <span className="orb orb-b" />
          </div>
        </div>
        <span className="hero-badge">Microphone · Camera · Venue intelligence</span>
        <h1>
          TVs can <span className="highlight">feel the crowd</span>
        </h1>
        <p className="hero-sub">
          AtmosAI listens and watches—then turns every screen into a live canvas of ads, games, and promotions that match how loud, how full, and how electric the room really is.
        </p>
        <div className="hero-cta-row">
          <a href="#sense" className="btn-primary">
            How we sense the room
          </a>
          <a href="#moments" className="btn-secondary">
            Quiet nights & game nights
          </a>
        </div>
      </header>

      <section className="section sense-section" id="sense">
        <div className="section-header">
          <p className="section-tag">Sense layer</p>
          <h2 className="section-title">Audio + vision, in sync</h2>
          <p className="section-desc">
            We don’t guess—we measure. Microphones capture noise and crowd energy; cameras estimate how packed and how attentive the space is. Together they fuel smarter ads and smarter moments.
          </p>
        </div>
        <div className="sense-bento page">
          <article className="sense-card sense-card--wide">
            <div className="sense-card__visual sense-card__visual--audio">
              <div className="mini-wave">
                {[...Array(20)].map((_, i) => (
                  <span key={i} className="mini-bar" style={{ height: `${12 + (i % 5) * 8}px` }} />
                ))}
              </div>
            </div>
            <h3>Microphones</h3>
            <p>
              Room-level audio tells us if the crowd is roaring, murmuring, or dead quiet. Low energy doesn’t mean “do nothing”—it means trivia, polls, and sparks to pull people back in.
            </p>
          </article>
          <article className="sense-card sense-card--tall">
            <div className="sense-card__visual sense-card__visual--cam">
              <div className="cam-grid">
                {[...Array(9)].map((_, i) => (
                  <span key={i} className={`cam-cell ${i === 4 ? 'cam-cell--hot' : ''}`} />
                ))}
              </div>
            </div>
            <h3>Cameras</h3>
            <p>
              Vision augments audio: how full is the bar? Is attention on the screens? Anonymous, aggregate cues keep promotions and takeover content grounded in real behavior—not the clock alone.
            </p>
          </article>
          <article className="sense-card sense-card--accent">
            <h3>Analytics → appropriate ads</h3>
            <p>
              When energy spikes, we surface high-impact promos and sponsor moments. When it’s flat, we switch to participation—then back to revenue when the room catches fire again.
            </p>
          </article>
        </div>
      </section>

      <section className="section moments-section" id="moments">
        <div className="moments-bg" aria-hidden="true" />
        <div className="page moments-inner">
          <div className="moments-split">
            <article className="moment-card moment-card--quiet">
              <span className="moment-label">When noise is low</span>
              <h2>Wake the room</h2>
              <p>
                Silence isn’t failure—it’s a signal. AtmosAI detects when the room is too quiet and kicks in <strong>trivia, live polls, and quick mobile games</strong> on the big screens so energy comes back before people leave.
              </p>
              <ul className="moment-list">
                <li>Auto trivia between periods or innings</li>
                <li>Polls tied to the game or the venue</li>
                <li>Phone-based play—no extra hardware</li>
              </ul>
            </article>
            <article className="moment-card moment-card--game">
              <span className="moment-label">Game nights</span>
              <h2>Promotions that match the night</h2>
              <p>
                On game nights, context matters. We align wings, buckets, drink specials, and sponsor spots with crowd spikes, breaks, and the flow of the broadcast—so promos feel part of the night, not an interruption.
              </p>
              <ul className="moment-list">
                <li>Timed deals around commercial breaks</li>
                <li>Crowd-aware creative when the bar erupts</li>
                <li>Advertisers see engagement tied to real moments</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section pitch" id="how-it-works">
        <div className="pitch-inner page">
          <p>
            AtmosAI turns microphones and cameras into a live picture of the venue—then uses that picture to choose what belongs on every screen: ads when attention is high, games when the room needs a lift, and game-night promos when the schedule and the crowd line up.
          </p>
          <p className="pitch-tagline">
            More engagement for guests. More impact and analytics for venues and brands.
          </p>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-header">
          <p className="section-tag">Platform</p>
          <h2 className="section-title">Everything that makes it work</h2>
          <p className="section-desc">
            From sensors to sync—built so every screen behaves like one intelligent display network.
          </p>
        </div>
        <div className="features page">
          {features.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-section" id="contact">
        <div className="cta-box">
          <h2>Ready to hear—and see—your crowd?</h2>
          <p>
            Bring mic + camera intelligence to your venue. Show the right ads at the right noise, and never let a dead room stay dead for long.
          </p>
          <a href="#" className="btn-primary">
            Request a demo
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>AtmosAI — TVs can feel the crowd. © 2026</p>
      </footer>
    </>
  );
}

export default App;
