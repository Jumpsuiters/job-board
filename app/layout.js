import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import Nav from '../components/Nav';

export const metadata = {
  title: 'The JOB Board',
  description: 'Post the job you wish existed.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
