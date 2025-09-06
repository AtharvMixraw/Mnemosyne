import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from './contexts/ProfileContext'
import { Analytics } from '@vercel/analytics/next';
import { DataProvider } from "./contexts/DataContext";
import { SpeedInsights } from '@vercel/speed-insights/next';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mnemosyne – Read Interview Experiences",
  description: "A collaborative platform where students share their interview experiences.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },   
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DataProvider>
          <ProfileProvider>
            {children}
            <Analytics />
            <SpeedInsights />
          </ProfileProvider>
        </DataProvider>
      </body>
    </html>
  );
}