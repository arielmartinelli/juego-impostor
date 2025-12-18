"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { db } from "../../firebase"; 
import { ref, onValue, update, remove } from "firebase/database";

// Lugares posibles para el juego
const PALABRAS = [
  "Museo", "Zoológico", "Casino", "Farmacia", "Iglesia",

"Aeropuerto", "Granja", "Discoteca", "Estadio", "Peluquería",

"Sauna", "Teatro", "Taller Mecánico", "Panadería", "Cueva",

"Isla Desierta", "Laboratorio", "Mansión", "Selva", "Desierto",

"Puente", "Torre Eiffel", "Estatua de la Libertad", "Coliseo Romano", "Casa Blanca", "Teléfono", "Lápiz", "Mochila", "Anillo", "Sombrero",

"Tijeras", "Martillo", "Botella", "Libro", "Silla",

"Mesa", "Cama", "Televisor", "Automóvil", "Auriculares",

"Globo", "Pelota", "Piano", "Billetera", "Cámara",

"Linterna", "Escalera", "Taza", "Vela", "Mapa", "Superman", "Mujer Maravilla", "Deadpool", "Thor", "Hulk",

"Yoda", "Elsa", "Buzz Lightyear", "Woody", "Shrek",

"Minion", "Michael Jackson", "Madonna", "Elon Musk", "Billie Eilish",

"Papa Francisco", "Diego Maradona", "Neymar", "Kylian Mbappé", "Sherlock Holmes",

"Drácula", "Frankenstein", "Tarzán", "La Sirenita", "Papá Noel", "Tigre", "Mono", "Cebra", "Hipopótamo", "Rinoceronte",

"Águila", "Loro", "Búho", "Serpiente", "Rana",

"Mariposa", "Araña", "Pulpo", "Cangrejo", "Estrella de Mar",

"Caballo", "Vaca", "Cerdo", "Oveja", "Pato",

"Ratón", "Hámster", "Gorila", "Camello", "Koala", "Mirtha Legrand", "Ricardo Darín", "Susana Giménez", "Guillermo Francella", "Manu Ginóbili",

"Charly García", "Carlos Gardel", "Bizarrap", "Emiliano 'Dibu' Martínez", "Tini Stoessel"
];

