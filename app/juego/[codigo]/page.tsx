"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
// Asegúrate que esta ruta coincida con donde tienes tu archivo firebase.ts
// Si firebase.ts está en la carpeta 'app', usa "../../firebase"
// Si está en la carpeta 'juego', usa "../firebase"
import { db } from "../../firebase"; 
import { ref, onValue, update, remove, get } from "firebase/database";

// --- DICCIONARIO DE PALABRAS ---
const PALABRAS = [
  "Museo", "Zoológico", "Casino", "Farmacia", "Iglesia", "Aeropuerto", "Granja", "Discoteca", "Estadio", "Peluquería",
  "Sauna", "Teatro", "Taller Mecánico", "Panadería", "Cueva", "Isla Desierta", "Laboratorio", "Mansión", "Selva", "Desierto",
  "Puente", "Torre Eiffel", "Estatua de la Libertad", "Coliseo Romano", "Casa Blanca", "Teléfono", "Lápiz", "Mochila", "Anillo", "Sombrero",
  "Tijeras", "Martillo", "Botella", "Libro", "Silla", "Mesa", "Cama", "Televisor", "Automóvil", "Auriculares",
  "Globo", "Pelota", "Piano", "Billetera", "Cámara", "Linterna", "Escalera", "Taza", "Vela", "Mapa", 
  "Superman", "Mujer Maravilla", "Deadpool", "Thor", "Hulk", "Yoda", "Elsa", "Buzz Lightyear", "Woody", "Shrek",
  "Minion", "Michael Jackson", "Madonna", "Elon Musk", "Billie Eilish", "Messi", "Cristiano Ronaldo", "Neymar", "Mbappé", "Sherlock Holmes",
  "Drácula", "Frankenstein", "Tarzán", "La Sirenita", "Papá Noel", "Tigre", "Mono", "Cebra", "Hipopótamo", "Rinoceronte",
  "Águila", "Loro", "Búho", "Serpiente", "Rana", "Mariposa", "Araña", "Pulpo", "Cangrejo", "Estrella de Mar",
  "Caballo", "Vaca", "Cerdo", "Oveja", "Pato", "Ratón", "Hámster", "Gorila", "Camello", "Koala"
];

