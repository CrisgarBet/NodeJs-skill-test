# Prueba Jaya

Aplicación web en Node.js que combina autenticación local con una API para ordenar colecciones numéricas. Esta versión conserva el comportamiento de la prueba original, elimina código sin uso y actualiza la arquitectura para versiones actuales de Node.js, Express y MongoDB.

## Qué hace

- Registra usuarios e inicia sesiones persistentes en MongoDB.
- Protege formularios con CSRF, limita intentos de autenticación y cifra contraseñas con bcrypt (8 a 72 bytes).
- Lee los arreglos de `src/data/original.txt` y valida que todos sus valores sean números finitos.
- Escribe el último resultado en `src/data/sorted.txt` mediante una escritura atómica.
- Mantiene las rutas originales y añade una ruta API explícita:

| Ruta | Resultado |
| --- | --- |
| `GET /asc` | Todos los arreglos en orden ascendente |
| `GET /des` | Todos los arreglos en orden descendente |
| `GET /mix` | Arreglos pares ascendentes e impares descendentes |
| `GET /api/sort/:mode` | Equivalente; `mode` acepta `asc`, `des` o `mix` |
| `GET /health` | Comprobación sencilla de disponibilidad |

Las posiciones de `mix` se cuentan desde cero: el primer arreglo es ascendente, el segundo descendente, y así sucesivamente.

## Requisitos

- Node.js 20.19 o posterior.
- MongoDB en ejecución, local o remoto.

## Instalación y uso

```bash
npm install
```

Configura las variables del archivo `.env.example` en tu entorno. En PowerShell, por ejemplo:

```powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/pruebajaya"
$env:SESSION_SECRET = "un-secreto-largo-y-unico"
npm start
```

La aplicación estará disponible en `http://localhost:3000`. Para desarrollo con recarga automática:

```bash
npm run dev
```

## Formato de entrada

`src/data/original.txt` contiene arreglos separados por punto y coma:

```text
[4,6,3,5];
[100,3,450,34];
[0];
```

Se aceptan enteros, decimales y números negativos. Un valor vacío, infinito o no numérico produce una respuesta de error y no sobrescribe la salida anterior.

## Verificación

```bash
npm test
npm run check
npm audit
```

Las pruebas unitarias cubren el parseo y los tres algoritmos; las pruebas HTTP cubren las rutas públicas, errores, CSRF y generación del archivo de salida.
