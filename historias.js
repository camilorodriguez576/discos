// ============================================================
//  HISTORIAS DE LOS DISCOS
//  Lo que se cuenta en "La historia detrás del disco".
//  La clave es "Artista|Álbum", escrito igual que en la hoja.
//  Si un disco no está aquí, la página busca su historia sola en Wikipedia.
//  Fuente de estos textos: Wikipedia (resumidos y traducidos).
// ============================================================

const HISTORIAS = {
  "Eagles|Hell Freezes Over": {
    texto: "En 1980, cuando le preguntaron a Don Henley cuándo volverían a tocar juntos, respondió: “cuando el infierno se congele”. Catorce años después se reunieron, y le pusieron ese nombre al disco. Mezcla un concierto grabado para MTV en 1994, con la versión acústica de “Hotel California”, y cuatro canciones nuevas. Llegó al número 1 en Estados Unidos y vendió más de 9 millones de copias allá.",
    fuente: "https://en.wikipedia.org/wiki/Hell_Freezes_Over",
  },
  "Bad English|Backlash": {
    texto: "Bad English fue un supergrupo: John Waite, la voz de The Babys, junto a Jonathan Cain y Neal Schon, de Journey. Backlash salió en 1991 por Epic, producido por Ron Nevison, y fue su segundo y último disco antes de separarse. Una pieza del rock melódico de fines de los 80 y comienzos de los 90.",
    fuente: "https://en.wikipedia.org/wiki/Backlash_(Bad_English_album)",
  },
  "Styx|The Complete Wooden Nickel Recordings": {
    texto: "Antes de llenar estadios, Styx grabó sus cuatro primeros discos para el pequeño sello Wooden Nickel, entre 1971 y 1974. Esta caja doble de 2005 los reúne remasterizados: Styx, Styx II, The Serpent Is Rising y Man of Miracles. Es el Styx más duro y progresivo, con el guitarrista original John Curulewski, e incluye “Lady”, su primer gran éxito.",
    fuente: "https://en.wikipedia.org/wiki/The_Complete_Wooden_Nickel_Recordings",
  },
  "Santana|Ceremony: Remixes & Rarities": {
    texto: "Después del éxito de Supernatural, Santana publicó en 2003 esta colección de remezclas y rarezas, en una edición limitada de 100.000 copias. Trae versiones nuevas de temas de Supernatural y Shaman, cinco canciones inéditas y colaboraciones con Rob Thomas, Wyclef Jean y Jerry Rivera, que canta una nueva versión de “Primavera”.",
    fuente: "https://en.wikipedia.org/wiki/Ceremony:_Remixes_%26_Rarities",
  },
  "U2|The Best of 1990-2000 & B-Sides": {
    texto: "El segundo gran recopilatorio de U2 repasa su década más arriesgada, de Achtung Baby a All That You Can't Leave Behind, y suma dos canciones nuevas, “Electrical Storm” y “The Hands That Built America”. Esta edición trae un segundo disco con 14 lados B de esos años. Salió en 2002 y llegó al número 1 en 13 países.",
    fuente: "https://en.wikipedia.org/wiki/The_Best_of_1990%E2%80%932000",
  },
  "The Beatles|1": {
    texto: "Salió el 13 de noviembre de 2000, justo 30 años después de la separación de la banda. Reúne en un solo CD las 27 canciones de los Beatles que llegaron al número 1 en Inglaterra o en Estados Unidos entre 1962 y 1970. Vendió más de 31 millones de copias y fue el disco más vendido de toda la década en el mundo.",
    fuente: "https://en.wikipedia.org/wiki/1_(Beatles_album)",
  },
  "Bigod 20|Carpe Diem": {
    texto: "Bigod 20 nació en Alemania en 1988, de la mano de Andreas Tomalla y Markus Nikolai, en plena ola del EBM, la música electrónica para el cuerpo. Su tema “The Bog” fue un éxito en las discotecas y les abrió las puertas de Sire Records. “Carpe Diem” salió en 1991 en ese sello.",
    fuente: "https://en.wikipedia.org/wiki/Bigod_20",
  },
  "Nirvana|Nevermind": {
    texto: "Salió en septiembre de 1991 y casi nadie esperaba lo que pasó: el video de “Smells Like Teen Spirit” explotó en MTV y, en enero de 1992, Nevermind sacó a Dangerous de Michael Jackson del número 1. Producido por Butch Vig, vendió más de 30 millones de copias. El bebé de la portada nadando hacia un billete es una de las imágenes más famosas del rock.",
    fuente: "https://en.wikipedia.org/wiki/Nevermind",
  },
};
