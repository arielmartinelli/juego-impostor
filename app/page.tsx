"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "./firebase"; 
import { ref, set, get, child } from "firebase/database";

export default function Home() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");

  const crearSala = async () => {
    if (!nombre) return alert("¡Escribe tu nombre primero!");
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();
    await set(ref(db, 'salas/' + codigo), {
      estado: 'ESPERANDO',
      host: nombre, 
      jugadores: { [nombre]: { nombre: nombre, esHost: true } }
    });
    router.push(`/juego/${codigo}?nombre=${nombre}`);
  };

  const unirseSala = async () => {
    if (!nombre || !salaId) return alert("Falta nombre o código");
    const salaRef = ref(db);
    const snapshot = await get(child(salaRef, `salas/${salaId.toUpperCase()}`));
    if (snapshot.exists()) {
      router.push(`/juego/${salaId.toUpperCase()}?nombre=${nombre}`);
    } else {
      alert("Sala no encontrada");
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      
      {/* SECCIÓN NOMBRE */}
      <div className="space-y-3">
        <label className="block text-lg font-black text-black uppercase tracking-wider ml-1">
          Tu Nombre
        </label>
        {/* Input GRANDE: text-xl y p-4 */}
        <input 
          type="text" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-4 rounded-xl bg-gray-50 border-4 border-black text-black font-bold text-xl focus:outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-300"
          placeholder="Ej: ALEJO"
          maxLength={12}
        />
      </div>

      <div className="border-t-4 border-black border-dashed opacity-20 my-2"></div>

      {/* BOTÓN CREAR GRANDE */}
      <button 
        onClick={crearSala}
        className="w-full bg-green-400 hover:bg-green-300 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
      >
        Crear Sala Nueva
      </button>

      {/* Separador */}
      <div className="flex items-center justify-center py-2">
          <span className="bg-white px-4 text-sm font-black text-gray-400 uppercase tracking-widest border-2 border-gray-200 rounded-full py-1">
            O únete a una
          </span>
      </div>

      {/* SECCIÓN UNIRSE */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          className="w-full sm:w-2/3 p-4 rounded-xl bg-gray-50 border-4 border-black text-center font-black text-xl uppercase placeholder:text-gray-300 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          placeholder="CÓDIGO"
          maxLength={4}
        />
        <button 
          onClick={unirseSala}
          className="w-full sm:w-1/3 bg-blue-400 hover:bg-blue-300 text-black border-4 border-black rounded-xl font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all py-4 sm:py-0"
        >
          Entrar
        </button>
      </div>

    </div>
  );
}