"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { db } from "../../firebase"; 
import { ref, onValue, update, remove } from "firebase/database";

// --- DICCIONARIO ---
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

// --- TARJETA FLIP (Responsive) ---
const TarjetaSecreta = ({ esImpostor, palabra }: { esImpostor: boolean, palabra: string }) => {
  const [volteada, setVolteada] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 py-2">
      <p className="text-xs font-bold text-gray-500 animate-bounce mb-2">👇 Toca la carta 👇</p>
      
      {/* CLAVE: aspect-[3/4] mantiene la forma de carta.
          max-h-[50vh] asegura que no ocupe más de la mitad de la pantalla vertical.
      */}
      <div 
        className="group relative w-full max-w-[200px] aspect-[3/4] max-h-[45vh] [perspective:1000px] cursor-pointer"
        onClick={() => setVolteada(!volteada)}
      >
        <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${volteada ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* FRENTE */}
          <div className="absolute w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center [backface-visibility:hidden] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-5xl text-white font-black">?</span>
          </div>

          {/* DORSO */}
          <div className={`absolute w-full h-full rounded-xl flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 text-center ${esImpostor ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
            {esImpostor ? (
              <>
                <h2 className="text-xl font-black uppercase">¡IMPOSTOR!</h2>
                <div className="text-4xl my-2">🤫</div>
                <p className="font-bold text-xs leading-tight">Engaña a todos.</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-black uppercase">CIUDADANO</h2>
                <p className="text-xs font-bold mb-1">Palabra:</p>
                <div className="bg-white text-black px-2 py-1 rounded border-2 border-black rotate-1 w-full break-words">
                  <span className="text-lg font-black uppercase leading-none">{palabra}</span>
                </div>
              </>
            )}
            <p className="absolute bottom-2 text-[9px] font-bold opacity-60">(Toca para ocultar)</p>
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
  const [mensaje, setMensaje] = useState("Cargando...");
  const [yaVote, setYaVote] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Libre");

  useEffect(() => {
    if (!codigo || !nombre) return;
    const salaRef = ref(db, `salas/${codigo}`);
    const jugadorRef = ref(db, `salas/${codigo}/jugadores/${nombre}`);

    update(jugadorRef, { nombre: nombre, conectado: true, vivo: true, votos: 0 })
      .catch((err) => console.error(err));

    const unsub = onValue(salaRef, (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        if (data.jugadores && !data.jugadores[nombre]) {
            alert("Te han sacado de la sala.");
            router.push("/");
        }
      } else {
        setMensaje("Sala no existe");
      }
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
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/vivo`] = true;
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });
    updates["estado"] = "JUGANDO";
    updates["lugar"] = palabra; 
    updates["impostor"] = impostor;
    updates["jugadorInicial"] = inicia;
    updates["ganador"] = "";
    update(ref(db, `salas/${codigo}`), updates);
  };

  const expulsarJugador = async (n: string) => {
    if(!confirm(`¿Sacar a ${n}?`)) return;
    await remove(ref(db, `salas/${codigo}/jugadores/${n}`));
  };

  const pausarPartida = () => {
    const nuevo = sala.estado === "PAUSADO" ? "JUGANDO" : "PAUSADO";
    update(ref(db, `salas/${codigo}`), { estado: nuevo });
  };

  const terminarPartidaForzado = () => {
    if(!confirm("¿Terminar juego?")) return;
    update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "", lugar: "" });
  };

  const votarPor = (n: string) => {
    if (yaVote || !estoyVivo) return;
    const votos = (sala.jugadores[n] as any).votos || 0;
    update(ref(db, `salas/${codigo}/jugadores/${n}`), { votos: votos + 1 });
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


  if (!sala) return <div className="text-center mt-10 font-black">{mensaje}</div>;

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* HEADER DE SALA (Compacto) */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-gray-100 shrink-0">
        <div className="leading-none">
            <span className="text-[10px] uppercase font-bold text-gray-400">Sala</span>
            <div className="text-xl font-black text-black">{codigo}</div>
        </div>
        <button onClick={salirPartida} className="bg-red-100 text-red-500 px-2 py-1 rounded border-2 border-red-200 font-bold text-xs uppercase">
            Salir
        </button>
      </div>

      {/* CONTENIDO FLEXIBLE (Ocupa lo que queda) */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">

        {/* 1. LOBBY */}
        {sala.estado === "ESPERANDO" && (
            <div className="w-full h-full flex flex-col">
                {/* Scroll solo en la lista de jugadores */}
                <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-2 border-2 border-gray-200">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Jugadores ({listaJugadores.length})</h3>
                    <div className="space-y-1">
                        {listaJugadores.map((j: any) => (
                            <div key={j.nombre} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                <span className="font-bold text-sm truncate">{j.nombre === sala.host ? "👑" : "👤"} {j.nombre}</span>
                                {soyAdmin && j.nombre !== nombre && (
                                  <button onClick={() => expulsarJugador(j.nombre)} className="text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded">SACAR</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controles de Admin (Fijos abajo) */}
                <div className="shrink-0 space-y-2">
                    {soyAdmin ? (
                        <>
                            <div className="flex items-center gap-2 text-xs font-bold mb-1">
                                <span>Categoría:</span>
                                <select 
                                value={categoriaSeleccionada} 
                                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                                className="bg-white border border-black rounded px-1"
                                >
                                <option value="Libre">🎲 Mix</option>
                                {Object.keys(CATEGORIAS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <button onClick={empezarPartida} className="w-full bg-green-400 border-4 border-black py-3 rounded-xl font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                                Empezar
                            </button>
                        </>
                    ) : (
                        <div className="text-center p-2 bg-yellow-100 rounded border-2 border-yellow-300">
                            <p className="font-bold text-yellow-700 animate-pulse text-sm">Esperando al líder...</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* PAUSA */}
        {sala.estado === "PAUSADO" && (
           <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-black mb-2">PAUSA ⏸️</h2>
              {soyAdmin && <button onClick={pausarPartida} className="btn-cartoon bg-yellow-300 px-6 py-2 rounded-lg font-bold">REANUDAR</button>}
           </div>
        )}

        {/* 2. JUEGO (Tarjeta y Acciones) */}
        {sala.estado === "JUGANDO" && (
            <div className="w-full h-full flex flex-col items-center justify-between">
                
                {/* Carta Responsive */}
                <TarjetaSecreta esImpostor={sala.impostor === nombre} palabra={sala.lugar} />

                {/* Info Turno */}
                {sala.jugadorInicial && (
                    <div className="w-full text-center my-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Le toca preguntar a:</span>
                        <div className="text-xl font-black text-purple-600 bg-purple-50 rounded border-2 border-purple-200 inline-block px-3">
                            {sala.jugadorInicial}
                        </div>
                    </div>
                )}

                {/* Botones Admin (Compactos) */}
                {soyAdmin && (
                    <div className="w-full shrink-0 mt-2">
                        <button onClick={iniciarVotacion} className="w-full bg-orange-400 border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none mb-3">
                             🚨 ¡A Votar!
                        </button>
                        <div className="flex gap-2 justify-center">
                          <button onClick={pausarPartida} className="text-[10px] font-bold bg-gray-200 border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none">Pausar</button>
                          <button onClick={terminarPartidaForzado} className="text-[10px] font-bold bg-red-200 text-red-600 border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none">Terminar</button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 3. VOTACIÓN */}
        {sala.estado === "VOTANDO" && (
            <div className="w-full h-full flex flex-col">
                <h2 className="text-2xl font-black uppercase text-center bg-red-500 text-white border-4 border-black -rotate-1 mb-4 py-1 shrink-0">¡Votación!</h2>
                
                {!estoyVivo && <p className="text-center text-gray-400 font-bold bg-gray-100 mb-2 py-1">👻 Estás muerto</p>}
                
                {/* Grid con scroll si hay muchos */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pb-2">
                    {listaJugadores.filter((j: any) => j.vivo !== false).map((j: any) => (
                        <button
                            key={j.nombre}
                            onClick={() => votarPor(j.nombre)}
                            disabled={yaVote || !estoyVivo || j.nombre === nombre}
                            className={`p-2 border-2 border-black rounded-lg font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm ${yaVote ? 'bg-gray-200 opacity-50' : 'bg-white hover:bg-red-100 active:translate-y-1 active:shadow-none'}`}
                        >
                            {j.nombre}
                        </button>
                    ))}
                </div>
                {yaVote && <p className="text-center text-green-600 font-bold text-xs shrink-0 py-2">Voto enviado...</p>}
            </div>
        )}

        {/* 4. RESULTADOS */}
        {sala.estado === "TERMINADO" && (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <div className={`w-full p-6 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center ${sala.ganador === 'IMPOSTOR' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
                    <h1 className="text-3xl font-black uppercase leading-none mb-2">
                        {sala.ganador === 'IMPOSTOR' ? 'Ganó el Impostor' : 'Ganaron los Ciudadanos'}
                    </h1>
                    <div className="bg-white/90 text-black p-2 rounded font-bold border-2 border-black inline-block text-sm">
                        Impostor: {sala.impostor}
                    </div>
                    <div className="mt-2 text-xs font-bold opacity-80">
                        Lugar: {sala.lugar}
                    </div>
                </div>
                
                {soyAdmin && (
                    <button onClick={() => update(ref(db, `salas/${codigo}`), { estado: "ESPERANDO", ganador: "", impostor: "" })} className="w-full bg-white text-black border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                        🔄 Jugar de nuevo
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}