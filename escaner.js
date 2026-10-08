// ============================================================
//  ESCÁNER DE DISCOS
//  1. Lee el código de barras con la cámara (o escrito a mano)
//  2. Busca el disco en MusicBrainz (base de datos de música gratuita)
//  3. Se pone precio y estado, y se guarda en la hoja de Google
// ============================================================

const $ = (id) => document.getElementById(id);
const form = $("form-disco");
const campo = (nombre) => form.elements[nombre];

// ---------- Memoria del navegador (clave y preferencias) ----------

const leerLS = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardarLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

const CLAVE_LS = "escaner-clave";
const PREF_LS = "escaner-preferencias";

let clave = leerLS(CLAVE_LS) || "";
const modoPrueba = !CONFIG.hojaURL;

// ---------- Estado ----------

let lector = null;            // lector de códigos (librería html5-qrcode)
let camaraEncendida = false;
let ocupado = false;          // true mientras se revisa un disco
let guardados = 0;
let discoActual = { codigo: "", portada: "" };
let existentes = new Map();   // código de barras -> cuántos hay en venta

// ---------- Avisos ----------

let temporizadorToast;
function toast(texto, error = false) {
  const t = $("toast");
  t.textContent = texto;
  t.classList.toggle("toast--error", error);
  t.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => (t.hidden = true), 2800);
}
const mensaje = (texto) => ($("estado-busqueda").textContent = texto);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Conexión con la hoja de Google ----------

async function enviar(accion, datos = {}) {
  // Se envía como texto simple para que Google lo acepte sin pasos extra
  const r = await fetch(CONFIG.hojaURL, { method: "POST", body: JSON.stringify({ clave, accion, ...datos }) });
  return r.json();
}

// Compara códigos sin los ceros iniciales: la hoja a veces los pierde (093… -> 93…)
const claveCodigo = (c) => String(c || "").replace(/^0+/, "");

async function cargarExistentes() {
  try {
    const r = await fetch(`${CONFIG.hojaURL}?t=${Date.now()}`, { cache: "no-store" });
    const { discos } = await r.json();
    existentes = new Map();
    for (const d of discos) {
      const c = claveCodigo(d.codigo);
      if (c) existentes.set(c, (existentes.get(c) || 0) + 1);
    }
  } catch { /* si falla, solo no avisamos de duplicados */ }
}

$("form-clave").addEventListener("submit", async (e) => {
  e.preventDefault();
  clave = $("clave").value.trim();
  $("config-msg").textContent = "Probando…";
  try {
    const r = await enviar("probar");
    if (!r.ok) throw new Error(r.error);
    guardarLS(CLAVE_LS, clave);
    $("config").hidden = true;
    toast("¡Conectado con la hoja!");
    cargarExistentes();
  } catch (err) {
    $("config-msg").textContent = `No se pudo conectar: ${err.message || "revisa tu internet"}`;
  }
});

// ---------- Cámara ----------

$("btn-camara").addEventListener("click", () => (camaraEncendida ? apagarCamara() : encenderCamara()));

async function encenderCamara() {
  if (!window.Html5Qrcode) return mensaje("No se pudo cargar el lector. Revisa tu internet y recarga la página.");
  const F = Html5QrcodeSupportedFormats;
  lector ??= new Html5Qrcode("lector", {
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    verbose: false,
  });
  try {
    await lector.start({ facingMode: "environment" }, {
      fps: 15,
      // Recuadro ancho y bajo, con la forma de un código de barras, que ocupa casi todo el ancho
      qrbox: (ancho, alto) => ({ width: Math.floor(ancho * 0.88), height: Math.floor(Math.min(alto * 0.5, ancho * 0.45)) }),
      // Alta resolución y enfoque continuo: las barras de un CD son finas
      videoConstraints: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        advanced: [{ focusMode: "continuous" }],
      },
    }, alLeerCodigo);
    camaraEncendida = true;
    $("btn-camara").textContent = "Apagar cámara";
    mensaje("Apunta al código de barras del CD.");
  } catch {
    mensaje("No se pudo abrir la cámara. Revisa que le diste permiso. (Solo funciona en la página publicada con https o en localhost.)");
  }
}

