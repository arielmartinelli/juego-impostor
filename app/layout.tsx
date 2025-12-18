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
  title: "El Impostor",
  description: "Juego de mesa online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full min-h-screen flex flex-col items-center justify-center p-4`}
      >
        {/* HEADER */}
        <header className="mb-6 z-20 hover:scale-105 transition-transform duration-200">
          <div className="bg-yellow-400 text-black border-4 border-black px-8 py-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase drop-shadow-sm">
              EL IMPOSTOR
            </h1>
          </div>
        </header>

        {/* CONTENEDOR TABLERO (CAMBIOS AQUÍ) 
            1. Quitamos h-full y max-h-[85vh]
            2. Ponemos h-auto para que se encoja
            3. Añadimos min-h-[300px] para que no sea diminuto
        */}
        <main className="game-board-container w-full max-w-sm md:max-w-md h-auto min-h-[300px] relative transition-all duration-300">
            
            {/* Tornillos decorativos */}
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full border-2 border-black bg-gray-200 shadow-sm z-20"></div>
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-black bg-gray-200 shadow-sm z-20"></div>
            <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full border-2 border-black bg-gray-200 shadow-sm z-20"></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full border-2 border-black bg-gray-200 shadow-sm z-20"></div>

            {/* Contenido con padding generoso */}
            <div className="w-full h-full relative z-10 p-6 md:p-8 flex flex-col justify-center">
              {children}
            </div>

        </main>

        <footer className="mt-6 text-black/70 font-bold text-xs tracking-widest bg-white/50 px-3 py-1 rounded-full border border-black/10">
           v3.1 • Compact Edition
        </footer>

      </body>
    </html>
  );
}