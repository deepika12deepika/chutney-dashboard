import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Credentials Management Dashboard',
  description: 'Enterprise Client Platform Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}