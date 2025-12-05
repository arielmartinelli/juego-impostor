"use client"; // Esto es obligatorio para usar interactividad (botones)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "./firebase"; // Importamos tu base de datos
import { ref, set, get, child } from "firebase/database";

export default function Home() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");

  // Función para CREAR una sala nueva
  const crearSala = async () => {
    if (!nombre) return alert("¡Escribe tu nombre primero!");

    // Generamos un código de 4 letras al azar (Ej: AE4X)
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Guardamos la sala en Firebase
    await set(ref(db, 'salas/' + codigo), {
      estado: 'ESPERANDO',
      host: nombre, // El creador es el host
      jugadores: {
        [nombre]: { nombre: nombre, esHost: true }
      }
    });

    // Nos vamos a la pantalla de juego (que crearemos luego)
    router.push(`/juego/${codigo}?nombre=${nombre}`);
  };

  // Función para UNIRSE a una sala existente
  const unirseSala = async () => {
    if (!nombre || !salaId) return alert("Completa nombre y código");

    const salaRef = ref(db);
    const snapshot = await get(child(salaRef, `salas/${salaId.toUpperCase()}`));

    if (snapshot.exists()) {
      // Si la sala existe, nos vamos para allá
      router.push(`/juego/${salaId.toUpperCase()}?nombre=${nombre}`);
    } else {
      alert("Esa sala no existe 😢");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">🕵️ IMPOSTOR</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        
        {/* Input Nombre */}
        <div>
          <label className="block text-sm mb-1">Tu Nombre</label>
          <input 
            type="text" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-yellow-500"
            placeholder="Ej: Ariel"
          />
        </div>

        <div className="border-t border-gray-700 my-4"></div>

        {/* Botón Crear */}
        <button 
          onClick={crearSala}
          className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold transition"
        >
          Crear Nueva Sala
        </button>

        <p className="text-center text-gray-400 text-sm">- O -</p>

        {/* Unirse */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={salaId}
            onChange={(e) => setSalaId(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-center uppercase"
            placeholder="CÓDIGO"
            maxLength={4}
          />
          <button 
            onClick={unirseSala}
            className="bg-blue-600 hover:bg-blue-500 px-4 rounded font-bold"
          >
            Entrar
          </button>
        </div>

      </div>
    </div>
  );
}