import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Fragment_Mono, Instrument_Serif, Montserrat, Roboto_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-badge",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Kue",
  title: "Kue — one catalog for everything you watch, play & read",
  description:
    "Kue tracks films, series, games, anime and manga in a single index — format-aware progress, statuses, ratings and stats. Synced from TMDB, AniList and IGDB.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${instrumentSerif.variable} ${fragmentMono.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="kue-theme"
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