async function apagarCamara() {
  try { await lector?.stop(); } catch { /* ya estaba apagada */ }
  camaraEncendida = false;
  $("btn-camara").textContent = "Encender cámara";
  $("lector").innerHTML = "";
  mensaje("");
}

function alLeerCodigo(texto) {
  if (ocupado) return;
  navigator.vibrate?.(80);
  try { lector.pause(true); } catch { /* sigue */ }
  buscarCodigo(texto);
}

function reanudarCamara() {
  ocupado = false;
  if (camaraEncendida) { try { lector.resume(); } catch { /* sigue */ } }
}

// Código escrito a mano (o con lector USB, que "escribe" el código y da Enter)
$("form-codigo").addEventListener("submit", (e) => {
  e.preventDefault();
  const codigo = $("codigo").value.replace(/\D/g, "");
  if (codigo.length < 8) return mensaje("El código de barras tiene entre 8 y 13 números.");
  $("codigo").value = "";
  buscarCodigo(codigo);
});

// Leer el código desde una foto: más confiable que el video en algunos celulares
let lectorFoto = null;
$("foto-codigo").addEventListener("change", async (e) => {
  const archivo = e.target.files && e.target.files[0];
  e.target.value = ""; // permite elegir la misma foto otra vez
  if (!archivo || ocupado) return;
  if (!window.Html5Qrcode) return mensaje("No se pudo cargar el lector. Revisa tu internet y recarga la página.");
  const F = Html5QrcodeSupportedFormats;
  lectorFoto ??= new Html5Qrcode("lector-foto", {
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    verbose: false,
  });
  mensaje("Leyendo la foto…");
  try {
    const codigo = await lectorFoto.scanFile(archivo, false);
    navigator.vibrate?.(80);
    try { if (camaraEncendida) lector.pause(true); } catch { /* sigue */ }
    buscarCodigo(codigo.replace(/\D/g, ""));
  } catch {
    mensaje("No se pudo leer el código en la foto. Prueba más cerca, con buena luz y sin reflejos, o escribe el número.");
  }
});

$("btn-manual").addEventListener("click", () => {
  if (ocupado) return;
  ocupado = true;
  try { if (camaraEncendida) lector.pause(true); } catch { /* sigue */ }
  abrirFormulario({ codigo: "" }, []);
  mensaje("");
  campo("artista").focus();
});

// ---------- Búsqueda en MusicBrainz ----------

let ultimaBusqueda = 0;
async function buscarCodigo(codigo) {
  const yo = ++ultimaBusqueda;
  ocupado = true;
  form.hidden = true;
  mensaje(`Buscando ${codigo}…`);
  let opciones = [];
  let error = false;
  try {
    opciones = await buscarEnMusicBrainz(codigo);
  } catch {
    error = true;
  }
  if (yo !== ultimaBusqueda) return; // llegó otra búsqueda más nueva
  abrirFormulario({ codigo }, opciones);
  mensaje(error ? "No pudimos buscar (¿sin internet?). Puedes escribir los datos a mano."
    : opciones.length ? ""
    : "No lo encontramos en la base de datos. Escribe artista y álbum a mano.");
}

// MusicBrainz permite 1 consulta por segundo: las espaciamos y reintentamos una vez si se queja
let ultimaConsulta = 0;
async function consultarMB(url) {
  for (let intento = 0; intento < 2; intento++) {
    const falta = ultimaConsulta + 1100 - Date.now();
    if (falta > 0) await esperar(falta);
    ultimaConsulta = Date.now();
    const r = await fetch(url);
    if (r.status !== 503) return r;
  }
  throw new Error("MusicBrainz está ocupado");
}

// Un mismo número puede escribirse con o sin el 0 inicial (UPC vs EAN)
function variantes(codigo) {
  const v = new Set([codigo]);
  if (codigo.length === 13 && codigo.startsWith("0")) v.add(codigo.slice(1));
  if (codigo.length === 12) v.add("0" + codigo);
  return [...v];
}

