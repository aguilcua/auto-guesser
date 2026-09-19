import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

// Load Inter, but assign it to Shadcn's expected --font-sans variable
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

export const metadata: Metadata = {
  title: "AutoGuesser",
  description: "An AI car guessing game powered by Naive Bayes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body 
        className={cn(
          "min-h-full flex flex-col bg-gray-950 font-sans antialiased",
          inter.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}