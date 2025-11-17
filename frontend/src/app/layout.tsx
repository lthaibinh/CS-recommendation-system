import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { Viewport } from "next";
import "./index.css";
import { Analytics } from "@vercel/analytics/next"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en">
      <Analytics />
      <body className={inter.className}>
          <div>{children}</div>
      </body>
    </html>
  );
}
