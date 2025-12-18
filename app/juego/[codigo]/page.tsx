"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { db } from "../../firebase"; 
import { ref, onValue, update, remove } from "firebase/database";

const CATEGORIAS = {
  Lugares: [
    "Museo", "Zoológico", "Casino", "Farmacia", "Iglesia", "Aeropuerto", "Granja", "Discoteca", "Estadio", "Peluquería",
    "Sauna", "Teatro", "Taller Mecánico", "Panadería", "Cueva", "Isla Desierta", "Laboratorio", "Mansión", "Selva", "Desierto",
    "Puente", "Torre Eiffel", "Estatua de la Libertad", "Coliseo Romano", "Casa Blanca"
  ],
  Objetos: [
    "Teléfono", "Lápiz", "Mochila", "Anillo", "Sombrero", "Tijeras", "Martillo", "Botella", "Libro", "Silla", 
    "Mesa", "Cama", "Televisor", "Automóvil", "Auriculares", "Globo", "Pelota", "Piano", "Billetera", "Cámara"
  ],
  Personajes: [
    "Superman", "Mujer Maravilla", "Deadpool", "Thor", "Hulk", "Yoda", "Elsa", "Buzz Lightyear", "Woody", "Shrek",
    "Minion", "Michael Jackson", "Madonna", "Elon Musk", "Billie Eilish", "Messi", "Cristiano Ronaldo", "Neymar", "Mbappé", "Sherlock Holmes",
    "Drácula", "Frankenstein", "Tarzán", "La Sirenita", "Papá Noel"
  ],
  Animales: [
    "Tigre", "Mono", "Cebra", "Hipopótamo", "Rinoceronte", "Águila", "Loro", "Búho", "Serpiente", "Rana", 
    "Mariposa", "Araña", "Pulpo", "Cangrejo", "Estrella de Mar", "Caballo", "Vaca", "Cerdo", "Oveja", "Pato"
  ]
};

