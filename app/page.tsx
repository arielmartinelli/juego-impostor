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
      
      {/* Input Nombre */}
      <div className="space-y-2">
        <label className="block text-sm font-black text-black uppercase tracking-wider ml-1">
          Tu Nickname
        </label>
        <input 
          type="text" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-4 rounded-xl bg-gray-50 border-4 border-black text-black font-black text-xl focus:outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-300"
          placeholder="Ej: PEPE"
          maxLength={12}
        />
      </div>

      {/* Separador visual */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-4 border-black border-dashed opacity-20"></div>
        </div>
      </div>

      {/* Botón Crear */}
      <button 
        onClick={crearSala}
        className="group relative w-full bg-green-400 hover:bg-green-300 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
      >
        <span className="relative z-10">Crear Sala</span>
      </button>

      <div className="flex items-center justify-center">
          <span className="bg-white px-3 text-xs font-black text-gray-400 uppercase tracking-widest border-2 border-gray-200 rounded-full py-1">
            - O entra a una -
          </span>
      </div>

      {/* Unirse */}
      <div className="flex w-full gap-3">
        <input 
          type="text" 
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          className="w-2/3 p-3 rounded-xl bg-gray-50 border-4 border-black text-center font-black text-xl uppercase placeholder:text-gray-300 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          placeholder="CÓDIGO"
          maxLength={4}
        />
        <button 
          onClick={unirseSala}
          className="w-1/3 bg-blue-400 hover:bg-blue-300 text-black border-4 border-black rounded-xl font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-sm leading-tight flex items-center justify-center"
        >
          Entrar
        </button>
      </div>

    </div>
  );
}