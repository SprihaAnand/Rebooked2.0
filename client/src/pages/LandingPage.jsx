import { Link } from "react-router-dom";
import {
  FiArrowRight as ArrowRight,
  FiBookOpen as BookHeart,
  FiBookOpen as BookOpenCheck,
  FiHome as Building2,
  FiHeart as HeartHandshake,
  FiMapPin as MapPin,
  FiBookOpen as School,
  FiShield as ShieldCheck,
  FiStar as Sparkles,
} from "react-icons/fi";
import { useAuth } from "../auth/AuthContext";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const primaryTo = isAuthenticated ? "/dashboard" : "/register";

  return (
    <div className="landing">
      <header className="landing-nav page-width">
        <Link to="/" className="brand"><BookHeart aria-hidden="true" /><span>rebooked</span></Link>
        <nav aria-label="Public navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-organisations">For organisations</a>
        </nav>
        <div className="landing-nav__actions">
          {isAuthenticated ? <Link className="text-link" to="/dashboard">Your dashboard</Link> : <Link className="text-link" to="/login">Sign in</Link>}
          <Link className="button button--small" to={primaryTo}>{isAuthenticated ? "Open workspace" : "Join Rebooked"}</Link>
        </div>
      </header>

      <main>
        <section className="hero page-width">
          <div className="hero__copy">
            <p className="hero__eyebrow"><Sparkles aria-hidden="true" /> Books deserve another beginning</p>
            <h1>Pass knowledge on. <em>Make room</em> for possibility.</h1>
            <p className="hero__lede">Rebooked helps donors place great books directly with schools and NGOs that can put them to work.</p>
            <div className="hero__actions">
              <Link className="button button--large" to={primaryTo}>{isAuthenticated ? "Go to your dashboard" : "Donate books"} <ArrowRight aria-hidden="true" /></Link>
              {!isAuthenticated && <Link className="button button--outline button--large" to="/register?role=school">I represent a school or NGO</Link>}
            </div>
            <div className="hero__trust"><ShieldCheck aria-hidden="true" /><span>Purpose-built for thoughtful, local handovers.</span></div>
          </div>
          <div className="hero__art" aria-label="Illustration of books being shared">
            <div className="hero__sun" />
            <div className="hero__book-stack hero__book-stack--one"><span>Stories</span></div>
            <div className="hero__book-stack hero__book-stack--two"><span>Science</span></div>
            <div className="hero__book-stack hero__book-stack--three"><span>Ideas</span></div>
            <div className="hero__note"><HeartHandshake aria-hidden="true" /><span>Shared with care</span></div>
          </div>
        </section>

        <section id="how-it-works" className="process-section page-width">
          <div className="section-heading"><p className="eyebrow">A calmer way to give</p><h2>From shelf to student in three simple steps.</h2></div>
          <div className="process-grid">
            <article><span>01</span><BookHeart aria-hidden="true" /><h3>List your books</h3><p>Add a few useful details, choose a pickup location, and decide how many copies you can share.</p></article>
            <article><span>02</span><Building2 aria-hidden="true" /><h3>Meet a real need</h3><p>Verified schools and NGOs find the donation and reserve the copies their learners can use.</p></article>
            <article><span>03</span><BookOpenCheck aria-hidden="true" /><h3>Complete the handover</h3><p>Coordinate pickup with clarity, then see the good your books have set in motion.</p></article>
          </div>
        </section>

        <section id="for-organisations" className="roles-section">
          <div className="page-width roles-section__inner">
            <div className="section-heading"><p className="eyebrow">Made for the whole giving circle</p><h2>Everyone sees exactly what they need.</h2></div>
            <div className="role-cards">
              <article className="role-card role-card--donor"><BookHeart aria-hidden="true" /><h3>Donors</h3><p>Turn a pile of loved books into a meaningful, trackable gift.</p><Link to={isAuthenticated ? "/donations/new" : "/register?role=donor"}>Start a donation <ArrowRight aria-hidden="true" /></Link></article>
              <article className="role-card role-card--school"><School aria-hidden="true" /><h3>Schools & NGOs</h3><p>Browse available books, request the right quantity, and manage collection in one place.</p><Link to={isAuthenticated ? "/books" : "/register?role=school"}>Find books <ArrowRight aria-hidden="true" /></Link></article>
              <article className="role-card role-card--community"><MapPin aria-hidden="true" /><h3>Local communities</h3><p>Simple pickup details keep every handover practical, personal, and close to home.</p><span>Designed for real-world sharing</span></article>
            </div>
          </div>
        </section>

        <section className="closing-cta page-width">
          <div><p className="eyebrow">One more chapter</p><h2>Give books their next reader.</h2><p>Whether you are clearing a shelf or stocking a library, there is a better way to share what matters.</p></div>
          <Link className="button button--light button--large" to={primaryTo}>Get started <ArrowRight aria-hidden="true" /></Link>
        </section>
      </main>
      <footer className="landing-footer page-width"><Link to="/" className="brand"><BookHeart aria-hidden="true" /><span>rebooked</span></Link><span>Books, kept in motion.</span></footer>
    </div>
  );
};

export default LandingPage;
