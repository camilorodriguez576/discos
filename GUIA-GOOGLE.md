# Guía: conectar la hoja de Google

Se hace **una sola vez** y toma unos 15 minutos. Al terminar:
- El escáner guarda los discos en la hoja.
- La página muestra los discos de la hoja.
- Tu papá maneja todo desde la hoja con el menú **"Mis Discos"**.

---

## 1. Crear la hoja

1. Entra a [sheets.google.com](https://sheets.google.com) con la cuenta de Gmail que van a usar.
2. Crea una **hoja en blanco** y ponle de nombre `Discos de Papá - Inventario`.

## 2. Pegar el programa

1. En la hoja, ve al menú **Extensiones → Apps Script**. Se abre una pestaña nueva.
2. Borra todo lo que aparece en el editor (`function myFunction() {...}`).
3. Abre el archivo `google/Codigo.gs` de esta carpeta, copia **todo** y pégalo en el editor.
4. Arriba, cambia el nombre "Proyecto sin título" por `Discos`.
5. Guarda con el ícono del disquete o con `Ctrl + S`.

## 3. Preparar la hoja

1. Vuelve a la pestaña de la hoja y **recárgala** (F5). En unos segundos aparece el menú **Mis Discos**.
2. Haz clic en **Mis Discos → Preparar la hoja (solo la primera vez)**.
3. Google pedirá permiso, porque es la primera vez que corre este programa:
   - "Se requiere autorización" → **Continuar** → elige tu cuenta.
   - Si dice **"Google no verificó esta app"**: es normal, porque el programa es tuyo y no de una empresa. Haz clic en **Configuración avanzada** → **Ir a Discos (no seguro)** → **Permitir**.
4. Te pedirá una **clave para el escáner**. Inventa una de mínimo 6 caracteres y **no la compartas**: es lo que impide que otra persona agregue discos.
5. Listo: aparece la pestaña **Discos** con los títulos de las columnas.

## 4. Publicar el programa (para que la página lo pueda leer)

1. En la pestaña de Apps Script, arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje ⚙ junto a "Seleccionar tipo", elige **Aplicación web**.
3. Llénalo así:
   - Descripción: `Catálogo`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. **Implementar**. Si vuelve a pedir permisos, acéptalos igual que antes.
5. Copia la **URL de la aplicación web**, la que termina en `/exec`.

> Cualquiera con esa URL puede **ver** los discos en venta, igual que en la página. Para **agregar** discos hace falta la clave.

## 5. Pegar la URL en la página

1. Abre `config.js` y pega la URL entre las comillas de `hojaURL`:
   ```js
   hojaURL: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
2. Guarda el archivo.

## 6. Probar

1. Abre `escaner.html`. Te pedirá la clave del paso 3: escríbela y toca **Conectar**.
2. Escribe un código de barras (por ejemplo `720642442524`, que es *Nevermind*), ponle precio y toca **Guardar disco**.
3. Revisa la hoja: debe aparecer una fila nueva.
4. Abre `index.html`: el disco debe aparecer en el catálogo.

---

## Uso de todos los días (para tu papá)

| Quiero… | Hago… |
|---|---|
| Marcar un disco como vendido | Marco la casilla **vendido**: la fila se pone gris y tachada, y sale de la página |
| Volverlo a poner en venta | Desmarco la casilla **vendido** |
| Cambiar un precio | Escribo el nuevo número en la columna **precio** |
| Dejarlo como "Consultar precio" | Borro el número de la columna **precio** (la celda se pone amarilla) |
| Marcar una novedad | Marco la casilla **novedad** |
| Ver las columnas ocultas | **Mis Discos → Mostrar columnas técnicas** |
| Cambiar la clave del escáner | **Mis Discos → Cambiar clave del escáner** |

La hoja solo muestra lo que se usa a diario: artista, álbum, precio, estado, vendido, novedad y detalle. Las demás columnas (código, portada, fechas…) están ocultas y se llenan solas. Los cambios aparecen en la página en cuanto se recarga.

## Si actualizas el programa

1. Pega el código nuevo en Apps Script y guarda.
2. En la hoja: **Mis Discos → Preparar la hoja**. Conserva los discos que ya existen.
3. **Implementar → Administrar implementaciones → ✏ editar → Versión: Nueva versión → Implementar**.

## Si algún día cambias el programa (`Codigo.gs`)

Después de pegar el código nuevo: **Implementar → Administrar implementaciones → ✏ editar → Versión: Nueva versión → Implementar**. Así la URL sigue siendo la misma y no hay que tocar `config.js`.

## Sobre la cámara del celular

Por seguridad, el navegador solo deja usar la cámara en páginas con **https**. Por eso la cámara del celular funcionará cuando la página esté publicada en internet, que es el siguiente paso. Mientras tanto:
- En la **laptop**, la cámara funciona si abres la página con el servidor local (`localhost`).
- En cualquier lado puedes **escribir el código** de barras a mano.
