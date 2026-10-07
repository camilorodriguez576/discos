// ============================================================
//  INVENTARIO DE DISCOS (datos de ejemplo)
//  Más adelante esto se leerá automáticamente desde Google Sheets.
//
//  Campos de cada disco:
//    artista, album, anio, genero
//    estado:      "Nuevo" o "Usado"
//    precio:      en soles, solo el número (null = "Consultar precio")
//    detalle:     (opcional) comentario del estado, sobre todo en usados
//    portada:     (opcional) link a una foto propia; si está vacío,
//                 la página busca la portada sola en internet
//    novedad:     true si acaba de llegar
//    disponible:  false cuando se vende (así desaparece de la página)
// ============================================================

const DISCOS = [
  { artista: "Nirvana", album: "Nevermind", anio: 1991, genero: "Rock", estado: "Usado", precio: 30, detalle: "Disco impecable, caja con rayones leves", novedad: true },
  { artista: "Queen", album: "Greatest Hits", anio: 1981, genero: "Rock", estado: "Nuevo", precio: 65, detalle: "Sellado" },
  { artista: "The Beatles", album: "Abbey Road", anio: 1969, genero: "Rock", estado: "Nuevo", precio: 75, detalle: "Remaster, sellado", novedad: true },
  { artista: "Michael Jackson", album: "Thriller", anio: 1982, genero: "Pop", estado: "Usado", precio: 28, detalle: "Incluye librillo completo" },
  { artista: "Pink Floyd", album: "The Dark Side of the Moon", anio: 1973, genero: "Rock", estado: "Usado", precio: 35, detalle: "Muy buen estado" },
  { artista: "Guns N' Roses", album: "Appetite for Destruction", anio: 1987, genero: "Rock", estado: "Usado", precio: 30, detalle: "Disco con marcas leves, suena perfecto" },
  { artista: "Madonna", album: "The Immaculate Collection", anio: 1990, genero: "Pop", estado: "Usado", precio: 25 },
  { artista: "U2", album: "The Joshua Tree", anio: 1987, genero: "Rock", estado: "Nuevo", precio: 60, detalle: "Sellado" },
  { artista: "Metallica", album: "Metallica", anio: 1991, genero: "Metal", estado: "Usado", precio: 32, detalle: "El 'Black Album', excelente estado" },
  { artista: "Coldplay", album: "A Rush of Blood to the Head", anio: 2002, genero: "Pop Rock", estado: "Usado", precio: 22 },
  { artista: "Fleetwood Mac", album: "Rumours", anio: 1977, genero: "Rock", estado: "Nuevo", precio: 70, detalle: "Sellado", novedad: true },
  { artista: "Red Hot Chili Peppers", album: "Californication", anio: 1999, genero: "Rock", estado: "Usado", precio: 28 },
  { artista: "Oasis", album: "(What's the Story) Morning Glory?", anio: 1995, genero: "Rock", estado: "Usado", precio: 28, detalle: "Caja nueva de reemplazo" },
  { artista: "AC/DC", album: "Back in Black", anio: 1980, genero: "Rock", estado: "Nuevo", precio: 65, detalle: "Sellado" },
  { artista: "Bon Jovi", album: "Slippery When Wet", anio: 1986, genero: "Rock", estado: "Usado", precio: 25 },
  { artista: "The Police", album: "Synchronicity", anio: 1983, genero: "Rock", estado: "Usado", precio: null },
  { artista: "Radiohead", album: "OK Computer", anio: 1997, genero: "Rock Alternativo", estado: "Nuevo", precio: 70, detalle: "Sellado" },
  { artista: "Whitney Houston", album: "Whitney Houston", anio: 1985, genero: "Pop", estado: "Usado", precio: 20 },
  { artista: "Depeche Mode", album: "Violator", anio: 1990, genero: "Synth Pop", estado: "Usado", precio: 30, detalle: "Edición importada" },
  { artista: "Eagles", album: "Hotel California", anio: 1976, genero: "Rock", estado: "Usado", precio: 28 },
  { artista: "Led Zeppelin", album: "Led Zeppelin IV", anio: 1971, genero: "Rock", estado: "Usado", precio: 30, disponible: false },
];
