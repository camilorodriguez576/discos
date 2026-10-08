// ============================================================
//  LÓGICA DE LA PÁGINA
//  Lee CONFIG (config.js) y DISCOS (discos.js) y arma el catálogo.
// ============================================================

// ---------- Utilidades ----------

// Quita tildes y pasa a minúsculas para que "beatles" encuentre "Beatles"
const normalizar = (texto) =>
  String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Evita que un texto del inventario rompa el HTML
const escapar = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatoPrecio = (n) => `S/ ${Number(n).toFixed(2).replace(/\.00$/, "")}`;

// Un disco sin precio se muestra como "Consultar" (papá lo decide al momento)
const tienePrecio = (d) => Number(d.precio) > 0;
const textoPrecio = (d) => (tienePrecio(d) ? formatoPrecio(d.precio) : "Consultar");

// Link de WhatsApp con el mensaje ya escrito
const linkWhatsApp = (mensaje) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;

// Número estable a partir de un texto: da un color distinto a cada portada provisional
const tono = (texto) => [...texto].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// ---------- Datos de la tienda ----------

function pintarDatosTienda() {
  document.title = `${CONFIG.nombreTienda} · CDs en Lima`;
  document.getElementById("nombre-tienda").textContent = CONFIG.nombreTienda;
  document.getElementById("lema").textContent = CONFIG.lema;
  document.getElementById("pie-nombre").textContent = `© ${new Date().getFullYear()} ${CONFIG.nombreTienda} · Lima, Perú`;

  document.getElementById("btn-whatsapp-hero").href =
    linkWhatsApp(`Hola, vi el catálogo de ${CONFIG.nombreTienda} y tengo una consulta.`);

  document.getElementById("puntos").innerHTML =
    CONFIG.puntosEntrega.map((p) => `<li>${escapar(p)}</li>`).join("");
  document.getElementById("pagos").innerHTML =
    CONFIG.pagos.map((p) => `<li>${escapar(p)}</li>`).join("");
  document.getElementById("pagos-texto").textContent =
    `Pagas al recibir o antes con ${CONFIG.pagos.join(", ").replace(/, ([^,]*)$/, " o $1")}.`;

  const redes = [];
  if (CONFIG.facebook) redes.push(`<a href="${escapar(CONFIG.facebook)}" target="_blank" rel="noopener">Facebook</a>`);
  if (CONFIG.instagram) redes.push(`<a href="${escapar(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  document.getElementById("redes").innerHTML = redes.join("");
}

// ---------- Filtros ----------

const filtro = { texto: "", estado: "", genero: "", orden: "novedad" };

// Se llena al iniciar: desde la hoja de Google o, si no está configurada, desde discos.js
let disponibles = [];

function llenarGeneros() {
  const generos = [...new Set(disponibles.map((d) => d.genero).filter(Boolean))].sort();
  document.getElementById("genero").insertAdjacentHTML(
    "beforeend",
    generos.map((g) => `<option value="${escapar(g)}">${escapar(g)}</option>`).join("")
  );
}

function discosFiltrados() {
  const q = normalizar(filtro.texto);
  const lista = disponibles.filter((d) =>
    (!q || normalizar(`${d.artista} ${d.album}`).includes(q)) &&
    (!filtro.estado || d.estado === filtro.estado) &&
    (!filtro.genero || d.genero === filtro.genero)
  );

  const ordenes = {
    "novedad": (a, b) => (b.novedad === true) - (a.novedad === true) || a.artista.localeCompare(b.artista),
    // Los de "Consultar" van al final en ambos órdenes de precio
    "precio-asc": (a, b) => tienePrecio(b) - tienePrecio(a) || a.precio - b.precio,
    "precio-desc": (a, b) => tienePrecio(b) - tienePrecio(a) || b.precio - a.precio,
    "artista": (a, b) => a.artista.localeCompare(b.artista),
    "anio": (a, b) => (a.anio || 9999) - (b.anio || 9999),
  };
  return lista.sort(ordenes[filtro.orden]);
}

// ---------- Catálogo ----------

function tarjeta(d) {
  const mensaje = tienePrecio(d)
    ? `Hola, me interesa el CD "${d.album}" de ${d.artista} (${d.estado}, ${formatoPrecio(d.precio)}). ¿Sigue disponible?`
    : `Hola, me interesa el CD "${d.album}" de ${d.artista} (${d.estado}). ¿Cuál es su precio?`;
  const claseEstado = d.estado === "Nuevo" ? "etq--nuevo" : "etq--usado";
  return `
    <article class="disco">
      <div class="portada" style="--h:${tono(d.artista + d.album)}"
           data-artista="${escapar(d.artista)}" data-album="${escapar(d.album)}" data-portada="${escapar(d.portada || "")}">
        <div class="etiquetas">
          <span class="etq ${claseEstado}">${escapar(d.estado)}</span>
          ${d.novedad ? '<span class="etq etq--novedad">Llegó</span>' : ""}
        </div>
        ${escapar(d.album)}
      </div>
      <div class="disco__info">
        <h3 class="disco__album">${escapar(d.album)}</h3>
        <p class="disco__artista">${escapar(d.artista)}</p>
        <p class="disco__meta">${[d.anio, d.genero].filter(Boolean).map(escapar).join(" · ")}</p>
        ${d.detalle ? `<p class="disco__detalle">${escapar(d.detalle)}</p>` : ""}
        <div class="disco__pie">
          <span class="precio${tienePrecio(d) ? "" : " precio--consultar"}">${textoPrecio(d)}</span>
          <a class="btn btn--wa" href="${linkWhatsApp(mensaje)}" target="_blank" rel="noopener">Lo quiero</a>
        </div>
      </div>
    </article>`;
}

function pintarCatalogo() {
  const lista = discosFiltrados();
  document.getElementById("catalogo").innerHTML = lista.map(tarjeta).join("");
  document.getElementById("contador").textContent =
    `Mostrando ${lista.length} de ${disponibles.length} discos`;

  const vacio = document.getElementById("vacio");
  vacio.hidden = lista.length > 0;
  if (disponibles.length === 0) {
    // Todavía no hay discos en la hoja (por ejemplo, mientras se escanean)
    document.getElementById("contador").textContent = "";
    vacio.querySelector("p").textContent = "Estamos subiendo nuestros discos. Mientras tanto, pregúntanos por el que buscas.";
    document.getElementById("btn-pedido").textContent = "Pregúntanos por WhatsApp";
    document.getElementById("btn-pedido").href = linkWhatsApp(`Hola, vi la página de ${CONFIG.nombreTienda}. ¿Tienen este disco?`);
  } else if (lista.length === 0) {
    const buscado = filtro.texto ? `"${filtro.texto}"` : "un disco";
    document.getElementById("btn-pedido").href =
      linkWhatsApp(`Hola, ¿tienen ${buscado}? No lo vi en el catálogo.`);
  }

  document.querySelectorAll(".portada").forEach((el) => observador.observe(el));
}

// ---------- Portadas automáticas ----------
// Si el disco no tiene foto propia, se busca la portada en internet:
// primero en iTunes y, si no aparece, en Deezer. Las dos son gratis.
// Si alguna sale equivocada, pon el link correcto en el campo "portada" del disco.
// Se guarda en el navegador para no buscarla de nuevo.

const CLAVE_CACHE = "portadas-v5";
let cachePortadas = {};
try { cachePortadas = JSON.parse(localStorage.getItem(CLAVE_CACHE)) || {}; } catch { /* sin almacenamiento */ }

function guardarCache() {
  try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(cachePortadas)); } catch { /* sin almacenamiento */ }
}

function mostrarImagen(el, url) {
  if (!url || el.querySelector("img")) return;
  const img = new Image();
  img.alt = `Portada de ${el.dataset.album}`;
  img.onload = () => img.classList.add("is-loaded");
  img.onerror = () => img.remove(); // si falla, queda la portada de color
  img.src = url;
  el.appendChild(img);
}

// JSONP: cargamos un <script> que nos llama de vuelta con los datos.
// Así funciona sin servidor propio, incluso abriendo el archivo directo.
let contadorJsonp = 0;
function jsonp(url, espera = 8000) {
  return new Promise((resolver) => {
    const nombre = `__jsonp${++contadorJsonp}`;
    const script = document.createElement("script");
    const terminar = (datos) => { clearTimeout(limite); delete window[nombre]; script.remove(); resolver(datos); };
    const limite = setTimeout(() => terminar(null), espera);
    window[nombre] = terminar;
    script.onerror = () => terminar(null);
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + nombre;
    document.head.appendChild(script);
  });
}

// Solo aceptamos un resultado del mismo artista y cuyo título coincida con el álbum
// (mejor sin portada que con la portada de otro disco)
const limpio = (t) => normalizar(t).replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9]/g, "");
const exacto = (t) => normalizar(t).replace(/[^a-z0-9]/g, "");
function elegir(resultados, artista, album, leerArtista, leerTitulo) {
  const delArtista = resultados.filter((x) => limpio(leerArtista(x)) === limpio(artista));
  // 1º el título idéntico (edición original); 2º igual sin lo que va entre paréntesis ("Remastered", "Deluxe"...)
  return delArtista.find((x) => exacto(leerTitulo(x)) === exacto(album))
    || delArtista.find((x) => limpio(leerTitulo(x)) === (limpio(album) || exacto(album)));
}

async function buscarEnDeezer(artista, album) {
  const q = encodeURIComponent(`artist:"${artista}" album:"${album}"`);
  const datos = await jsonp(`https://api.deezer.com/search/album?q=${q}&limit=10&output=jsonp`);
  const r = elegir(datos?.data || [], artista, album, (x) => x.artist?.name, (x) => x.title);
  return r ? r.cover_big : null;
}

async function buscarEnItunes(artista, album) {
  const q = encodeURIComponent(`${artista} ${album}`);
  const datos = await jsonp(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10&country=US`);
  const r = elegir(datos?.results || [], artista, album, (x) => x.artistName, (x) => x.collectionName);
  return r ? r.artworkUrl100.replace("100x100bb", "600x600bb") : null;
}

async function buscarPortada(artista, album) {
  return (await buscarEnItunes(artista, album)) || (await buscarEnDeezer(artista, album));
}

// Fila de espera: máximo 3 búsquedas a la vez para no saturar los servicios
const fila = [];
const MAX_BUSQUEDAS = 3;
let activas = 0;
async function procesarFila() {
  if (activas >= MAX_BUSQUEDAS) return;
  activas++;
  while (fila.length) {
    const el = fila.shift();
    const clave = `${el.dataset.artista}|${el.dataset.album}`;
    if (!(clave in cachePortadas)) {
      cachePortadas[clave] = await buscarPortada(el.dataset.artista, el.dataset.album);
      guardarCache();
    }
    mostrarImagen(el, cachePortadas[clave]);
  }
  activas--;
}

function cargarPortada(el) {
  if (el.dataset.portada) return mostrarImagen(el, el.dataset.portada);
  const clave = `${el.dataset.artista}|${el.dataset.album}`;
  if (clave in cachePortadas) return mostrarImagen(el, cachePortadas[clave]);
  fila.push(el);
  procesarFila();
}

// Solo cargamos las portadas que se ven en pantalla (importante con 1,000 discos)
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) {
      observador.unobserve(e.target);
      cargarPortada(e.target);
    }
  });
}, { rootMargin: "200px" });

// ---------- Eventos ----------

document.getElementById("buscar").addEventListener("input", (e) => {
  filtro.texto = e.target.value.trim();
  pintarCatalogo();
});

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    filtro.estado = chip.dataset.estado;
    pintarCatalogo();
  })
);

document.getElementById("genero").addEventListener("change", (e) => {
  filtro.genero = e.target.value;
  pintarCatalogo();
});

document.getElementById("orden").addEventListener("change", (e) => {
  filtro.orden = e.target.value;
  pintarCatalogo();
});

// ---------- Inicio ----------

// Trae los discos de la hoja de Google; si no hay hoja configurada, usa los de ejemplo
async function cargarDiscos() {
  if (!CONFIG.hojaURL) return DISCOS.filter((d) => d.disponible !== false);
  // "?t=..." cambia en cada visita para que el navegador no muestre una lista guardada vieja
  const datos = await jsonp(`${CONFIG.hojaURL}?t=${Date.now()}`, 15000);
  if (!datos || !Array.isArray(datos.discos)) throw new Error("No se pudo leer la hoja");
  return datos.discos.map((d) => ({
    ...d,
    artista: String(d.artista),
    album: String(d.album),
    precio: Number(d.precio) || null,
    anio: Number(d.anio) || "",
    novedad: d.novedad === true,
  }));
}

async function iniciar() {
  pintarDatosTienda();
  const contador = document.getElementById("contador");
  contador.textContent = "Cargando discos…";
  try {
    disponibles = await cargarDiscos();
  } catch {
    contador.textContent = "No pudimos cargar el catálogo. Revisa tu conexión o escríbenos por WhatsApp.";
    return;
  }
  llenarGeneros();
  pintarCatalogo();
}

iniciar();
