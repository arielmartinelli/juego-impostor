"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
// Asegúrate de que la ruta a firebase sea correcta (ajusta ../../ si es necesario)
import { db } from "./firebase"; 
import { ref, onValue, update, remove } from "firebase/database";

// --- 1. DICCIONARIO (Igual) ---
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

// --- COMPONENTE TARJETA RETRO ---
const TarjetaSecreta = ({ esImpostor, palabra }: { esImpostor: boolean, palabra: string }) => {
  const [volteada, setVolteada] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 my-8">
      <p className="text-xs font-mono text-cyan-400 animate-pulse uppercase tracking-widest">&gt;&gt; CLICK TO REVEAL IDENTITY &lt;&lt;</p>
      
      <div 
        className="group w-64 h-80 [perspective:1000px] cursor-pointer"
        onClick={() => setVolteada(!volteada)}
      >
        <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${volteada ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRENTE (Tapa Cyberpunk) */}
          <div className="absolute w-full h-full bg-black rounded-lg flex items-center justify-center [backface-visibility:hidden] border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.3)] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <span className="text-6xl text-cyan-500 font-black animate-bounce">?</span>
            <div className="absolute bottom-4 text-cyan-500 text-[10px] tracking-widest border border-cyan-500 px-2">CONFIDENTIAL</div>
          </div>

          {/* DORSO (Contenido) */}
          <div className={`absolute w-full h-full rounded-lg flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 text-center ${esImpostor ? 'bg-black border-red-600 shadow-red-900/50' : 'bg-black border-green-500 shadow-green-900/50'}`}>
            {esImpostor ? (
              <>
                <h2 className="text-3xl font-black uppercase mb-2 text-red-500 tracking-widest text-glow">IMPOSTOR</h2>
                <div className="text-5xl my-4 grayscale opacity-80">🕵️</div>
                <p className="font-mono text-red-400 text-sm">SYSTEM ERROR: UNKNOWN</p>
                <p className="font-mono text-red-500 text-xs mt-4 animate-pulse">(DECEIVE THE OTHERS)</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black uppercase mb-2 text-green-400 tracking-widest">CITIZEN</h2>
                <div className="text-4xl my-2 grayscale opacity-50">📍</div>
                <p className="font-mono text-green-300 text-xs mb-2">TARGET LOCATION:</p>
                <div className="bg-green-900/20 text-green-400 px-4 py-3 border border-green-500 w-full">
                  <span className="text-xl font-bold uppercase block break-words tracking-wider">{palabra}</span>
                </div>
              </>
            )}
            <p className="mt-auto text-[9px] text-gray-500 font-mono pt-4">TAP TO HIDE DATA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA DE JUEGO ---
export default function JuegoPage() {
  const router = useRouter(); 
  const params: any = useParams();
  const codigo = params?.codigo;
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre");

  const [sala, setSala] = useState<any>(null);
  const [mensaje, setMensaje] = useState("ESTABLISHING CONNECTION...");
  const [yaVote, setYaVote] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Libre");

  // 1. CONEXIÓN
  useEffect(() => {
    if (!codigo || !nombre) return;

    const salaRef = ref(db, `salas/${codigo}`);
    const jugadorRef = ref(db, `salas/${codigo}/jugadores/${nombre}`);

    update(jugadorRef, {
      nombre: nombre,
      conectado: true,
      vivo: true,
      votos: 0
    }).catch((err) => console.error("Error Firebase:", err));

    const unsub = onValue(salaRef, (snapshot: any) => {
      const data = snapshot.val();
      
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        
        if (data.jugadores && !data.jugadores[nombre]) {
            alert("KICKED FROM SERVER.");
            router.push("/");
        }
      } else {
        setMensaje("ERROR 404: ROOM NOT FOUND");
      }
    });

    return () => unsub();
  }, [codigo, nombre, router]);

  // Helpers
  const listaJugadores = sala?.jugadores ? Object.values(sala.jugadores) : [];
  const soyAdmin = sala?.host === nombre;
  // @ts-ignore
  const miJugador = sala?.jugadores?.[nombre];
  const estoyVivo = miJugador?.vivo !== false;
  
  // 2. LOGICA DE JUEGO (ADMIN)

  const obtenerPalabraAleatoria = (cat: string) => {
    let pool: string[] = [];
    if (cat === "Libre") {
      pool = Object.values(CATEGORIAS).flat();
    } else {
      // @ts-ignore
      pool = CATEGORIAS[cat] || CATEGORIAS.Lugares;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const empezarPartida = () => {
    if (listaJugadores.length < 3) return alert("NEED 3 PLAYERS TO START");
    
    const palabra = obtenerPalabraAleatoria(categoriaSeleccionada);
    const impostor = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;
    const inicia = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;

    const updates: any = {};
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/vivo`] = true;
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });

    updates["estado"] = "JUGANDO";
    updates["lugar"] = palabra; 
    updates["impostor"] = impostor;
    updates["jugadorInicial"] = inicia;
    updates["ganador"] = "";
    updates["categoriaActual"] = categoriaSeleccionada;

    update(ref(db, `salas/${codigo}`), updates);
  };

  const expulsarJugador = async (nombreJugador: string) => {
    if(!confirm(`KICK ${nombreJugador}?`)) return;
    await remove(ref(db, `salas/${codigo}/jugadores/${nombreJugador}`));
  };

  const pausarPartida = () => {
    const nuevoEstado = sala.estado === "PAUSADO" ? "JUGANDO" : "PAUSADO";
    update(ref(db, `salas/${codigo}`), { estado: nuevoEstado });
  };

  const terminarPartidaForzado = () => {
    if(!confirm("ABORT GAME?")) return;
    update(ref(db, `salas/${codigo}`), { 
      estado: "ESPERANDO", 
      ganador: "", 
      impostor: "",
      lugar: ""
    });
  };

  // --- LOGICA DE VOTACIÓN ---
  const votarPor = (nombreVotado: string) => {
    if (yaVote || !estoyVivo) return;
    const votos = (sala.jugadores[nombreVotado] as any).votos || 0;
    update(ref(db, `salas/${codigo}/jugadores/${nombreVotado}`), { votos: votos + 1 });
    setYaVote(true);
  };

  const iniciarVotacion = () => {
    const updates: any = {};
    listaJugadores.forEach((j: any) => updates[`jugadores/${j.nombre}/votos`] = 0);
    updates["estado"] = "VOTANDO";
    update(ref(db, `salas/${codigo}`), updates);
  };

  const salirPartida = async () => {
    if (confirm("DISCONNECT?")) {
        await remove(ref(db, `salas/${codigo}/jugadores/${nombre}`));
        router.push("/");
    }
  };

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
            let masVotado: any = null;
            let max = -1;
            
            listaJugadores.forEach((j: any) => {
                if ((j.votos || 0) > max) { max = j.votos; masVotado = j; }
            });

            const updates: any = {};
            if (masVotado) {
                const listaSimulada = listaJugadores.map((j: any) => 
                    j.nombre === masVotado.nombre ? { ...j, vivo: false } : j
                );
                
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


  // RENDERIZADO ARCADE
  if (!sala) return <div className="text-center mt-20 font-mono text-green-500 animate-pulse">{mensaje}</div>;

  return (
    <div className="w-full flex flex-col items-center pb-10 min-h-[500px]">
      
      {/* HEADER DE SALA */}
      <div className="w-full flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">SERVER ID</span>
            <span className="text-3xl font-mono text-cyan-400 text-glow">{codigo}</span>
        </div>
        <button onClick={salirPartida} className="text-red-500 border border-red-500 px-3 py-1 text-xs hover:bg-red-500 hover:text-black transition-colors uppercase tracking-wider">
            [ EXIT ]
        </button>
      </div>

      <div className="w-full px-2">

        {/* 1. LOBBY */}
        {sala.estado === "ESPERANDO" && (
            <div className="space-y-6">
                
                {/* Selector */}
                {soyAdmin && (
                  <div className="border border-gray-700 p-4 bg-gray-900/50">
                    <label className="block font-mono text-cyan-500 text-xs mb-2 uppercase tracking-widest">Select Database:</label>
                    <select 
                      value={categoriaSeleccionada} 
                      onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                      className="w-full bg-black border border-gray-600 text-white p-2 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                    >
                      <option value="Libre">🎲 RANDOM_MIX</option>
                      {Object.keys(CATEGORIAS).map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border border-gray-700 p-4 bg-gray-900/30 min-h-[200px]">
                    <h3 className="font-mono text-green-400 text-xs mb-4 border-b border-gray-800 pb-1 uppercase tracking-widest">Connected Players [{listaJugadores.length}]</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {listaJugadores.map((j: any) => (
                            <div key={j.nombre} className="flex items-center justify-between font-mono text-sm bg-black/40 p-2 border-l-2 border-transparent hover:border-cyan-500 transition-all">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs">{j.nombre === sala.host ? "👑" : "💾"}</span>
                                  <span className="text-white tracking-wider">{j.nombre}</span>
                                </div>
                                {soyAdmin && j.nombre !== nombre && (
                                  <button 
                                    onClick={() => expulsarJugador(j.nombre)}
                                    className="text-[10px] text-red-500 hover:bg-red-500 hover:text-black px-2 py-0.5 border border-red-900"
                                  >
                                    BAN
                                  </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {soyAdmin ? (
                    <button onClick={empezarPartida} className="btn-arcade w-full bg-green-600/20 text-green-400 border border-green-500 py-4 font-black text-xl hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_#00ff00]">
                        START GAME
                    </button>
                ) : (
                    <div className="text-center p-6 border-2 border-dashed border-gray-800">
                      <p className="font-mono text-yellow-400 animate-pulse text-sm">WAITING FOR HOST...</p>
                    </div>
                )}
            </div>
        )}

        {/* PANTALLA DE PAUSA */}
        {sala.estado === "PAUSADO" && (
           <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white font-mono">
              <h2 className="text-5xl font-black mb-4 text-yellow-400 animate-pulse">SYSTEM PAUSED</h2>
              {soyAdmin && (
                <button onClick={pausarPartida} className="mt-8 border-2 border-yellow-400 text-yellow-400 px-6 py-3 hover:bg-yellow-400 hover:text-black transition-all uppercase tracking-widest">
                  RESUME
                </button>
              )}
           </div>
        )}

        {/* 2. JUEGO */}
        {sala.estado === "JUGANDO" && (
            <div className="flex flex-col items-center w-full">
                
                <TarjetaSecreta 
                  esImpostor={sala.impostor === nombre} 
                  palabra={sala.lugar}
                />

                {/* Info del Turno */}
                {sala.jugadorInicial && (
                    <div className="w-full bg-black border border-purple-500 p-4 mb-6 text-center shadow-[0_0_10px_rgba(128,0,128,0.3)]">
                        <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1">Active Player:</p>
                        <p className="text-2xl font-bold uppercase text-white animate-pulse">{sala.jugadorInicial}</p>
                    </div>
                )}

                {/* Controles de Admin */}
                {soyAdmin && (
                    <div className="w-full space-y-3 mt-4">
                        <button onClick={iniciarVotacion} className="w-full bg-transparent border-2 border-red-500 text-red-500 py-3 font-bold uppercase hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_#ff0000] transition-all tracking-widest">
                             EMERGENCY MEETING (VOTE)
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <button onClick={pausarPartida} className="bg-gray-800 text-yellow-400 border border-yellow-600 py-2 text-xs hover:bg-yellow-600 hover:text-black uppercase">
                             PAUSE
                          </button>
                          <button onClick={terminarPartidaForzado} className="bg-gray-800 text-red-500 border border-red-800 py-2 text-xs hover:bg-red-800 hover:text-white uppercase">
                             ABORT
                          </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 3. VOTACIÓN */}
        {sala.estado === "VOTANDO" && (
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase text-red-500 animate-pulse tracking-widest mb-6">WHO IS THE GLITCH?</h2>
                
                {!estoyVivo && <p className="font-mono text-gray-600 border border-gray-800 p-2">💀 CONNECTION LOST (DEAD)</p>}
                
                <div className="grid grid-cols-2 gap-4">
                    {listaJugadores.filter((j: any) => j.vivo !== false).map((j: any) => (
                        <button
                            key={j.nombre}
                            onClick={() => votarPor(j.nombre)}
                            disabled={yaVote || !estoyVivo || j.nombre === nombre}
                            className={`p-4 border border-gray-600 font-mono font-bold uppercase transition-all relative overflow-hidden group ${yaVote ? 'opacity-30 cursor-not-allowed' : 'hover:border-cyan-400 hover:bg-cyan-900/30'}`}
                        >
                            {/* Efecto de linea scanline al hacer hover */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500"></div>
                            {j.nombre}
                        </button>
                    ))}
                </div>
                {yaVote && <p className="text-cyan-500 font-mono text-xs mt-4"> VOTE UPLOADED...</p>}
            </div>
        )}

        {/* 4. RESULTADOS */}
        {sala.estado === "TERMINADO" && (
            <div className="text-center space-y-8 pt-6">
                <div className={`p-8 border-4 border-double ${sala.ganador === 'IMPOSTOR' ? 'border-red-600 shadow-[0_0_30px_#ff0000]' : 'border-green-500 shadow-[0_0_30px_#00ff00]'} bg-black`}>
                    <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${sala.ganador === 'IMPOSTOR' ? 'text-red-500' : 'text-green-500'} text-glow`}>
                        {sala.ganador === 'IMPOSTOR' ? 'IMPOSTOR WINS' : 'CITIZENS WIN'}
                    </h1>
                    
                    <div className="mt-8 space-y-2">
                      <p className="text-gray-500 text-xs uppercase tracking-widest">The Impostor was:</p>
                      <div className="text-2xl font-mono text-white border-b border-gray-700 inline-block pb-1">
                        {sala.impostor}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                       <p className="text-gray-500 text-xs uppercase tracking-widest">Secret Location:</p>
                       <div className="text-xl font-mono text-cyan-400">
                          {sala.lugar}
                       </div>
                    </div>
                </div>
                
                {soyAdmin && (
                    <button onClick={() => update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "" })} className="w-full bg-white text-black py-4 font-black uppercase hover:bg-gray-300 tracking-widest">
                        PLAY AGAIN
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}