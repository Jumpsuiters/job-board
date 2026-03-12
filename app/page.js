import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="hero">
        <h1>What if your dream job already existed?</h1>
        <p>
          It doesn&apos;t. Yet. That&apos;s why you&apos;re here. Post the job you wish
          someone would pay you to do. Or fund someone else&apos;s wildest career
          idea into existence. This is where unserious job titles get serious money.
        </p>
        <div className="cta-group">
          <Link href="/post" className="btn btn-primary">Make Up a Job</Link>
          <Link href="/jobs" className="btn btn-secondary">See What People Dreamed Up</Link>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How this works (it&apos;s not complicated)</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Dream it up</h3>
            <p>Describe a job that doesn&apos;t exist but absolutely should. Be weird about it.</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Fund the dream</h3>
            <p>People chip in to pay the salary. When the goal hits, someone actually gets hired.</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Make it real</h3>
            <p>Someone raises their hand, gets the gig, does the work. A dream job now exists.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
