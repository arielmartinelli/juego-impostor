"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
// Asegúrate de que la ruta a firebase sea correcta
import { db } from "../../firebase"; 
import { ref, onValue, update, remove } from "firebase/database";

// --- 1. DICCIONARIO DE PALABRAS POR CATEGORÍA ---
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

// --- COMPONENTE TARJETA VOLTEABLE (Flip Card) ---
const TarjetaSecreta = ({ esImpostor, palabra }: { esImpostor: boolean, palabra: string }) => {
  const [volteada, setVolteada] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 my-6">
      <p className="text-sm font-bold text-gray-500 animate-bounce">👇 Toca la carta para ver tu rol 👇</p>
      
      <div 
        className="group w-64 h-80 [perspective:1000px] cursor-pointer"
        onClick={() => setVolteada(!volteada)}
      >
        <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${volteada ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRENTE (Tapa) */}
          <div className="absolute w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center [backface-visibility:hidden] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-6xl text-white font-black">?</span>
          </div>

          {/* DORSO (Contenido) */}
          <div className={`absolute w-full h-full rounded-xl flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 text-center ${esImpostor ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
            {esImpostor ? (
              <>
                <h2 className="text-3xl font-black uppercase mb-2">¡IMPOSTOR!</h2>
                <div className="text-5xl my-4">🤫</div>
                <p className="font-bold text-sm">Nadie sabe que eres tú.</p>
                <p className="font-bold text-xs mt-2 opacity-80">(Engaña a los demás)</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black uppercase mb-2">CIUDADANO</h2>
                <div className="text-4xl my-2">📍</div>
                <p className="font-bold text-sm mb-1">La palabra es:</p>
                <div className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black rotate-1">
                  <span className="text-xl font-black uppercase block break-words">{palabra}</span>
                </div>
              </>
            )}
            <p className="mt-auto text-[10px] font-bold opacity-60">(Toca para ocultar)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
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

  // 1. CONEXIÓN
  useEffect(() => {
    if (!codigo || !nombre) return;

    const salaRef = ref(db, `salas/${codigo}`);
    const jugadorRef = ref(db, `salas/${codigo}/jugadores/${nombre}`);

    // Registrar jugador
    update(jugadorRef, {
      nombre: nombre,
      conectado: true,
      vivo: true,
      votos: 0
    }).catch((err) => console.error("Error Firebase:", err));

    // Escuchar cambios
    const unsub = onValue(salaRef, (snapshot: any) => {
      const data = snapshot.val();
      
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        
        // Seguridad: Si no estoy en la lista, me echaron
        if (data.jugadores && !data.jugadores[nombre]) {
            alert("El administrador te ha sacado de la sala.");
            router.push("/");
        }
      } else {
        setMensaje("Sala no encontrada.");
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
      // Unir todos los arrays de valores del objeto CATEGORIAS
      pool = Object.values(CATEGORIAS).flat();
    } else {
      // @ts-ignore
      pool = CATEGORIAS[cat] || CATEGORIAS.Lugares;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const empezarPartida = () => {
    if (listaJugadores.length < 3) return alert("Mínimo 3 jugadores para empezar.");
    
    const palabra = obtenerPalabraAleatoria(categoriaSeleccionada);
    const impostor = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;
    const inicia = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;

    const updates: any = {};
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/vivo`] = true;
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });

    updates["estado"] = "JUGANDO";
    updates["lugar"] = palabra; // Usamos "lugar" como variable genérica para la palabra
    updates["impostor"] = impostor;
    updates["jugadorInicial"] = inicia;
    updates["ganador"] = "";
    updates["categoriaActual"] = categoriaSeleccionada;

    update(ref(db, `salas/${codigo}`), updates);
  };

  // --- NUEVAS FUNCIONES DE ADMIN ---

  const expulsarJugador = async (nombreJugador: string) => {
    if(!confirm(`¿Sacar a ${nombreJugador} de la sala?`)) return;
    await remove(ref(db, `salas/${codigo}/jugadores/${nombreJugador}`));
  };

  const pausarPartida = () => {
    const nuevoEstado = sala.estado === "PAUSADO" ? "JUGANDO" : "PAUSADO";
    update(ref(db, `salas/${codigo}`), { estado: nuevoEstado });
  };

  const terminarPartidaForzado = () => {
    if(!confirm("¿Volver al Lobby y reiniciar todo?")) return;
    update(ref(db, `salas/${codigo}`), { 
      estado: "ESPERANDO", 
      ganador: "", 
      impostor: "",
      lugar: ""
    });
  };

  // --- LOGICA DE VOTACIÓN (Igual que antes) ---
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
    if (confirm("¿Salir?")) {
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

  // Procesar Votos (Automático por el Admin)
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


  // RENDERIZADO
  if (!sala) return <div className="text-center mt-10 font-bold">{mensaje}</div>;

  return (
    <div className="w-full flex flex-col items-center pb-20 min-h-screen bg-yellow-50">
      
      {/* HEADER */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 bg-white border-b-4 border-black p-4 sticky top-0 z-50">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500">SALA</span>
            <span className="text-2xl font-black">{codigo}</span>
        </div>
        <button onClick={salirPartida} className="bg-red-500 text-white px-3 py-1 rounded font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
            SALIR
        </button>
      </div>

      <div className="w-full max-w-md px-4">

        {/* 1. LOBBY */}
        {sala.estado === "ESPERANDO" && (
            <div className="space-y-6">
                
                {/* Selector de Categoría (Solo Admin) */}
                {soyAdmin && (
                  <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <label className="block font-black uppercase text-sm mb-2">Categoría de palabras:</label>
                    <select 
                      value={categoriaSeleccionada} 
                      onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                      className="w-full border-2 border-black p-2 rounded font-bold"
                    >
                      <option value="Libre">🎲 LIBRE (Todas mezcladas)</option>
                      {Object.keys(CATEGORIAS).map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-yellow-100 border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-2 border-b-2 border-black pb-1">Jugadores ({listaJugadores.length})</h3>
                    {listaJugadores.map((j: any) => (
                        <div key={j.nombre} className="flex items-center justify-between mb-2 font-bold bg-white/50 p-2 rounded border border-black/10">
                            <div className="flex items-center gap-2">
                              <span>{j.nombre === sala.host ? "👑" : "👤"}</span>
                              <span>{j.nombre}</span>
                            </div>
                            
                            {/* Botón de expulsar (Admin) */}
                            {soyAdmin && j.nombre !== nombre && (
                              <button 
                                onClick={() => expulsarJugador(j.nombre)}
                                className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded border border-red-300 hover:bg-red-200"
                              >
                                SACAR
                              </button>
                            )}
                        </div>
                    ))}
                </div>

                {soyAdmin ? (
                    <button onClick={empezarPartida} className="w-full bg-green-400 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-green-300 transition-colors">
                        EMPEZAR PARTIDA
                    </button>
                ) : (
                    <div className="text-center p-4">
                      <p className="font-bold text-gray-500 animate-pulse">Esperando al anfitrión...</p>
                      <p className="text-xs mt-2 text-gray-400">Categoría elegida por admin</p>
                    </div>
                )}
            </div>
        )}

        {/* PANTALLA DE PAUSA */}
        {sala.estado === "PAUSADO" && (
           <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl font-black mb-4 animate-bounce">⏸️ PAUSA</h2>
              <p className="font-bold">El administrador pausó la partida</p>
              {soyAdmin && (
                <button onClick={pausarPartida} className="mt-8 bg-yellow-400 text-black px-6 py-3 rounded-xl font-black border-4 border-white">
                  REANUDAR
                </button>
              )}
           </div>
        )}

        {/* 2. JUEGO */}
        {sala.estado === "JUGANDO" && (
            <div className="flex flex-col items-center w-full">
                
                {/* TARJETA SECRETA (FLIP CARD) */}
                <TarjetaSecreta 
                  esImpostor={sala.impostor === nombre} 
                  palabra={sala.lugar}
                />

                {/* Info del Turno */}
                {sala.jugadorInicial && (
                    <div className="w-full bg-white border-2 border-black p-3 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase">Turno de preguntar:</p>
                        <p className="text-2xl font-black uppercase text-purple-600">{sala.jugadorInicial}</p>
                    </div>
                )}

                {/* Controles de Admin en Juego */}
                {soyAdmin && (
                    <div className="w-full space-y-3">
                        <button onClick={iniciarVotacion} className="w-full bg-orange-400 text-black border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none animate-pulse">
                            🚨 LLAMAR A VOTACIÓN
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-black/20">
                          <button onClick={pausarPartida} className="bg-yellow-300 text-black border-2 border-black py-2 rounded-lg font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                             ⏸️ PAUSAR
                          </button>
                          <button onClick={terminarPartidaForzado} className="bg-gray-200 text-red-600 border-2 border-black py-2 rounded-lg font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                             ⏹️ TERMINAR
                          </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 3. VOTACIÓN */}
        {sala.estado === "VOTANDO" && (
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase bg-red-600 text-white inline-block px-4 py-1 border-4 border-black -rotate-2 mb-4">¡VOTACIÓN!</h2>
                {!estoyVivo && <p className="font-bold text-gray-500 bg-gray-200 p-2 rounded">👻 Estás muerto, no puedes votar.</p>}
                
                <div className="grid grid-cols-2 gap-3">
                    {listaJugadores.filter((j: any) => j.vivo !== false).map((j: any) => (
                        <button
                            key={j.nombre}
                            onClick={() => votarPor(j.nombre)}
                            disabled={yaVote || !estoyVivo || j.nombre === nombre}
                            className={`p-3 border-4 border-black rounded-xl font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${yaVote ? 'bg-gray-200 opacity-50' : 'bg-white hover:bg-red-100 active:translate-y-1 active:shadow-none'}`}
                        >
                            {j.nombre}
                        </button>
                    ))}
                </div>
                {yaVote && <p className="text-green-600 font-bold animate-bounce mt-4">Voto enviado...</p>}
            </div>
        )}

        {/* 4. RESULTADOS */}
        {sala.estado === "TERMINADO" && (
            <div className="text-center space-y-6 pt-10">
                <div className={`p-6 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${sala.ganador === 'IMPOSTOR' ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>
                    <h1 className="text-4xl font-black uppercase mb-2">
                        {sala.ganador === 'IMPOSTOR' ? 'GANÓ EL IMPOSTOR' : 'GANARON LOS CIUDADANOS'}
                    </h1>
                    <div className="bg-white text-black p-2 rounded font-bold border-2 border-black inline-block mt-4">
                        Impostor era: {sala.impostor}
                    </div>
                    <div className="mt-2 text-sm font-bold opacity-80">
                        Palabra: {sala.lugar}
                    </div>
                </div>
                
                {soyAdmin && (
                    <button onClick={() => update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "" })} className="w-full bg-white text-black border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                        🔄 JUGAR DE NUEVO
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}