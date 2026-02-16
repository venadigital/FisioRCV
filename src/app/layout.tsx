import type { Metadata } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import { RecoveryTokenRedirect } from "@/components/auth/recovery-token-redirect";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FisioAPP",
  description: "Plataforma clínica para fisioterapia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sora.variable} ${sourceSans.variable} bg-slate-50 text-slate-900 antialiased`}>
        <RecoveryTokenRedirect />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
