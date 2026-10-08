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
  const enPedido = pedido.has(claveDisco(d));
  const c = escapar(claveDisco(d));
  return `
    <article class="disco">
      <button type="button" class="disco__abrir" data-ficha="${c}" aria-label="Ver ${escapar(d.album)} de ${escapar(d.artista)}">
        <span class="disco__cd" aria-hidden="true"></span>
        <div class="portada" style="--h:${tono(d.artista + d.album)}"
             data-artista="${escapar(d.artista)}" data-album="${escapar(d.album)}" data-portada="${escapar(d.portada || "")}">
          ${etiquetasEstado(d)}
          ${escapar(d.album)}
          <span class="sticker${tienePrecio(d) ? "" : " sticker--consultar"}">${textoPrecio(d)}</span>
        </div>
      </button>
      <div class="disco__info">
        <h3 class="disco__album" data-ficha="${c}">${escapar(d.album)}</h3>
        <p class="disco__artista">${escapar(d.artista)}</p>
        <p class="disco__meta mono">${[d.anio, d.genero].filter(Boolean).map(escapar).join(" · ")}</p>
      </div>
      <button type="button" class="btn btn--agregar" data-clave="${c}"
              aria-pressed="${enPedido}">${enPedido ? "✓ En tu pedido" : "Agregar al pedido"}</button>
    </article>`;
}