async function buscarEnMusicBrainz(codigo) {
  const codigos = variantes(codigo);
  const consulta = codigos.map((c) => `barcode:${c}`).join(" OR ");
  const r = await consultarMB(`https://musicbrainz.org/ws/2/release?query=${encodeURIComponent(consulta)}&fmt=json&limit=25`);
  if (!r.ok) throw new Error("MusicBrainz no respondió");
  const { releases = [] } = await r.json();

  // Solo coincidencias exactas del código, sin grabaciones piratas
  const validas = releases.filter((x) => codigos.includes(x.barcode) && x.status !== "Bootleg");

  // Varias ediciones del mismo álbum cuentan como "votos": gana el que más se repite
  const grupos = new Map();
  for (const x of validas) {
    const id = x["release-group"]?.id || x.id;
    const g = grupos.get(id) || { votos: 0, release: x };
    g.votos++;
    grupos.set(id, g);
  }
  return [...grupos.values()].sort((a, b) => b.votos - a.votos).map(({ release: x }) => ({
    artista: (x["artist-credit"] || []).map((a) => a.name + (a.joinphrase || "")).join(""),
    album: x["release-group"]?.title || x.title,
    anio: (x.date || "").slice(0, 4),
    release: x.id,
    grupo: x["release-group"]?.id,
  }));
}

// Año de la PRIMERA edición del álbum (no el de esta copia)
async function primerAnio(grupo) {
  const r = await consultarMB(`https://musicbrainz.org/ws/2/release-group/${grupo}?fmt=json`);
  if (!r.ok) return "";
  return ((await r.json())["first-release-date"] || "").slice(0, 4);
}

// Prueba si una imagen existe cargándola
const probarImagen = (url) => new Promise((ok) => {
  const img = new Image();
  img.onload = () => ok(url);
  img.onerror = () => ok("");
  img.src = url;
});

async function buscarPortada(opcion) {
  const base = "https://coverartarchive.org";
  return (await probarImagen(`${base}/release/${opcion.release}/front-500`))
    || (opcion.grupo ? await probarImagen(`${base}/release-group/${opcion.grupo}/front-500`) : "");
}

// ---------- Formulario ----------

function abrirFormulario({ codigo }, opciones) {
  discoActual = { codigo, portada: "" };
  form.reset();
  aplicarPreferencias();
  $("vista-codigo").textContent = codigo ? `Código: ${codigo}` : "Disco sin código de barras";
  $("vista-portada").style.backgroundImage = "";

  const copias = codigo ? existentes.get(claveCodigo(codigo)) || 0 : 0;
  $("vista-duplicado").hidden = copias === 0;
  $("vista-duplicado").textContent = `Ya tienes ${copias} en venta. Si es otra copia, guárdalo igual.`;

  const alt = $("alternativas");
  alt.innerHTML = "";
  alt.hidden = opciones.length < 2;
  if (opciones.length > 1) {
    const p = document.createElement("p");
    p.className = "msg";
    p.textContent = "¿No es este? Toca el correcto:";
    alt.append(p);
    opciones.slice(0, 4).forEach((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = `${o.album} · ${o.artista}`;
      b.classList.toggle("is-active", i === 0);
      b.addEventListener("click", () => {
        alt.querySelectorAll("button").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        usarOpcion(o);
      });
      alt.append(b);
    });
  }

  if (opciones.length) usarOpcion(opciones[0]);
  marcarPrecio();
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

let busquedaVigente = 0;
async function usarOpcion(o) {
  const yo = ++busquedaVigente;
  campo("artista").value = o.artista;
  campo("album").value = o.album;
  campo("anio").value = o.anio;
  discoActual.portada = "";
  $("vista-portada").style.backgroundImage = "";

  const portada = await buscarPortada(o);
  if (yo !== busquedaVigente) return; // el usuario eligió otra opción mientras tanto
  discoActual.portada = portada;
  if (portada) $("vista-portada").style.backgroundImage = `url("${portada}")`;

  if (o.grupo) {
    const anio = await primerAnio(o.grupo).catch(() => "");
    if (yo === busquedaVigente && anio) campo("anio").value = anio;
  }
}

function cerrarFormulario() {
  form.hidden = true;
  busquedaVigente++;
  ultimaBusqueda++; // si había una búsqueda en curso, se descarta
  mensaje("");
  reanudarCamara();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("btn-cancelar").addEventListener("click", cerrarFormulario);

// ---------- Precios ----------

function llenarPrecios() {
  $("precios").innerHTML = "";
  for (const p of CONFIG.preciosRapidos || []) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip-precio";
    b.dataset.precio = p;
    b.textContent = `S/ ${p}`;
    b.addEventListener("click", () => { campo("precio").value = p; marcarPrecio(); });
    $("precios").append(b);
  }
}

$("btn-consultar").addEventListener("click", () => { campo("precio").value = ""; marcarPrecio(); });
campo("precio").addEventListener("input", marcarPrecio);

// Resalta el botón del precio elegido (o "Consultar" si no hay precio)
function marcarPrecio() {
  const valor = Number(campo("precio").value.replace(",", "."));
  document.querySelectorAll("#precios .chip-precio").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.precio) === valor));
  $("btn-consultar").classList.toggle("is-active", !(valor > 0));
}