export default function JuegoPage() {
  const router = useRouter(); 
  const params: any = useParams(); // Usamos any para evitar error de tipos
  const codigo = params?.codigo;
  
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre");

  const [sala, setSala] = useState<any>(null);
  const [mensaje, setMensaje] = useState("Conectando...");
  const [yaVote, setYaVote] = useState(false);

  // 1. CONEXIÓN
  useEffect(() => {
    if (!codigo || !nombre) return;

    const salaRef = ref(db, `salas/${codigo}`);
    const jugadorRef = ref(db, `salas/${codigo}/jugadores/${nombre}`);

    // Registrar jugador
    update(jugadorRef, {
      nombre: nombre,
      conectado: true,
      vivo: true 
    }).catch((err) => console.error("Error Firebase:", err));

    // Escuchar cambios
    const unsub = onValue(salaRef, (snapshot: any) => {
      const data = snapshot.val();
      
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        
        // Seguridad: Si no estoy en la lista, me echaron
        if (data.jugadores && !data.jugadores[nombre]) {
            alert("Te han sacado de la sala.");
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
  const soyImpostor = sala?.impostor === nombre;
  // @ts-ignore
  const miJugador = sala?.jugadores?.[nombre];
  const estoyVivo = miJugador?.vivo !== false;
  const estoyJugando = sala?.estado === "JUGANDO" || sala?.estado === "VOTANDO";

  // Lógica de Victoria
  const verificarVictoria = (jugadores: any[], impostorNombre: string) => {
    const vivos = jugadores.filter((j: any) => j.vivo !== false);
    const impostorVivo = vivos.some((j: any) => j.nombre === impostorNombre);

    if (!impostorVivo) return { nuevoEstado: "TERMINADO", ganador: "CIUDADANOS" };
    if (vivos.length <= 2) return { nuevoEstado: "TERMINADO", ganador: "IMPOSTOR" };
    
    return { nuevoEstado: "JUGANDO", ganador: "" };
  };

  // 2. ACCIONES
  const empezarPartida = () => {
    if (listaJugadores.length < 3) return alert("Mínimo 3 jugadores.");
    
    const lugar = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    const impostor = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;
    const inicia = (listaJugadores[Math.floor(Math.random() * listaJugadores.length)] as any).nombre;

    const updates: any = {};
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/vivo`] = true;
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });

    updates["estado"] = "JUGANDO";
    updates["lugar"] = lugar;
    updates["impostor"] = impostor;
    updates["jugadorInicial"] = inicia;
    updates["ganador"] = "";

    update(ref(db, `salas/${codigo}`), updates);
  };

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

  // Procesar Votos Automáticamente
  useEffect(() => {
    if (!sala || sala.estado !== "VOTANDO" || !soyAdmin) return;
    
    const vivos = listaJugadores.filter((j: any) => j.vivo !== false);
    const votosTotales = listaJugadores.reduce((acc: number, j: any) => acc + (j.votos || 0), 0);

    if (votosTotales >= vivos.length && vivos.length > 0) {
        const timer: any = setTimeout(() => {
            let masVotado: any = null;
            let max = -1;
            
            // Buscar más votado
            listaJugadores.forEach((j: any) => {
                if ((j.votos || 0) > max) { max = j.votos; masVotado = j; }
            });

            // Verificar empates (simple: si hay empate, muere el primero que encontró, para simplificar código)
            // O mejor: si hay empate no muere nadie.
            // Para simplificar "profesional": Eliminamos al más votado.
            
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
    <div className="w-full flex flex-col items-center pb-10">
      
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/50 p-2 rounded-xl">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500">SALA</span>
            <span className="text-2xl font-black">{codigo}</span>
        </div>
        <button onClick={salirPartida} className="bg-red-500 text-white px-3 py-1 rounded font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
            SALIR
        </button>
      </div>

      {/* 1. LOBBY */}
      {sala.estado === "ESPERANDO" && (
        <div className="w-full space-y-4">
            <div className="bg-yellow-100 border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black uppercase text-sm mb-2 border-b-2 border-black pb-1">Jugadores ({listaJugadores.length})</h3>
                {listaJugadores.map((j: any) => (
                    <div key={j.nombre} className="flex items-center gap-2 mb-2 font-bold">
                        <span>{j.nombre === sala.host ? "👑" : "👤"}</span>
                        <span>{j.nombre}</span>
                    </div>
                ))}
            </div>
            {soyAdmin ? (
                <button onClick={empezarPartida} className="w-full bg-green-400 text-black border-4 border-black py-3 rounded-xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    EMPEZAR
                </button>
            ) : (
                <p className="text-center font-bold text-gray-500 animate-pulse">Esperando al anfitrión...</p>
            )}
        </div>
      )}

      {/* 2. JUEGO */}
      {sala.estado === "JUGANDO" && (
        <div className="w-full text-center space-y-6">
            <div className={`p-6 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${soyImpostor ? 'bg-red-500 text-white' : 'bg-cyan-300 text-black'}`}>
                {soyImpostor ? (
                    <div>
                        <div className="text-6xl">🤫</div>
                        <h2 className="text-4xl font-black uppercase">ERES EL IMPOSTOR</h2>
                        <p className="text-sm font-bold bg-black/20 rounded px-2">Engaña a todos</p>
                    </div>
                ) : (
                    <div>
                        <div className="text-5xl">📍</div>
                        <p className="font-bold uppercase opacity-60 text-xs">El lugar es</p>
                        <h2 className="text-3xl font-black uppercase bg-white border-2 border-black rounded px-2 py-1 rotate-1 text-black mt-2">
                            {sala.lugar}
                        </h2>
                    </div>
                )}
            </div>

            {/* Turno */}
            {sala.jugadorInicial && (
                <div className="bg-white border-2 border-black p-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-bold text-gray-500 uppercase">Empieza preguntando:</p>
                    <p className="text-xl font-black uppercase text-purple-600">{sala.jugadorInicial}</p>
                </div>
            )}

            {soyAdmin && (
                <button onClick={iniciarVotacion} className="w-full bg-orange-400 text-black border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none animate-pulse">
                    🚨 LLAMAR A VOTACIÓN
                </button>
            )}
        </div>
      )}

      {/* 3. VOTACIÓN */}
      {sala.estado === "VOTANDO" && (
        <div className="w-full text-center space-y-4">
            <h2 className="text-3xl font-black uppercase bg-red-600 text-white inline-block px-4 py-1 border-4 border-black -rotate-2">¡VOTACIÓN!</h2>
            {!estoyVivo && <p className="font-bold text-gray-500">Estás muerto 💀</p>}
            
            <div className="grid grid-cols-2 gap-3">
                {listaJugadores.filter((j: any) => j.vivo !== false).map((j: any) => (
                    <button
                        key={j.nombre}
                        onClick={() => votarPor(j.nombre)}
                        disabled={yaVote || !estoyVivo || j.nombre === nombre}
                        className={`p-3 border-4 border-black rounded-xl font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${yaVote ? 'bg-gray-200 opacity-50' : 'bg-white hover:bg-red-100 active:translate-y-1 active:shadow-none'}`}
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
        <div className="w-full text-center space-y-6 pt-10">
            <div className={`p-6 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${sala.ganador === 'IMPOSTOR' ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>
                <h1 className="text-4xl font-black uppercase mb-2">
                    {sala.ganador === 'IMPOSTOR' ? 'GANÓ EL IMPOSTOR' : 'GANARON LOS CIUDADANOS'}
                </h1>
                <div className="bg-white text-black p-2 rounded font-bold border-2 border-black inline-block">
                    Impostor: {sala.impostor}
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
  );
}