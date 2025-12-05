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
  description: "Juego de mesa 3D",
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
        {/* HEADER: Título ÚNICO del juego */}
        <header className="mb-6 z-20">
          <div className="bg-yellow-400 text-black border-4 border-black px-10 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-transform">
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              EL IMPOSTOR
            </h1>
          </div>
        </header>

        {/* CONTENEDOR TIPO TABLERO (WHITEBOARD) */}
        {/* Ajustado a max-w-2xl en pantallas grandes para que se vea compacto */}
        <main className="game-board-container w-full max-w-md md:max-w-lg lg:max-w-2xl p-8 relative bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Tornillos decorativos en las esquinas */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-full border-2 border-black bg-gray-300"></div>
            <div className="absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-black bg-gray-300"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full border-2 border-black bg-gray-300"></div>
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full border-2 border-black bg-gray-300"></div>

            {/* Aquí se renderiza tu page.tsx */}
            <div className="w-full h-full relative z-10">
              {children}
            </div>

        </main>

        <footer className="mt-8 text-black font-bold opacity-60 text-xs">
           v1.0 • Edición Tablero
        </footer>

      </body>
    </html>
  );
}