import type { Metadata, Viewport } from "next";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HostReport",
    template: "%s | HostReport"
  },
  description:
    "Mobile-first reporting preparation for Airbnb income, expenses, receipts and allocation assumptions.",
  applicationName: "HostReport",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e7169"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
