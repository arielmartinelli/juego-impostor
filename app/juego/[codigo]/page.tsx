"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { db } from "../../firebase"; // Ajustamos la ruta para salir dos carpetas atrás
import { ref, onValue, update } from "firebase/database";

// Lugares posibles para el juego
const PALABRAS = [
  "Hospital", "Playa", "Escuela", "Submarino", "Estación Espacial", 
    "Cine", "Supermercado", "Banco", "Avión", "Circo", 
    "Cementerio", "Castillo Medieval", "Pirámide de Egipto", "Polo Norte", "Cárcel", 
    "Gimnasio", "Biblioteca", "Restaurante de Sushi", "Volcán", "Parque de Diversiones",
    "Microondas", "Sartén", "Inodoro", "Guitarra", "Computadora", 
    "Zapato", "Reloj", "Paraguas", "Cepillo de Dientes", "Control Remoto", 
    "Papel Higiénico", "Espejo", "Licuadora", "Escoba", "Almohada", 
    "Bicicleta", "Cuchara", "Llaves", "Calcetín", "Gafas de Sol",
    "Lionel Messi", "Shakira", "Bob Esponja", "Spider-Man", "Batman", 
    "Mickey Mouse", "Cristiano Ronaldo", "Harry Potter", "Goku", "Taylor Swift", 
    "La Roca", "Barbie", "Mario Bros", "El Chavo del 8", "Darth Vader", 
    "Pikachu", "Iron Man", "Bad Bunny", "Homero Simpson", "Will Smith",
    "Jirafa", "Elefante", "Tiburón", "Gato", "Perro", 
    "Pingüino", "T-Rex", "León", "Gallina", "Mosquito", 
    "Canguro", "Oso Panda", "Delfín", "Cocodrilo", "Murciélago", 
    "Unicornio", "Hormiga", "Ballena", "Tortuga", "Lobo"
];

export default function JuegoPage() {
  const { codigo } = useParams(); // El código de la URL (Ej: A1B2)
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre"); // El nombre que pusiste en el inicio

  const [sala, setSala] = useState<any>(null);
  const [mensaje, setMensaje] = useState("Cargando...");

  // 1. CONECTARSE A LA SALA (Escuchar cambios en tiempo real)
  useEffect(() => {
    if (!codigo || !nombre) return;

    // Referencia a esta sala específica en Firebase
    const salaRef = ref(db, `salas/${codigo}`);

    // Unirse a la lista de jugadores (si no estoy ya)
    update(ref(db, `salas/${codigo}/jugadores/${nombre}`), {
      nombre: nombre,
      conectado: true
    });

    // ESCUCHAR (El Listener Mágico)
    const unsub = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
      } else {
        setMensaje("La sala no existe o fue borrada.");
      }
    });

    return () => unsub(); // Limpiar al salir
  }, [codigo, nombre]);

  // 2. LÓGICA PARA EMPEZAR PARTIDA (Solo el Admin)
  const empezarPartida = () => {
    const jugadoresArr = Object.values(sala.jugadores || {});
    if (jugadoresArr.length < 3) return alert("Se necesitan al menos 3 jugadores");

    // Elegir lugar e impostor al azar
    const lugarSecreto = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    const impostorIndex = Math.floor(Math.random() * jugadoresArr.length);
    const nombreImpostor = (jugadoresArr[impostorIndex] as any).nombre;

    // Actualizar Firebase (¡Esto avisa a todos los celulares!)
    update(ref(db, `salas/${codigo}`), {
      estado: "JUGANDO",
      lugar: lugarSecreto,
      impostor: nombreImpostor
    });
  };

  // 3. REINICIAR PARA JUGAR OTRA VEZ
  const reiniciar = () => {
    update(ref(db, `salas/${codigo}`), {
      estado: "ESPERANDO",
      lugar: "",
      impostor: ""
    });
  };

  if (!sala) return <div className="bg-gray-900 min-h-screen text-white p-10 text-center">{mensaje}</div>;

  // --- INTERFAZ ---
  const soyAdmin = sala.host === nombre;
  const esMiTurnoDeImpostor = sala.impostor === nombre;
  const listaJugadores = Object.values(sala.jugadores || []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
      
      {/* CABECERA */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-yellow-500">Sala: {codigo}</h2>
        <div className="bg-gray-800 px-3 py-1 rounded text-sm">👤 {nombre}</div>
      </div>

      {/* --- PANTALLA DE ESPERA --- */}
      {sala.estado === "ESPERANDO" && (
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-3xl font-bold">⏳ Esperando jugadores...</h1>
          
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-gray-400 mb-2 text-sm uppercase">Jugadores conectados ({listaJugadores.length})</h3>
            <ul className="space-y-2">
              {listaJugadores.map((j: any) => (
                <li key={j.nombre} className="flex items-center gap-2 border-b border-gray-700 pb-1">
                  <span className="text-green-400">●</span> {j.nombre} {j.nombre === sala.host && "👑"}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-900/30 p-4 rounded border border-blue-800">
            <p className="text-sm text-blue-300 mb-2">Comparte este código con tus amigos:</p>
            <p className="text-4xl font-mono font-bold tracking-widest select-all">{codigo}</p>
          </div>

          {soyAdmin ? (
            <button onClick={empezarPartida} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-xl shadow-lg transition transform active:scale-95">
              🚀 EMPEZAR PARTIDA
            </button>
          ) : (
            <p className="text-gray-500 italic animate-pulse">Esperando a que el líder inicie...</p>
          )}
        </div>
      )}

      {/* --- PANTALLA DE JUEGO (REVELACIÓN) --- */}
      {sala.estado === "JUGANDO" && (
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <h1 className="text-2xl font-bold text-gray-400">TU ROL ES:</h1>
          
          <div className={`p-8 rounded-2xl shadow-2xl border-4 ${esMiTurnoDeImpostor ? "bg-red-900/50 border-red-500" : "bg-blue-900/50 border-blue-500"}`}>
            {esMiTurnoDeImpostor ? (
              <>
                <div className="text-6xl mb-4">🤫</div>
                <h2 className="text-4xl font-black text-red-500 mb-2">IMPOSTOR</h2>
                <p className="text-red-200">¡No sabes que palabra es! Engaña a todos.</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📍</div>
                <h2 className="text-xl text-blue-300 uppercase tracking-widest mb-1">LLa palabar es:</h2>
                <p className="text-4xl font-black text-white">{sala.lugar}</p>
              </>
            )}
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Jugadores en la sala:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {listaJugadores.map((j: any) => (
                <span key={j.nombre} className="bg-gray-700 px-2 py-1 rounded text-xs">{j.nombre}</span>
              ))}
            </div>
          </div>

          {soyAdmin && (
            <button onClick={reiniciar} className="mt-8 bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded text-sm">
              🔄 Jugar otra vez
            </button>
          )}
        </div>
      )}

    </div>
  );
}