import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineNova — A New World of Entertainment",
  description: "Discover movies and series with CineNova.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}