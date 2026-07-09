import type {Metadata} from 'next';
import { Inter, Baloo_2 } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const baloo2 = Baloo_2({ subsets: ['latin'], variable: '--font-baloo2', weight: ['400','500','600','700','800'] });

export const metadata: Metadata = {
  title: 'Edunura Admin',
  description: 'Event and community management platform dashboard.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${baloo2.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#F5F6FA] text-slate-800">{children}</body>
    </html>
  );
}
