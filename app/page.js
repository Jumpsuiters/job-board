import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="hero">
        <h1>Post the job you wish existed.</h1>
        <p>
          Dream jobs don't come from job boards. They come from people who
          imagine work worth doing — and other people who show up to make it real.
        </p>
        <div className="cta-group">
          <Link href="/post" className="btn btn-primary">Post a Dream Job</Link>
          <Link href="/jobs" className="btn btn-secondary">Browse Jobs</Link>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Dream it</h3>
            <p>Post a job that should exist. Describe work worth doing.</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Fund it</h3>
            <p>People pledge money to make the dream job real.</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Fill it</h3>
            <p>Someone applies, gets hired, and gets paid to do the work.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
