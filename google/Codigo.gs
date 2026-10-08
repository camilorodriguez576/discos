// ============================================================
//  PROGRAMA DE LA HOJA DE GOOGLE (Apps Script)
//  Se pega en: Hoja de Google > Extensiones > Apps Script
//  Hace tres cosas:
//    1. Agrega el menú "Mis Discos" y deja la hoja fácil de usar
//    2. Entrega la lista de discos a la página (doGet)
//    3. Recibe los discos que se escanean (doPost, con clave)
// ============================================================

const HOJA = "Discos";

// Primero las columnas que papá usa; después las técnicas (quedan ocultas)
const COLUMNAS = [
  "artista", "album", "precio", "estado", "vendido", "novedad", "detalle",
  "genero", "anio", "codigo", "portada", "id", "fecha_alta", "fecha_venta",
];
const VISIBLES = 7; // de "artista" a "detalle"
const col = (nombre) => COLUMNAS.indexOf(nombre) + 1;
const letra = (nombre) => String.fromCharCode(64 + col(nombre)); // 1 -> A

// ---------- Menú ----------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mis Discos")
    .addItem("Marcar como vendido", "marcarVendido")
    .addItem("Volver a poner en venta", "volverAVenta")
    .addSeparator()
    .addItem("Mostrar columnas técnicas", "mostrarTodo")
    .addItem("Preparar la hoja (primera vez o tras actualizar)", "prepararHoja")
    .addItem("Cambiar clave del escáner", "cambiarClave")
    .addToUi();
}

// Al marcar o desmarcar "vendido", la fecha de venta se anota sola
function onEdit(e) {
  const rango = e.range;
  const hoja = rango.getSheet();
  if (hoja.getName() !== HOJA || rango.getLastRow() < 2) return;
  if (rango.getColumn() > col("vendido") || rango.getLastColumn() < col("vendido")) return;
  for (let fila = Math.max(2, rango.getRow()); fila <= rango.getLastRow(); fila++) {
    const vendido = hoja.getRange(fila, col("vendido")).getValue() === true;
    hoja.getRange(fila, col("fecha_venta")).setValue(vendido ? new Date() : "");
  }
}

// ---------- Preparar la hoja ----------
// Se puede correr varias veces: conserva los discos que ya existen

function prepararHoja() {
  const ss = SpreadsheetApp.getActive();
  const hoja = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA, 0);

  // 1. Guardar los discos que ya hay, reacomodados al orden nuevo de columnas
  const datos = hoja.getDataRange().getValues();
  const cabecera = datos[0] || [];
  const filas = datos.slice(1)
    .map((f) => Object.fromEntries(cabecera.map((c, i) => [c, f[i]])))
    .filter((d) => d.artista !== undefined && d.artista !== "")
    .map((d) => {
      // Versión anterior: tenía "disponible" en vez de "vendido"
      if (!("vendido" in d) && "disponible" in d) d.vendido = d.disponible === false;
      d.vendido = d.vendido === true;
      d.novedad = d.novedad === true;
      return COLUMNAS.map((c) => d[c] ?? "");
    });

  // 2. Limpiar todo y volver a escribir
  hoja.clear();
  hoja.clearConditionalFormatRules();
  hoja.getRange(1, 1, hoja.getMaxRows(), hoja.getMaxColumns()).clearDataValidations();
  hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach((p) => p.remove());
  hoja.showColumns(1, hoja.getMaxColumns());

  const filasHoja = hoja.getMaxRows() - 1;
  hoja.getRange(2, col("codigo"), filasHoja).setNumberFormat("@"); // texto: no perder ceros
  hoja.getRange(2, col("precio"), filasHoja).setNumberFormat('"S/ "0');

  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]);
  if (filas.length) {
    hoja.getRange(2, 1, filas.length, COLUMNAS.length).setValues(filas);
    const casillas = hoja.getRange(2, col("vendido"), filas.length, 2); // vendido y novedad
    const valores = casillas.getValues();
    casillas.insertCheckboxes();
    casillas.setValues(valores);
  }

  darFormato(hoja);
  if (!PropertiesService.getScriptProperties().getProperty("CLAVE")) cambiarClave();
  SpreadsheetApp.getUi().alert(`¡Hoja lista! ${filas.length} disco(s) en la lista.`);
}

