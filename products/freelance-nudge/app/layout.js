import "./globals.css";

export const metadata = {
  title: "Freelance Nudge",
  description: "Track invoices and generate reminders that get you paid faster"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
