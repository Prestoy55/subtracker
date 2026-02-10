import "./globals.css";

export const metadata = {
  title: "SubTracker — Subscription Manager",
  description: "Track your subscriptions, get renewal reminders, and never miss a cancellation deadline again.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
