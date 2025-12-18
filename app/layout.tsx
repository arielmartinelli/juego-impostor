import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://juego-impostor.vercel.app'), 
  title: "IMPOSTOR ARCADE",
  description: "Descubre al glitch en el sistema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col items-center justify-center min-h-screen p-4`}
      >
        {/* HEADER ARCADE */}
        <header className="mb-8 z-20 text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] italic transform -skew-x-12">
            IMPOSTOR
          </h1>
          <p className="text-cyan-400 font-mono text-xs tracking-[0.5em] mt-2 animate-pulse">
            SYSTEM READY
          </p>
        </header>

        {/* CONTENEDOR TIPO PANTALLA CRT */}
        <main className="arcade-container w-full max-w-md md:max-w-lg lg:max-w-2xl p-6 md:p-8 relative">
            
            {/* Decoración "Scanline" sutil */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

            {/* CONTENIDO DEL JUEGO */}
            <div className="relative z-10 w-full h-full">
              {children}
            </div>

        </main>

        <footer className="mt-8 text-cyan-600 font-mono text-[10px] tracking-widest">
           INSERT COIN TO PLAY • v2.0 ARCADE
        </footer>

      </body>
    </html>
  );
}