function etiquetasEstado(d) {
  return `<div class="etiquetas">
      <span class="etq ${d.estado === "Nuevo" ? "etq--nuevo" : "etq--usado"}">${escapar(d.estado)}</span>
      ${d.novedad ? '<span class="etq etq--novedad">Llegó</span>' : ""}
    </div>`;
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
    document.getElementById("vacio-titulo").textContent = "Estamos subiendo nuestros discos";
    document.getElementById("vacio-texto").textContent = "Dinos qué disco buscas y te avisamos por WhatsApp si lo tenemos.";
  } else if (lista.length === 0) {
    document.getElementById("vacio-titulo").textContent = "No lo tenemos ahora";
    document.getElementById("vacio-texto").textContent = filtro.texto
      ? `¿Buscas “${filtro.texto}”? Déjanos tu nombre y te avisamos por WhatsApp apenas llegue.`
      : "Déjanos tu nombre y te avisamos por WhatsApp apenas llegue.";
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

async function albumEnItunes(artista, album) {
  const q = encodeURIComponent(`${artista} ${album}`);
  const datos = await jsonp(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10&country=US`);
  return elegir(datos?.results || [], artista, album, (x) => x.artistName, (x) => x.collectionName);
}

async function buscarEnItunes(artista, album) {
  const r = await albumEnItunes(artista, album);
  return r ? r.artworkUrl100.replace("100x100bb", "600x600bb") : null;
}

// Lista de canciones del disco (iTunes y, si no está, Deezer)
const cacheCanciones = new Map();
async function buscarCanciones(artista, album) {
  const clave = `${artista}|${album}`;
  if (cacheCanciones.has(clave)) return cacheCanciones.get(clave);
  let canciones = [];
  const it = await albumEnItunes(artista, album);
  if (it) {
    const datos = await jsonp(`https://itunes.apple.com/lookup?id=${it.collectionId}&entity=song&country=US`);
    canciones = (datos?.results || [])
      .filter((x) => x.wrapperType === "track")
      .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
      .map((x) => ({ titulo: x.trackName, ms: x.trackTimeMillis }));
  }
  if (!canciones.length) {
    const q = encodeURIComponent(`artist:"${artista}" album:"${album}"`);
    const datos = await jsonp(`https://api.deezer.com/search/album?q=${q}&limit=10&output=jsonp`);
    const dz = elegir(datos?.data || [], artista, album, (x) => x.artist?.name, (x) => x.title);
    if (dz) {
      const pistas = await jsonp(`https://api.deezer.com/album/${dz.id}/tracks?limit=100&output=jsonp`);
      canciones = (pistas?.data || []).map((x) => ({ titulo: x.title, ms: x.duration * 1000 }));
    }
  }
  cacheCanciones.set(clave, canciones);
  return canciones;
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

// ---------- Mi pedido ----------
// El cliente junta varios discos y los manda en un solo mensaje de WhatsApp.
// Se guarda en el navegador para que no se pierda si recarga la página.

const CLAVE_PEDIDO = "pedido-v1";
const claveDisco = (d) => `${d.artista}|${d.album}|${d.estado}`;
const pedido = new Map(); // clave -> disco

function guardarPedido() {
  try { localStorage.setItem(CLAVE_PEDIDO, JSON.stringify([...pedido.keys()])); } catch { /* sin almacenamiento */ }
}

// Al cargar, recupera el pedido guardado (sin los discos que ya se vendieron)
function recuperarPedido() {
  let claves = [];
  try { claves = JSON.parse(localStorage.getItem(CLAVE_PEDIDO)) || []; } catch { /* sin almacenamiento */ }
  const porClave = new Map(disponibles.map((d) => [claveDisco(d), d]));
  claves.forEach((c) => porClave.has(c) && pedido.set(c, porClave.get(c)));
}

const totalPedido = () => [...pedido.values()].filter(tienePrecio).reduce((s, d) => s + d.precio, 0);
const aConsultar = () => [...pedido.values()].filter((d) => !tienePrecio(d)).length;
const formaElegida = () => document.querySelector('input[name="forma"]:checked')?.value || "";

function pintarBarraPedido() {
  const n = pedido.size;
  document.getElementById("barra-pedido").hidden = n === 0;
  document.body.classList.toggle("con-pedido", n > 0);
  if (!n) return;
  document.getElementById("pedido-cuenta").textContent = `Tu pedido: ${n} disco${n === 1 ? "" : "s"}`;
  const consultar = aConsultar();
  document.getElementById("pedido-total").textContent =
    `Total ${formatoPrecio(totalPedido())}${consultar ? ` + ${consultar} a consultar` : ""}`;
}

function mensajePedido() {
  const lineas = [...pedido.values()].map((d) =>
    `• ${d.album} – ${d.artista} (${d.estado}) ${tienePrecio(d) ? formatoPrecio(d.precio) : "precio a consultar"}`);
  return `Hola, quiero pedir estos CDs:\n${lineas.join("\n")}\n\n` +
    `Total: ${formatoPrecio(totalPedido())}${aConsultar() ? " + los de precio a consultar" : ""}\n` +
    `Pago: ${formaElegida()}\n¿Están disponibles?`;
}

function pintarResumen() {
  if (!pedido.size) return document.getElementById("resumen").close();
  document.getElementById("lineas").innerHTML = [...pedido.entries()].map(([c, d]) => `
    <li>
      <span><b>${escapar(d.album)}</b><small>${escapar(d.artista)} · ${escapar(d.estado)}</small></span>
      <span class="monto">${textoPrecio(d)}</span>
      <button type="button" class="quitar" data-clave="${escapar(c)}" aria-label="Quitar ${escapar(d.album)}">×</button>
    </li>`).join("");
  document.getElementById("total-monto").textContent = formatoPrecio(totalPedido());
  document.getElementById("total-nota").textContent = aConsultar() ? "Total sin los de “consultar”" : "Total";
  document.getElementById("btn-enviar").href = linkWhatsApp(mensajePedido());
}

function pintarFormasPago() {
  document.getElementById("formas").insertAdjacentHTML("beforeend", CONFIG.pagos.map((p, i) => `
    <label><input type="radio" name="forma" value="${escapar(p)}"${i === 0 ? " checked" : ""}> ${escapar(p)}</label>`).join(""));
}

function alternarEnPedido(c) {
  if (pedido.has(c)) pedido.delete(c);
  else pedido.set(c, disponibles.find((d) => claveDisco(d) === c));
  guardarPedido();
  pintarBarraPedido();
}

// ---------- Ficha del disco (estuche en 3D) ----------

const $ = (id) => document.getElementById(id);
let fichaActual = null;
const giro = { rx: -8, ry: -24 };

function ponerGiro() {
  $("estuche").style.setProperty("--rx", `${giro.rx}deg`);
  $("estuche").style.setProperty("--ry", `${giro.ry}deg`);
  // ¿Se está viendo la parte de atrás?
  const angulo = ((giro.ry % 360) + 360) % 360;
  $("btn-girar").textContent = angulo > 90 && angulo < 270 ? "Ver portada" : "Ver contraportada";
}

const duracion = (ms) => {
  const s = Math.round((ms || 0) / 1000);
  return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "";
};

async function urlPortada(d) {
  if (d.portada) return d.portada;
  const clave = `${d.artista}|${d.album}`;
  if (!(clave in cachePortadas)) {
    cachePortadas[clave] = await buscarPortada(d.artista, d.album);
    guardarCache();
  }
  return cachePortadas[clave];
}

function pintarBotonFicha() {
  const esta = pedido.has(claveDisco(fichaActual));
  $("ficha-agregar").setAttribute("aria-pressed", esta);
  $("ficha-agregar").textContent = esta ? "✓ En tu pedido" : "Agregar al pedido";
}

async function abrirFicha(c) {
  const d = disponibles.find((x) => claveDisco(x) === c);
  if (!d) return;
  fichaActual = d;
  const ficha = $("ficha");
  ficha.style.setProperty("--h", tono(d.artista + d.album));

  // Estuche: vuelve a su posición, con el disco guardado
  Object.assign(giro, { rx: -8, ry: -24 });
  ponerGiro();
  $("cd3d").classList.remove("fuera");
  $("btn-sacar").textContent = "Sacar el disco";

  const tapa = $("tapa-frente");
  tapa.textContent = d.album;
  tapa.classList.remove("con-imagen");
  tapa.style.backgroundImage = "";
  $("cd-etiqueta").style.backgroundImage = "";
  $("lomo-texto").textContent = `${d.artista} · ${d.album}`;
  $("contra-titulo").textContent = d.album;
  $("contra-codigo").textContent = d.codigo || "";
  $("contra-canciones").innerHTML = "";

  // Datos
  $("ficha-etiquetas").innerHTML = etiquetasEstado(d).replace(/<\/?div[^>]*>/g, "");
  $("ficha-album").textContent = d.album;
  $("ficha-artista").textContent = d.artista;
  $("ficha-datos").innerHTML = [["Año", d.anio], ["Género", d.genero], ["Estado", d.estado], ["Código", d.codigo]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapar(v)}</dd></div>`).join("");
  $("ficha-detalle").textContent = d.detalle || "";
  $("ficha-detalle").hidden = !d.detalle;
  $("ficha-precio").textContent = textoPrecio(d);
  $("ficha-precio").className = "ficha__precio" + (tienePrecio(d) ? "" : " ficha__precio--consultar");
  pintarBotonFicha();
  $("ficha-preguntar").href = linkWhatsApp(tienePrecio(d)
    ? `Hola, me interesa el CD "${d.album}" de ${d.artista} (${d.estado}, ${formatoPrecio(d.precio)}). ¿Sigue disponible?`
    : `Hola, me interesa el CD "${d.album}" de ${d.artista} (${d.estado}). ¿Cuál es su precio?`);

  $("canciones").innerHTML = "";
  $("canciones-estado").textContent = "Buscando las canciones…";
  $("canciones-estado").hidden = false;

  if (!ficha.open) ficha.showModal();

  // Portada y canciones llegan de internet; si mientras tanto abrió otro disco, no se pintan
  urlPortada(d).then((url) => {
    if (fichaActual !== d || !url) return;
    tapa.style.backgroundImage = `url("${url}")`;
    tapa.classList.add("con-imagen");
    $("cd-etiqueta").style.backgroundImage = `url("${url}")`;
  });
  const canciones = await buscarCanciones(d.artista, d.album);
  if (fichaActual !== d) return;
  if (!canciones.length) {
    $("canciones-estado").textContent = "No encontramos la lista de canciones de este disco.";
    return;
  }
  $("canciones-estado").hidden = true;
  $("canciones").innerHTML = canciones
    .map((x) => `<li><span>${escapar(x.titulo)}</span><span>${duracion(x.ms)}</span></li>`).join("");
  $("contra-canciones").innerHTML = canciones.slice(0, 20).map((x) => `<li>${escapar(x.titulo)}</li>`).join("");
}

// Girar el estuche arrastrando con el dedo o el mouse
(function () {
  const escena = $("escena");
  let inicio = null;
  escena.addEventListener("pointerdown", (e) => {
    inicio = { x: e.clientX, y: e.clientY, rx: giro.rx, ry: giro.ry };
    escena.setPointerCapture(e.pointerId);
    $("estuche").classList.add("arrastrando");
  });
  escena.addEventListener("pointermove", (e) => {
    if (!inicio) return;
    giro.ry = inicio.ry + (e.clientX - inicio.x) * 0.6;
    giro.rx = Math.max(-45, Math.min(45, inicio.rx - (e.clientY - inicio.y) * 0.4));
    ponerGiro();
  });
  const soltar = () => { inicio = null; $("estuche").classList.remove("arrastrando"); };
  escena.addEventListener("pointerup", soltar);
  escena.addEventListener("pointercancel", soltar);
})();

$("btn-girar").addEventListener("click", () => { giro.ry += 180; ponerGiro(); });
$("btn-sacar").addEventListener("click", () => {
  const fuera = $("cd3d").classList.toggle("fuera");
  $("btn-sacar").textContent = fuera ? "Guardar el disco" : "Sacar el disco";
});
$("ficha-cerrar").addEventListener("click", () => $("ficha").close());
$("ficha").addEventListener("close", () => { fichaActual = null; });
$("ficha-agregar").addEventListener("click", () => {
  alternarEnPedido(claveDisco(fichaActual));
  pintarBotonFicha();
  pintarCatalogo();
});

// ---------- Eventos ----------

document.getElementById("catalogo").addEventListener("click", (e) => {
  const abrir = e.target.closest("[data-ficha]");
  if (abrir) return abrirFicha(abrir.dataset.ficha);
  const boton = e.target.closest(".btn--agregar");
  if (!boton) return;
  alternarEnPedido(boton.dataset.clave);
  const esta = pedido.has(boton.dataset.clave);
  boton.setAttribute("aria-pressed", esta);
  boton.textContent = esta ? "✓ En tu pedido" : "Agregar al pedido";
});

document.getElementById("btn-ver-pedido").addEventListener("click", () => {
  pintarResumen();
  document.getElementById("resumen").showModal();
});

document.getElementById("resumen-cerrar").addEventListener("click", () => document.getElementById("resumen").close());

document.getElementById("lineas").addEventListener("click", (e) => {
  const quitar = e.target.closest(".quitar");
  if (!quitar) return;
  alternarEnPedido(quitar.dataset.clave);
  pintarResumen();
  pintarCatalogo();
});

document.getElementById("formas").addEventListener("change", () => {
  document.getElementById("btn-enviar").href = linkWhatsApp(mensajePedido());
});

// Una vez enviado, el pedido se vacía para que pueda armar otro
document.getElementById("btn-enviar").addEventListener("click", () => {
  pedido.clear();
  guardarPedido();
  pintarBarraPedido();
  pintarCatalogo();
  document.getElementById("resumen").close();
});

// "Avísame cuando llegue": abre WhatsApp con el pedido del disco que no está
document.getElementById("form-aviso").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("aviso-nombre").value.trim();
  const buscado = filtro.texto ? `“${filtro.texto}”` : "un disco que no vi en el catálogo";
  const mensaje = `Hola${nombre ? `, soy ${nombre}` : ""}. Busco ${buscado}. ¿Me avisan cuando lo tengan?`;
  window.open(linkWhatsApp(mensaje), "_blank", "noopener");
});

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
  pintarFormasPago();
  const contador = document.getElementById("contador");
  contador.textContent = "Cargando discos…";
  try {
    disponibles = await cargarDiscos();
  } catch {
    contador.textContent = "No pudimos cargar el catálogo. Revisa tu conexión o escríbenos por WhatsApp.";
    return;
  }
  llenarGeneros();
  recuperarPedido();
  pintarCatalogo();
  pintarBarraPedido();
}

iniciar();
