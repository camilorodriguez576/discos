// ============================================================
//  CONFIGURACIÓN DE LA TIENDA
//  Aquí cambias el nombre, el WhatsApp y los datos de contacto.
//  No necesitas tocar ningún otro archivo para esto.
// ============================================================

const CONFIG = {
  // Nombre provisional (lo cambiamos cuando elijan el definitivo)
  nombreTienda: "Discos de Papá",
  lema: "Elige tus discos, arma tu pedido y lo coordinamos por WhatsApp. Entregas en toda Lima.",

  // Número de WhatsApp con código de país (51 = Perú), sin espacios ni "+"
  // Ejemplo: si el número es 987 654 321  ->  "51987654321"
  whatsapp: "51999999999",

  // Puntos de entrega en Lima (se coordinan en cada pedido)
  puntosEntrega: [
    "Coordinamos el punto de entrega por WhatsApp en cada pedido",
    "Por ejemplo: una estación del Metro o Metropolitano, o un centro comercial",
  ],

  // Formas de pago aceptadas
  pagos: ["Yape", "Plin", "Efectivo", "Transferencia bancaria"],

  // Enlace del programa de la hoja de Google (ver GUIA-GOOGLE.md).
  // Mientras esté vacío, la página muestra los discos de ejemplo de discos.js
  hojaURL: "https://script.google.com/macros/s/AKfycbytkHB7skpCVGvZtGyc7vFfCcYn7TIATv4ajqWNw-ZuU-foi_E9B0puyvYbKOrO2ZeIew/exec",

  // Precios rápidos que aparecen como botones en el escáner
  preciosRapidos: [15, 20, 25, 30, 35, 40, 50, 60, 70, 80],

  // Redes sociales (déjalas vacías "" si todavía no existen)
  facebook: "",
  instagram: "",
};
