import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="hero">
        <h1>Post the job you wish existed.</h1>
        <p>
          The JOB Board is where dream jobs come to life. Describe work worth
          doing and find people who want to help make it real.
        </p>
        <div className="cta-group">
          <Link href="/post" className="btn btn-primary">Post a Dream Job</Link>
          <Link href="/jobs" className="btn btn-secondary">Browse Jobs</Link>
        </div>
      </div>
    </main>
  );
}