function darFormato(hoja) {
  const filas = hoja.getMaxRows() - 1;
  const todo = hoja.getRange(1, 1, hoja.getMaxRows(), COLUMNAS.length);
  todo.setFontSize(12).setVerticalAlignment("middle");

  // Títulos: oscuros, fijos y protegidos (avisa si alguien intenta cambiarlos)
  hoja.getRange(1, 1, 1, COLUMNAS.length)
    .setFontWeight("bold").setBackground("#1f1b17").setFontColor("#f5efe4")
    .protect().setDescription("Títulos de columnas").setWarningOnly(true);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 32);

  // Anchos cómodos para lo que papá usa
  [["artista", 200], ["album", 260], ["precio", 90], ["estado", 100], ["vendido", 80], ["novedad", 80], ["detalle", 260]]
    .forEach(([c, ancho]) => hoja.setColumnWidth(col(c), ancho));
  hoja.getRange(2, col("precio"), filas, 4).setHorizontalAlignment("center"); // precio a novedad

  hoja.getRange(2, col("estado"), filas).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Usado", "Nuevo"]).setAllowInvalid(false).build()
  );

  // Colores: vendidos en gris tachado, sin precio en amarillo
  const datos = hoja.getRange(`A2:${letra("fecha_venta")}`);
  const precio = hoja.getRange(`${letra("precio")}2:${letra("precio")}`);
  hoja.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$${letra("vendido")}2=TRUE`)
      .setFontColor("#9a948c").setStrikethrough(true).setBackground("#f1eee9")
      .setRanges([datos]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=AND($A2<>"",$${letra("precio")}2="")`)
      .setBackground("#fdf3d0")
      .setRanges([precio]).build(),
  ]);

  // Ocultar las columnas técnicas
  hoja.hideColumns(VISIBLES + 1, COLUMNAS.length - VISIBLES);
}

function mostrarTodo() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA);
  hoja.showColumns(1, COLUMNAS.length);
  SpreadsheetApp.getActive().toast('Para volver a ocultarlas: Mis Discos > Preparar la hoja.');
}

function cambiarClave() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("Clave del escáner", "Escribe una clave (mínimo 6 caracteres). La pedirá el escáner la primera vez.", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const clave = r.getResponseText().trim();
  if (clave.length < 6) return ui.alert("La clave debe tener al menos 6 caracteres.");
  PropertiesService.getScriptProperties().setProperty("CLAVE", clave);
  ui.alert("Clave guardada.");
}

// ---------- Vendido desde el menú (filas seleccionadas) ----------

function marcarVendido() { cambiarVendido(true); }
function volverAVenta() { cambiarVendido(false); }

function cambiarVendido(vendido) {
  const hoja = SpreadsheetApp.getActiveSheet();
  if (hoja.getName() !== HOJA) return SpreadsheetApp.getUi().alert(`Ve a la pestaña "${HOJA}" y selecciona el disco.`);
  const rango = hoja.getActiveRange();
  let cambiados = 0;
  for (let fila = Math.max(2, rango.getRow()); fila < rango.getRow() + rango.getNumRows(); fila++) {
    if (!hoja.getRange(fila, col("artista")).getValue()) continue;
    hoja.getRange(fila, col("vendido")).setValue(vendido);
    hoja.getRange(fila, col("fecha_venta")).setValue(vendido ? new Date() : "");
    cambiados++;
  }
  SpreadsheetApp.getActive().toast(`${cambiados} disco(s) ${vendido ? "marcados como vendidos" : "de vuelta en venta"}.`);
}

// ---------- Lectura: la página pide la lista de discos ----------

function doGet(e) {
  const todos = e && e.parameter && e.parameter.todos === "1";
  const json = JSON.stringify({ discos: leerDiscos(todos) });
  const callback = e && e.parameter && e.parameter.callback;
  // JSONP: permite leer los discos incluso abriendo la página como archivo
  if (callback && /^[\w$]+$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${json})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function leerDiscos(incluirVendidos) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA);
  if (!hoja) return [];
  const [cabecera, ...filas] = hoja.getDataRange().getValues();
  return filas
    .map((fila) => Object.fromEntries(cabecera.map((c, i) => [c, fila[i] instanceof Date ? fila[i].toISOString().slice(0, 10) : fila[i]])))
    .filter((d) => d.artista !== "" && (incluirVendidos || d.vendido !== true))
    .map(({ fecha_venta, ...d }) => d); // la fecha de venta no se publica
}

// ---------- Escritura: el escáner envía un disco nuevo ----------

function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents);
    const clave = PropertiesService.getScriptProperties().getProperty("CLAVE");
    if (!clave || pedido.clave !== clave) return responder({ ok: false, error: "Clave incorrecta" });

    if (pedido.accion === "probar") return responder({ ok: true });
    if (pedido.accion === "agregar") return responder({ ok: true, id: agregar(pedido.disco || {}) });
    return responder({ ok: false, error: "Acción desconocida" });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

function agregar(disco) {
  if (!disco.artista || !disco.album) throw new Error("Faltan artista o álbum");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA);
    const id = Utilities.getUuid().slice(0, 8);
    const valores = {
      ...disco,
      id,
      // El apóstrofo guarda el código como texto, sin perder los ceros iniciales
      codigo: disco.codigo ? "'" + String(disco.codigo) : "",
      precio: Number(disco.precio) > 0 ? Number(disco.precio) : "",
      anio: Number(disco.anio) || "",
      vendido: false,
      novedad: disco.novedad === true,
      fecha_alta: new Date(),
      fecha_venta: "",
    };
    // Un texto que empiece con "=" se tomaría como fórmula: lo evitamos
    const seguro = (v) => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v);
    hoja.appendRow(COLUMNAS.map((c) => seguro(valores[c] ?? "")));

    const fila = hoja.getLastRow();
    const casillas = hoja.getRange(fila, col("vendido"), 1, 2); // vendido y novedad
    casillas.insertCheckboxes();
    casillas.setValues([[false, valores.novedad]]);
    return id;
  } finally {
    lock.releaseLock();
  }
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
