import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, DM_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const sans = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Sejukin — Jadwal service AC tanpa bentrok", template: "%s · Sejukin" },
  description:
    "Aplikasi pencatat janji service AC buat perusahaan teknisi: jadwal per teknisi, anti tumpang tindih, pengingat WhatsApp, riwayat pelanggan, dan servis berkala.",
  robots: { index: false },
};

export const viewport: Viewport = { themeColor: "#f3f0e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
