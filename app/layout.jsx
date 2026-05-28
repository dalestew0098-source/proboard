import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "ProBoard — Find Local Trade Contractors",
  description: "Find verified local contractors for every trade. HVAC, roofing, plumbing, electrical, landscaping and more. Free to list, free to post jobs.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
