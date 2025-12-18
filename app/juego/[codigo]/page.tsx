"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase"; 
import { ref, set, get, child } from "firebase/database";

export default function Home() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");

  // LÓGICA ORIGINAL (NO SE TOCA)
  const crearSala = async () => {
    if (!nombre) return alert("¡INGRESA TU ID PRIMERO!");
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
    if (!nombre || !salaId) return alert("ERROR: DATOS INCOMPLETOS");
    const salaRef = ref(db);
    const snapshot = await get(child(salaRef, `salas/${salaId.toUpperCase()}`));

    if (snapshot.exists()) {
      router.push(`/juego/${salaId.toUpperCase()}?nombre=${nombre}`);
    } else {
      alert("ERROR: SALA NO ENCONTRADA");
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-8 font-mono">
      
      <div className="w-full space-y-6">
        
        {/* Input Nombre estilo Terminal */}
        <div className="space-y-2 group">
          <label className="block text-sm font-bold text-cyan-400 uppercase tracking-widest group-hover:text-pink-500 transition-colors">
            &gt; Ingrese Nickname_
          </label>
          <input 
            type="text" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-4 bg-black border-2 border-gray-700 text-green-400 font-bold text-xl focus:outline-none focus:border-green-500 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all placeholder:text-gray-800 uppercase rounded-sm"
            placeholder="PLAYER 1"
          />
        </div>

        {/* Separador Cyber */}
        <div className="flex items-center gap-4 opacity-50">
           <div className="h-[1px] bg-cyan-500 w-full"></div>
           <div className="text-cyan-500 text-xs">O</div>
           <div className="h-[1px] bg-cyan-500 w-full"></div>
        </div>

        {/* Botón Crear Sala (Estilo Neón Pink) */}
        <button 
          onClick={crearSala}
          className="btn-arcade w-full bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black hover:shadow-[0_0_20px_#ff00ff] py-4 font-black text-xl rounded-sm"
        >
          INICIAR NUEVA PARTIDA
        </button>

        <div className="relative flex items-center justify-center py-4">
            <span className="bg-black px-3 text-gray-500 font-bold text-xs border border-gray-800 z-10 tracking-widest">JOIN SERVER</span>
        </div>

        {/* Sección Unirse */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={salaId}
            onChange={(e) => setSalaId(e.target.value)}
            className="w-full sm:w-2/3 p-4 bg-black border-2 border-gray-700 text-center text-cyan-400 font-bold text-lg placeholder:text-gray-800 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all uppercase rounded-sm"
            placeholder="CODIGO"
            maxLength={4}
          />
          <button 
            onClick={unirseSala}
            className="btn-arcade w-full sm:w-1/3 bg-cyan-600 text-black border-2 border-cyan-400 hover:bg-cyan-400 hover:shadow-[0_0_15px_#00ffff] font-bold uppercase rounded-sm py-3 sm:py-0"
          >
            CONNECT
          </button>
        </div>

      </div>
    </div>
  );
}