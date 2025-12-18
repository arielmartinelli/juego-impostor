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
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-dvh flex flex-col items-center justify-center p-2 sm:p-4`}
      >
        {/* HEADER COMPACTO: Se encoge si la pantalla es chica */}
        <header className="mb-2 sm:mb-4 shrink-0 z-20">
          <div className="bg-yellow-400 text-black border-4 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase">
              EL IMPOSTOR
            </h1>
          </div>
        </header>

        {/* CONTENEDOR TABLERO: Ocupa todo el espacio restante (flex-1) pero con límite */}
        <main className="game-board-container w-full max-w-md h-full max-h-[85vh] p-4 relative">
            
            {/* Tornillos decorativos (más pequeños) */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full border border-black bg-gray-300"></div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-black bg-gray-300"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full border border-black bg-gray-300"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-black bg-gray-300"></div>

            {/* Contenido con scroll interno SOLO si es absolutamente necesario */}
            <div className="w-full h-full relative z-10 flex flex-col overflow-y-auto no-scrollbar">
              {children}
            </div>

        </main>

        <footer className="mt-2 text-black font-bold opacity-60 text-[10px] shrink-0">
           v3.0 • Compact Edition
        </footer>

      </body>
    </html>
  );
}