export default function JuegoPage() {
  const router = useRouter(); 
  const params = useParams();
  const codigo = Array.isArray(params?.codigo) ? params.codigo[0] : params?.codigo;
  
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre");

  const [sala, setSala] = useState<any>(null);
  const [mensaje, setMensaje] = useState("Cargando...");
  const [yaVote, setYaVote] = useState(false);

  // 1. CONECTARSE A LA SALA
  useEffect(() => {
    if (!codigo || !nombre) return;

    const salaRef = ref(db, `salas/${codigo}`);

    update(ref(db, `salas/${codigo}/jugadores/${nombre}`), {
      nombre: nombre,
      conectado: true,
      vivo: true 
    });

    const unsub = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
        if (data.estado !== "VOTANDO") setYaVote(false);
        
        // SEGURIDAD: Si me echaron (mi nombre ya no está en la lista), me saca
        if (data.jugadores && !data.jugadores[nombre]) {
            alert("Has sido expulsado de la sala por el anfitrión.");
            router.push("/");
        }
      } else {
        setMensaje("La sala no existe o fue borrada.");
      }
    });

    return () => unsub();
  }, [codigo, nombre, router]);

  // --- LÓGICA DE JUEGO Y VOTACIÓN ---

  const listaJugadores = Object.values(sala?.jugadores || []);
  const soyAdmin = sala?.host === nombre;
  const soyImpostor = sala?.impostor === nombre;
  // @ts-ignore
  const estoyVivo = sala?.jugadores?.[nombre]?.vivo !== false;

  // A. Empezar Partida (Elige quién arranca y lo guarda en Firebase)
  const empezarPartida = () => {
    if (listaJugadores.length < 3) return alert("Se necesitan al menos 3 jugadores");

    const lugarSecreto = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    
    // 1. Elegir Impostor
    const impostorIndex = Math.floor(Math.random() * listaJugadores.length);
    const nombreImpostor = (listaJugadores[impostorIndex] as any).nombre;

    // 2. Elegir Jugador Inicial (Quién empieza hablando)
    const inicialIndex = Math.floor(Math.random() * listaJugadores.length);
    const nombreJugadorInicial = (listaJugadores[inicialIndex] as any).nombre;

    // Reiniciamos a todos
    const updates: any = {};
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/vivo`] = true;
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });

    updates["estado"] = "JUGANDO";
    updates["lugar"] = lugarSecreto;
    updates["impostor"] = nombreImpostor;
    updates["jugadorInicial"] = nombreJugadorInicial; // ¡IMPORTANTE! Esto lo ven todos
    updates["ganador"] = "";

    update(ref(db, `salas/${codigo}`), updates);
  };

  // B. Iniciar Fase de Votación
  const iniciarVotacion = () => {
    const updates: any = {};
    listaJugadores.forEach((j: any) => {
        updates[`jugadores/${j.nombre}/votos`] = 0;
    });
    updates["estado"] = "VOTANDO";
    update(ref(db, `salas/${codigo}`), updates);
  };

  // C. Emitir Voto
  const votarPor = (nombreVotado: string) => {
    if (yaVote || !estoyVivo) return;

    const votosActuales = sala.jugadores[nombreVotado].votos || 0;
    
    update(ref(db, `salas/${codigo}/jugadores/${nombreVotado}`), {
        votos: votosActuales + 1
    });
    setYaVote(true);
  };

  // D. Calcular Resultados
  useEffect(() => {
    if (!sala || sala.estado !== "VOTANDO" || !soyAdmin) return;

    const jugadoresVivos = listaJugadores.filter((j: any) => j.vivo !== false);
    const votosTotalesEmitidos = listaJugadores.reduce((acc: number, j: any) => acc + (j.votos || 0), 0);

    if (votosTotalesEmitidos >= jugadoresVivos.length && jugadoresVivos.length > 0) {
        setTimeout(() => procesarVotacion(), 1000); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala, soyAdmin]); 

  const procesarVotacion = () => {
    let masVotado: any = null;
    let maxVotos = -1;
    let empate = false;

    listaJugadores.forEach((j: any) => {
        const votos = j.votos || 0;
        if (votos > maxVotos) {
            maxVotos = votos;
            masVotado = j;
            empate = false;
        } else if (votos === maxVotos) {
            empate = true;
        }
    });

    const updates: any = {};

    if (empate || !masVotado) {
        updates["estado"] = "JUGANDO";
    } else {
        const expulsadoEsImpostor = masVotado.nombre === sala.impostor;

        if (expulsadoEsImpostor) {
            updates["estado"] = "TERMINADO";
            updates["ganador"] = "CIUDADANOS";
        } else {
            updates[`jugadores/${masVotado.nombre}/vivo`] = false;
            const vivosRestantes = listaJugadores.filter((j: any) => j.vivo !== false && j.nombre !== masVotado.nombre).length;
            
            if (vivosRestantes <= 2) {
                updates["estado"] = "TERMINADO";
                updates["ganador"] = "IMPOSTOR";
            } else {
                updates["estado"] = "JUGANDO";
            }
        }
    }
    
    update(ref(db, `salas/${codigo}`), updates);
  };

  // 3. REINICIAR Y SALIR
  const reiniciar = () => {
    update(ref(db, `salas/${codigo}`), {
      estado: "ESPERANDO",
      lugar: "",
      impostor: "",
      ganador: "",
      jugadorInicial: "" // Borramos quién empezaba para la próxima ronda
    });
  };

  const salirPartida = async () => {
    if (confirm("¿Seguro que quieres abandonar la partida?")) {
      await remove(ref(db, `salas/${codigo}/jugadores/${nombre}`));
      router.push("/");
    }
  };

  // FUNCIÓN: Expulsar Jugador (Solo Admin)
  const echarJugador = async (jugadorAEchar: string) => {
    if (confirm(`¿Quieres expulsar a ${jugadorAEchar} de la sala?`)) {
        await remove(ref(db, `salas/${codigo}/jugadores/${jugadorAEchar}`));
    }
  };

  const finalizarRondaManual = () => {
     if (confirm("¿Revelar roles y terminar esta ronda?")) {
        update(ref(db, `salas/${codigo}`), {
            estado: "TERMINADO",
            ganador: "NADIE (Cancelado)"
        });
     }
  };

  if (!sala) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-xl font-bold text-black animate-pulse">{mensaje}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full h-full pb-10">
      
      {/* CABECERA */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-bold uppercase text-black block">SALA</span>
            <span className="text-lg font-black text-black">{codigo}</span>
        </div>
        
        <div className="flex gap-2">
            <div className="bg-white border-2 border-black px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <span className="text-sm font-bold text-black">{nombre}</span>
                <div className={`w-3 h-3 rounded-full border border-black ${estoyVivo ? 'bg-green-500' : 'bg-red-600'}`}></div>
            </div>
            
            <button 
                onClick={salirPartida}
                className="bg-red-500 hover:bg-red-600 text-white border-2 border-black px-3 py-1 rounded font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-sm"
                title="Salir de la partida"
            >
                ❌
            </button>
        </div>
      </div>

      {/* --- PANTALLA DE ESPERA --- */}
      {sala.estado === "ESPERANDO" && (
        <div className="w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter">
              Lobby
            </h1>
            <p className="text-sm font-bold text-gray-500">Invita a tus amigos</p>
          </div>

          <div className="bg-blue-100 border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden group">
            <p className="text-5xl font-mono font-black text-blue-600 tracking-widest selection:bg-yellow-300">
                {codigo}
            </p>
          </div>
          
          <div className="bg-gray-50 border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-black font-black uppercase text-sm mb-3 border-b-2 border-black pb-1">
                Jugadores ({listaJugadores.length})
            </h3>
            <ul className="space-y-2">
              {listaJugadores.map((j: any) => (
                <li key={j.nombre} className="flex items-center justify-between font-bold text-black border-b border-gray-200 last:border-0 pb-1">
                   <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 flex items-center justify-center border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${j.nombre === sala.host ? 'bg-yellow-400' : 'bg-white'}`}>
                            {j.nombre === sala.host ? "👑" : "👤"}
                        </div>
                        <span>{j.nombre}</span>
                   </div>
                   
                   {/* BOTÓN DE EXPULSAR (SOLO ADMIN) */}
                   {soyAdmin && j.nombre !== nombre && (
                       <button 
                           onClick={() => echarJugador(j.nombre)}
                           className="bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 rounded px-2 py-0.5 text-xs font-bold"
                           title="Expulsar jugador"
                       >
                           🚫 Echar
                       </button>
                   )}
                </li>
              ))}
            </ul>
          </div>

          {soyAdmin ? (
            <button 
                onClick={empezarPartida} 
                className="w-full bg-green-400 hover:bg-green-300 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              🚀 Empezar Partida
            </button>
          ) : (
            <div className="w-full bg-gray-200 border-4 border-black border-dashed py-3 rounded-xl text-center font-bold text-gray-500 animate-pulse">
              Esperando al anfitrión...
            </div>
          )}
        </div>
      )}

      {/* --- PANTALLA DE JUEGO (INFO) --- */}
      {sala.estado === "JUGANDO" && (
        <div className="w-full text-center space-y-6 animate-in zoom-in duration-300">
          
          {estoyVivo ? (
             <h1 className="text-xl font-black text-gray-400 uppercase">Estás Vivo</h1>
          ) : (
             <h1 className="text-xl font-black text-red-500 uppercase">👻 Estás Muerto</h1>
          )}
          
          {/* TARJETA DE ROL */}
          {estoyVivo && (
            <div className={`p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors duration-500 ${soyImpostor ? "bg-red-400 text-white" : "bg-cyan-300 text-black"}`}>
                {soyImpostor ? (
                <div className="flex flex-col items-center">
                    <div className="text-7xl mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">🤫</div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-2">
                        IMPOSTOR
                    </h2>
                    <p className="font-bold border-2 border-black bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        ¡Engaña a todos!
                    </p>
                </div>
                ) : (
                <div className="flex flex-col items-center">
                    <div className="text-6xl mb-2">📍</div>
                    <h2 className="text-sm font-bold uppercase tracking-widest mb-1 opacity-70">
                        El lugar secreto es:
                    </h2>
                    <div className="bg-white border-2 border-black px-6 py-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                        <p className="text-3xl font-black text-black uppercase">
                            {sala.lugar}
                        </p>
                    </div>
                </div>
                )}
            </div>
          )}

          {/* AVISO DE QUIÉN EMPIEZA (Visible para TODOS porque lee sala.jugadorInicial) */}
          {sala.jugadorInicial && (
              <div className="bg-yellow-200 border-2 border-black p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1 mx-4">
                  <p className="text-xs font-bold text-black uppercase mb-1">🎲 Empieza preguntando:</p>
                  <p className="text-2xl font-black text-purple-700 uppercase tracking-wide">
                      {sala.jugadorInicial}
                  </p>
              </div>
          )}

          {/* LISTA DE JUGADORES VIVOS */}
          <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Sobrevivientes:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {listaJugadores.map((j: any) => (
                <span key={j.nombre} className={`border border-black px-2 py-1 rounded text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${j.vivo !== false ? 'bg-gray-100 text-black' : 'bg-red-100 text-red-500 line-through opacity-50'}`}>
                    {j.nombre}
                </span>
              ))}
            </div>
          </div>

          {soyAdmin && (
            <div className="space-y-3">
                <button 
                    onClick={iniciarVotacion} 
                    className="w-full bg-orange-400 hover:bg-orange-300 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all animate-pulse"
                >
                🚨 Llamar a Votación
                </button>
                
                <button 
                    onClick={finalizarRondaManual} 
                    className="w-full bg-gray-200 hover:bg-gray-300 text-black border-2 border-black py-2 rounded-xl font-bold text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
                >
                🏁 Finalizar Ronda (Revelar)
                </button>
            </div>
          )}
        </div>
      )}

      {/* --- PANTALLA DE VOTACIÓN --- */}
      {sala.estado === "VOTANDO" && (
         <div className="w-full space-y-6 text-center animate-in fade-in duration-300">
            <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter bg-yellow-300 border-4 border-black p-2 inline-block rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                ¡VOTACIÓN!
            </h1>
            
            {!estoyVivo ? (
                <p className="font-bold text-gray-400">Los muertos no votan... 💀</p>
            ) : yaVote ? (
                <p className="font-bold text-green-600 animate-bounce">¡Voto enviado! Esperando resultados...</p>
            ) : (
                <p className="font-bold text-black">¿Quién es el impostor?</p>
            )}

            <div className="grid grid-cols-2 gap-4">
                {listaJugadores.filter((j:any) => j.vivo !== false).map((j: any) => (
                    <button
                        key={j.nombre}
                        onClick={() => votarPor(j.nombre)}
                        disabled={yaVote || !estoyVivo || j.nombre === nombre}
                        className={`
                            border-4 border-black rounded-xl p-4 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
                            ${yaVote || !estoyVivo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-red-100 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                        `}
                    >
                        {j.nombre}
                        {j.votos > 0 && soyAdmin && (
                            <span className="ml-2 text-xs bg-black text-white px-1 rounded-full">{j.votos}</span>
                        )}
                    </button>
                ))}
            </div>
         </div>
      )}

      {/* --- PANTALLA DE FIN DE JUEGO --- */}
      {sala.estado === "TERMINADO" && (
        <div className="w-full text-center space-y-8 animate-in zoom-in duration-500">
            <div className={`p-6 border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${sala.ganador === 'IMPOSTOR' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
                <h1 className="text-4xl font-black uppercase mb-2">
                    {sala.ganador === 'IMPOSTOR' ? 'GANÓ EL IMPOSTOR' : (sala.ganador === 'CIUDADANOS' ? 'GANARON LOS CIUDADANOS' : 'RONDA FINALIZADA')}
                </h1>
                <p className="text-xl font-bold border-2 border-black inline-block px-4 py-1 bg-white text-black rounded-full rotate-2">
                    El impostor era: {sala.impostor}
                </p>
            </div>

            {soyAdmin && (
            <button 
                onClick={reiniciar} 
                className="w-full bg-white hover:bg-gray-100 text-black border-4 border-black py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              🔄 Nueva Partida
            </button>
          )}
        </div>
      )}

    </div>
  );
}