// ---------- Preferencias: recuerda el último estado y género ----------

function aplicarPreferencias() {
  let pref = {};
  try { pref = JSON.parse(leerLS(PREF_LS)) || {}; } catch { /* nada guardado */ }
  if (pref.estado) form.querySelector(`input[name="estado"][value="${pref.estado}"]`)?.click();
  if (pref.genero) campo("genero").value = pref.genero;
}

// ---------- Guardar ----------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const precio = Number(campo("precio").value.replace(",", "."));
  const disco = {
    codigo: discoActual.codigo,
    artista: campo("artista").value.trim(),
    album: campo("album").value.trim(),
    anio: campo("anio").value.trim(),
    genero: campo("genero").value.trim(),
    estado: form.querySelector('input[name="estado"]:checked').value,
    precio: precio > 0 ? precio : "",
    detalle: campo("detalle").value.trim(),
    portada: discoActual.portada,
  };
  guardarLS(PREF_LS, JSON.stringify({ estado: disco.estado, genero: disco.genero }));

  if (modoPrueba) {
    agregarReciente(disco, true);
    toast(`Prueba: "${disco.album}" (no se guardó)`);
    return cerrarFormulario();
  }
  if (!clave) {
    $("config").hidden = false;
    return toast("Primero conecta con la hoja", true);
  }

  const boton = $("btn-guardar");
  boton.disabled = true;
  boton.textContent = "Guardando…";
  try {
    const r = await enviar("agregar", { disco });
    if (!r.ok) throw new Error(r.error);
    const c = claveCodigo(disco.codigo);
    if (c) existentes.set(c, (existentes.get(c) || 0) + 1);
    agregarReciente(disco, false);
    toast(`Guardado: ${disco.album}`);
    cerrarFormulario();
  } catch (err) {
    if (String(err.message).includes("Clave")) {
      $("config").hidden = false;
      guardarLS(CLAVE_LS, "");
    }
    toast(`No se guardó: ${err.message || "revisa tu internet"}`, true);
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar disco";
  }
});

function agregarReciente(d, prueba) {
  const lista = $("recientes");
  lista.querySelector(".msg")?.remove();
  const li = document.createElement("li");
  const img = document.createElement(d.portada ? "img" : "span");
  img.className = "mini";
  if (d.portada) { img.src = d.portada; img.alt = ""; }
  const texto = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = d.album;
  const sub = document.createElement("small");
  sub.textContent = `${d.artista} · ${d.estado} · ${d.precio ? `S/ ${d.precio}` : "Consultar"}${prueba ? " · prueba" : ""}`;
  texto.append(titulo, sub);
  li.append(img, texto);
  lista.prepend(li);
  if (!prueba) $("conteo").textContent = `${++guardados} guardado${guardados === 1 ? "" : "s"}`;
}

// ---------- Importar discos desde "Fotos de discos" ----------
// Esa página reconoce discos en una foto y abre este escáner con la lista en el "#importar=…".

let porImportar = [];