// --- TARJETA FLIP GRANDE ---
const TarjetaSecreta = ({ esImpostor, palabra }: { esImpostor: boolean, palabra: string }) => {
  const [volteada, setVolteada] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-4 w-full">
      <p className="text-sm font-bold text-gray-500 animate-bounce mb-2">👇 Toca para ver tu rol 👇</p>
      
      {/* Carta con tamaño FIJO y grande (w-64 h-80) para que se vea bien siempre */}
      <div 
        className="group relative w-64 h-80 [perspective:1000px] cursor-pointer"
        onClick={() => setVolteada(!volteada)}
      >
        <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${volteada ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRENTE */}
          <div className="absolute w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center [backface-visibility:hidden] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-7xl text-white font-black">?</span>
          </div>

          {/* DORSO */}
          <div className={`absolute w-full h-full rounded-xl flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 text-center ${esImpostor ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
            {esImpostor ? (
              <>
                <h2 className="text-3xl font-black uppercase mb-4">¡IMPOSTOR!</h2>
                <div className="text-6xl my-4">🤫</div>
                <p className="font-bold text-lg leading-tight">Engaña a todos.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black uppercase mb-2">CIUDADANO</h2>
                <p className="text-sm font-bold mb-2">La palabra es:</p>
                <div className="bg-white text-black px-4 py-3 rounded-lg border-2 border-black rotate-1 w-full break-words shadow-sm">
                  <span className="text-2xl font-black uppercase leading-none">{palabra}</span>
                </div>
              </>
            )}
            <p className="absolute bottom-3 text-[10px] font-bold opacity-60">(Toca para ocultar)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function JuegoPage() {
  const router = useRouter(); 
  const params: any = useParams();
  const codigo = params?.codigo;
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre");

  const [sala, setSala] = useState<any>(null);
  const [mensaje, setMensaje] = useState("Conectando...");
  const [yaVote, setYaVote] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Libre");

  useEffect(() => {
    if (!codigo || !nombre) return;
    const salaRef = ref(db, `salas/${codigo}`);
    const jugadorRef = ref(db, `salas/${codigo}/jugadores/${nombre}`);
    update(jugadorRef, { nombre: nombre, conectado: true, vivo: true, votos: 0 }).catch((err) => console.error(err));
    const unsub = onValue(salaRef, (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        if (data.jugadores && !data.jugadores[nombre]) { alert("Fuera de la sala"); router.push("/"); }
      } else { setMensaje("Sala no encontrada"); }
    });
    return () => unsub();
  }, [codigo, nombre, router]);

  const listaJugadores = sala?.jugadores ? Object.values(sala.jugadores) : [];
  const soyAdmin = sala?.host === nombre;
  // @ts-ignore
  const miJugador = sala?.jugadores?.[nombre];
  const estoyVivo = miJugador?.vivo !== false;

  const obtenerPalabraAleatoria = (cat: string) => {
    let pool: string[] = [];
    if (cat === "Libre") pool = Object.values(CATEGORIAS).flat();
    else pool = (CATEGORIAS as any)[cat] || CATEGORIAS.Lugares;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const empezarPartida = () => {
    if (listaJugadores.length < 3) return alert("Mínimo 3 jugadores");
    const palabra = obtenerPalabraAleatoria(categoriaSeleccionada);
    const impostor = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;
    const inicia = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;
    const updates: any = {};
    listaJugadores.forEach((j: any) => { updates[`jugadores/${j.nombre}/vivo`] = true; updates[`jugadores/${j.nombre}/votos`] = 0; });
    updates["estado"] = "JUGANDO"; updates["lugar"] = palabra; updates["impostor"] = impostor; updates["jugadorInicial"] = inicia; updates["ganador"] = "";
    update(ref(db, `salas/${codigo}`), updates);
  };

  const expulsarJugador = async (n: string) => { if(!confirm(`¿Sacar a ${n}?`)) return; await remove(ref(db, `salas/${codigo}/jugadores/${n}`)); };
  const pausarPartida = () => { const nuevo = sala.estado === "PAUSADO" ? "JUGANDO" : "PAUSADO"; update(ref(db, `salas/${codigo}`), { estado: nuevo }); };
  const terminarPartidaForzado = () => { if(!confirm("¿Terminar?")) return; update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "", lugar: "" }); };
  const votarPor = (n: string) => { if (yaVote || !estoyVivo) return; const votos = (sala.jugadores[n] as any).votos || 0; update(ref(db, `salas/${codigo}/jugadores/${n}`), { votos: votos + 1 }); setYaVote(true); };
  const iniciarVotacion = () => { const updates: any = {}; listaJugadores.forEach((j: any) => updates[`jugadores/${j.nombre}/votos`] = 0); updates["estado"] = "VOTANDO"; update(ref(db, `salas/${codigo}`), updates); };
  const salirPartida = async () => { if (confirm("¿Salir?")) { await remove(ref(db, `salas/${codigo}/jugadores/${nombre}`)); router.push("/"); } };
  const verificarVictoria = (jugadores: any[], impostorNombre: string) => {
    const vivos = jugadores.filter((j: any) => j.vivo !== false);
    const impostorVivo = vivos.some((j: any) => j.nombre === impostorNombre);
    if (!impostorVivo) return { nuevoEstado: "TERMINADO", ganador: "CIUDADANOS" };
    if (vivos.length <= 2) return { nuevoEstado: "TERMINADO", ganador: "IMPOSTOR" };
    return { nuevoEstado: "JUGANDO", ganador: "" };
  };

  useEffect(() => {
    if (!sala || sala.estado !== "VOTANDO" || !soyAdmin) return;
    const vivos = listaJugadores.filter((j: any) => j.vivo !== false);
    const votosTotales = listaJugadores.reduce((acc: number, j: any) => acc + (j.votos || 0), 0);
    if (votosTotales >= vivos.length && vivos.length > 0) {
        const timer: any = setTimeout(() => {
            let masVotado: any = null; let max = -1;
            listaJugadores.forEach((j: any) => { if ((j.votos || 0) > max) { max = j.votos; masVotado = j; } });
            const updates: any = {};
            if (masVotado) {
                const listaSimulada = listaJugadores.map((j: any) => j.nombre === masVotado.nombre ? { ...j, vivo: false } : j);
                updates[`jugadores/${masVotado.nombre}/vivo`] = false;
                const resultado = verificarVictoria(listaSimulada, sala.impostor);
                updates["estado"] = resultado.nuevoEstado;
                if (resultado.ganador) updates["ganador"] = resultado.ganador;
            }
            update(ref(db, `salas/${codigo}`), updates);
        }, 2000);
        return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala, soyAdmin]);


  if (!sala) return <div className="text-center mt-10 font-black text-xl">{mensaje}</div>;

  return (
    <div className="flex flex-col w-full h-full justify-between">
      
      {/* HEADER SALA */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-200">
        <div>
            <span className="text-xs uppercase font-bold text-gray-400 block">Sala Código</span>
            <div className="text-2xl font-black text-black">{codigo}</div>
        </div>
        <button onClick={salirPartida} className="bg-red-100 text-red-500 px-3 py-2 rounded-lg border-2 border-red-200 font-bold text-sm uppercase">
            Salir
        </button>
      </div>

      {/* CONTENIDO SCROLLABLE (SI HAY MUCHOS JUGADORES) */}
      <div className="flex-1 w-full flex flex-col items-center">

        {/* 1. LOBBY */}
        {sala.estado === "ESPERANDO" && (
            <div className="w-full space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <h3 className="text-sm font-black uppercase text-gray-400 mb-3">Jugadores Conectados ({listaJugadores.length})</h3>
                    <div className="space-y-2">
                        {listaJugadores.map((j: any) => (
                            <div key={j.nombre} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <span className="font-bold text-lg">{j.nombre === sala.host ? "👑" : "👤"} {j.nombre}</span>
                                {soyAdmin && j.nombre !== nombre && (
                                  <button onClick={() => expulsarJugador(j.nombre)} className="text-xs text-red-500 font-bold border-2 border-red-100 px-2 py-1 rounded bg-red-50">SACAR</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {soyAdmin ? (
                    <>
                        <div className="flex items-center gap-3 text-sm font-bold bg-white p-2 rounded border border-gray-200">
                            <span>Categoría:</span>
                            <select 
                            value={categoriaSeleccionada} 
                            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                            className="bg-gray-100 border border-black rounded px-2 py-1 flex-1"
                            >
                            <option value="Libre">🎲 Mezclado</option>
                            {Object.keys(CATEGORIAS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <button onClick={empezarPartida} className="w-full bg-green-400 border-4 border-black py-4 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-green-300">
                            ¡Empezar Partida!
                        </button>
                    </>
                ) : (
                    <div className="text-center p-4 bg-yellow-100 rounded-xl border-4 border-yellow-200 border-dashed">
                        <p className="font-bold text-yellow-700 text-lg animate-pulse">Esperando al anfitrión...</p>
                    </div>
                )}
            </div>
        )}

        {/* PAUSA */}
        {sala.estado === "PAUSADO" && (
           <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center text-center rounded-2xl">
              <h2 className="text-4xl font-black mb-4">PAUSA ⏸️</h2>
              {soyAdmin && <button onClick={pausarPartida} className="bg-yellow-400 text-black border-4 border-black px-8 py-3 rounded-xl font-bold text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">REANUDAR</button>}
           </div>
        )}

        {/* 2. JUEGO */}
        {sala.estado === "JUGANDO" && (
            <div className="w-full h-full flex flex-col items-center">
                
                <TarjetaSecreta esImpostor={sala.impostor === nombre} palabra={sala.lugar} />

                {sala.jugadorInicial && (
                    <div className="w-full text-center mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                        <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Turno de preguntar:</span>
                        <div className="text-3xl font-black text-purple-600 uppercase">
                            {sala.jugadorInicial}
                        </div>
                    </div>
                )}

                {soyAdmin && (
                    <div className="w-full mt-6 space-y-3">
                        <button onClick={iniciarVotacion} className="w-full bg-orange-400 border-4 border-black py-4 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none animate-pulse">
                             🚨 ¡A Votar!
                        </button>
                        <div className="flex gap-3 justify-center">
                          <button onClick={pausarPartida} className="flex-1 font-bold bg-gray-100 border-2 border-black py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none">Pausar</button>
                          <button onClick={terminarPartidaForzado} className="flex-1 font-bold bg-red-100 text-red-600 border-2 border-black py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none">Terminar</button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 3. VOTACIÓN */}
        {sala.estado === "VOTANDO" && (
            <div className="w-full space-y-4">
                <div className="text-center bg-red-500 text-white border-4 border-black p-2 -rotate-1 shadow-lg">
                    <h2 className="text-3xl font-black uppercase">¡VOTACIÓN!</h2>
                    <p className="text-sm font-bold">Descubran al impostor</p>
                </div>
                
                {!estoyVivo && <p className="text-center text-gray-500 font-bold bg-gray-200 p-2 rounded">👻 Estás muerto (no puedes votar)</p>}
                
                <div className="grid grid-cols-2 gap-3">
                    {listaJugadores.filter((j: any) => j.vivo !== false).map((j: any) => (
                        <button
                            key={j.nombre}
                            onClick={() => votarPor(j.nombre)}
                            disabled={yaVote || !estoyVivo || j.nombre === nombre}
                            className={`p-4 border-4 border-black rounded-xl font-black uppercase text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${yaVote ? 'bg-gray-200 opacity-50' : 'bg-white hover:bg-red-100 active:translate-y-1 active:shadow-none'}`}
                        >
                            {j.nombre}
                        </button>
                    ))}
                </div>
                {yaVote && <div className="text-center bg-green-100 text-green-700 font-bold p-3 rounded-xl border-2 border-green-200 animate-bounce">¡Voto enviado! Esperando resto...</div>}
            </div>
        )}

        {/* 4. RESULTADOS */}
        {sala.estado === "TERMINADO" && (
            <div className="w-full flex flex-col items-center justify-center space-y-6 pt-4">
                <div className={`w-full p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center ${sala.ganador === 'IMPOSTOR' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none mb-4">
                        {sala.ganador === 'IMPOSTOR' ? 'Ganó el Impostor' : 'Ganaron los Ciudadanos'}
                    </h1>
                    
                    <div className="bg-white text-black p-3 rounded-xl border-2 border-black inline-block text-lg w-full mb-2">
                        <span className="text-xs uppercase font-bold text-gray-500 block">El Impostor era:</span>
                        <span className="font-black text-2xl">{sala.impostor}</span>
                    </div>
                    
                    <div className="text-sm font-bold opacity-90 bg-black/10 p-2 rounded inline-block">
                        Lugar: {sala.lugar}
                    </div>
                </div>
                
                {soyAdmin && (
                    <button onClick={() => update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "" })} className="w-full bg-white text-black border-4 border-black py-4 rounded-xl font-black uppercase text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-gray-100">
                        🔄 Jugar de nuevo
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}