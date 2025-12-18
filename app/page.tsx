"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "./firebase"; 
import { ref, set, get, child } from "firebase/database";

export default function Home() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");

  // LÓGICA ORIGINAL (NO SE TOCA)
  const crearSala = async () => {
    if (!nombre) return alert("¡Escribe tu nombre primero!");
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    await set(ref(db, 'salas/' + codigo), {
      estado: 'ESPERANDO',
      host: nombre, 
      jugadores: {
        [nombre]: { nombre: nombre, esHost: true }
      }
    });
    router.push(`/juego/${codigo}?nombre=${nombre}`);
  };

  const unirseSala = async () => {
    if (!nombre || !salaId) return alert("Completa nombre y código");
    const salaRef = ref(db);
    const snapshot = await get(child(salaRef, `salas/${salaId.toUpperCase()}`));

    if (snapshot.exists()) {
      router.push(`/juego/${salaId.toUpperCase()}?nombre=${nombre}`);
    } else {
      alert("Esa sala no existe 😢");
    }
  };

  return (
    // Ya no usamos min-h-screen ni bg-gray-900 porque el layout maneja el contenedor
    <div className="flex flex-col items-center w-full space-y-6">
      
      {/* AQUÍ BORRÉ EL TÍTULO <h1> QUE TENÍAS.
          Ahora el diseño es limpio dentro del tablero.
      */}

      <div className="w-full space-y-5">
        
        {/* Input Nombre estilo Cartoon */}
        <div className="space-y-2">
          <label className="block text-lg font-bold text-black uppercase tracking-wide">
            Tu Nombre
          </label>
          <input 
            type="text" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 border-4 border-black text-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all placeholder:text-gray-400"
            placeholder="Ej: Ariel"
          />
        </div>

        {/* Separador dibujado */}
        <div className="border-t-4 border-black border-dashed opacity-20 my-6"></div>

        {/* Botón Crear Sala */}
        <button 
          onClick={crearSala}
          className="w-full bg-green-400 hover:bg-green-300 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
        >
          Crear Nueva Sala
        </button>

        <div className="relative flex items-center justify-center py-2">
            <span className="bg-white px-3 text-black font-bold text-sm border-2 border-black rounded-full z-10">O ENTRA A UNA</span>
            <div className="absolute w-full border-b-2 border-black opacity-20"></div>
        </div>

        {/* Sección Unirse */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={salaId}
            onChange={(e) => setSalaId(e.target.value)}
            className="w-full sm:w-2/3 p-3 rounded-xl bg-gray-50 border-4 border-black text-center uppercase font-mono text-lg font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            placeholder="CÓDIGO"
            maxLength={4}
          />
          <button 
            onClick={unirseSala}
            className="w-full sm:w-1/3 bg-blue-400 hover:bg-blue-300 text-black border-4 border-black rounded-xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all py-3 sm:py-0"
          >
            Entrar
          </button>
        </div>

      </div>
    </div>
  );
}