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
      jugadores: {
        [nombre]: { nombre: nombre, esHost: true }
      }
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
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4 sm:space-y-8">
      
      {/* Input Nombre */}
      <div className="w-full space-y-1">
        <label className="block text-sm font-black text-black uppercase ml-1">
          Tu Nombre
        </label>
        <input 
          type="text" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-100 border-4 border-black text-black font-bold focus:outline-none focus:bg-white text-lg placeholder:text-gray-400"
          placeholder="Ej: Pepe"
        />
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300"></div>

      {/* Botón Crear */}
      <button 
        onClick={crearSala}
        className="w-full bg-green-400 hover:bg-green-300 text-black border-4 border-black py-3 rounded-xl font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
      >
        Crear Sala
      </button>

      <div className="relative flex items-center justify-center w-full py-1">
          <span className="bg-white px-2 text-gray-400 font-bold text-xs">O entra a una</span>
      </div>

      {/* Unirse */}
      <div className="flex w-full gap-2">
        <input 
          type="text" 
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          className="w-2/3 p-3 rounded-xl bg-gray-100 border-4 border-black text-center font-black text-lg uppercase placeholder:text-gray-400 focus:outline-none"
          placeholder="CÓDIGO"
          maxLength={4}
        />
        <button 
          onClick={unirseSala}
          className="w-1/3 bg-blue-400 hover:bg-blue-300 text-black border-4 border-black rounded-xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-sm"
        >
          Entrar
        </button>
      </div>

    </div>
  );
}