import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'The JOB Board',
  description: 'Post the job you wish existed.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/" className="logo">The JOB Board</Link>
          <div className="links">
            <Link href="/">Home</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/post">Post a Job</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