function decodificar(texto) {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function revisarImportacion() {
  const m = location.hash.match(/^#importar=([\w-]+)$/);
  if (!m) return;
  try {
    const datos = decodificar(m[1]);
    porImportar = (Array.isArray(datos) ? datos : [])
      .map((d) => ({
        artista: String(d.a || "").trim(),
        album: String(d.al || "").trim(),
        anio: String(d.y || "").replace(/\D/g, "").slice(0, 4),
        genero: String(d.g || "").trim(),
        estado: d.e === "Nuevo" ? "Nuevo" : "Usado",
        precio: Number(d.p) > 0 ? Number(d.p) : "",
        guardado: false,
      }))
      .filter((d) => d.artista && d.album)
      .slice(0, 200);
  } catch {
    porImportar = [];
    toast("El enlace con los discos está incompleto. Vuelve a tocar Guardar en Fotos de discos.", true);
  }
  pintarImportacion();
  if (porImportar.length) $("importar").scrollIntoView({ behavior: "smooth", block: "start" });
}

function pintarImportacion() {
  const pendientes = porImportar.filter((d) => !d.guardado);
  $("importar").hidden = porImportar.length === 0;
  $("importar-titulo").textContent = `${porImportar.length} disco${porImportar.length === 1 ? "" : "s"} desde tus fotos`;
  $("importar-lista").replaceChildren(...porImportar.map((d) => {
    const li = document.createElement("li");
    const texto = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = d.album;
    const sub = document.createElement("small");
    sub.textContent = `${d.artista}${d.anio ? " · " + d.anio : ""} · ${d.estado} · ${d.precio ? "S/ " + d.precio : "Consultar"}`;
    texto.append(titulo, sub);
    const marca = document.createElement("span");
    marca.className = "estado-import" + (d.guardado ? " estado-import--ok" : d.error ? " estado-import--error" : "");
    marca.textContent = d.guardado ? "✓" : d.error ? "No se guardó" : "";
    li.append(texto, marca);
    return li;
  }));
  const boton = $("btn-importar");
  boton.textContent = pendientes.length ? `Guardar ${pendientes.length} en la hoja` : "Listo";
  boton.disabled = pendientes.length === 0;
}

$("btn-importar").addEventListener("click", async () => {
  if (modoPrueba) return toast("Modo prueba: falta conectar la hoja de Google.", true);
  if (!clave) {
    $("config").hidden = false;
    $("config").scrollIntoView({ behavior: "smooth" });
    return toast("Primero conecta con la hoja", true);
  }
  const boton = $("btn-importar");
  boton.disabled = true;
  let ok = 0;
  const pendientes = porImportar.filter((d) => !d.guardado);
  for (const [i, d] of pendientes.entries()) {
    boton.textContent = `Guardando ${i + 1} de ${pendientes.length}…`;
    const disco = { codigo: "", artista: d.artista, album: d.album, anio: d.anio, genero: d.genero,
      estado: d.estado, precio: d.precio, detalle: "", portada: "" };
    try {
      const r = await enviar("agregar", { disco });
      if (!r.ok) throw new Error(r.error);
      d.guardado = true;
      d.error = false;
      ok++;
      agregarReciente(disco, false);
    } catch (err) {
      d.error = true;
      if (String(err.message).includes("Clave")) {
        guardarLS(CLAVE_LS, "");
        clave = "";
        $("config").hidden = false;
        pintarImportacion();
        return toast("La clave no es correcta. Escríbela de nuevo y vuelve a tocar Guardar.", true);
      }
    }
    pintarImportacion();
  }
  const fallaron = porImportar.filter((d) => !d.guardado).length;
  toast(fallaron ? `Se guardaron ${ok}. ${fallaron} no se guardaron: toca Guardar para reintentar.` : `¡Listo! ${ok} disco${ok === 1 ? "" : "s"} guardado${ok === 1 ? "" : "s"} en la hoja.`, fallaron > 0);
  if (!fallaron) history.replaceState(null, "", location.pathname); // quita la lista del enlace
  pintarImportacion();
});

$("btn-descartar").addEventListener("click", () => {
  porImportar = [];
  history.replaceState(null, "", location.pathname);
  pintarImportacion();
});

window.addEventListener("hashchange", revisarImportacion);

// ---------- Inicio ----------

llenarPrecios();
if (modoPrueba) $("aviso-demo").hidden = false;
else if (!clave) $("config").hidden = false;
else cargarExistentes();
revisarImportacion();
