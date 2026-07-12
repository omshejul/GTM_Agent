import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Warehouse Expansion Intelligence", description: "Evidence-grounded buying-window intelligence" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
