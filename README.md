TP 09 — Actualización y eliminación de reservas de salas
Módulo 3 — Desarrollo Back-End con Node.js | UNCA
Proyecto: tp-09-salas-crud-mongodb
Dominio: reservas de salas de estudio.

1. Introducción y punto de partida
Este trabajo práctico parte de una copia independiente del TP 08, conservando la aplicación Express/EJS y la API JSON conectadas a MongoDB Atlas. El TP 08 incorporó creación y lectura persistentes; el TP 09 completa el CRUD con reemplazo completo (PUT), actualización parcial (PATCH) y eliminación física (DELETE) de reservas.

La entrega anterior se conserva por separado y no se reutiliza su historial Git. El sitio HTML y la API comparten un servicio asíncrono de reservas y la colección reservas. No se inserta ni elimina información automáticamente al iniciar o listar.
2. Tecnologías y versiones

- Node.js con soporte para --env-file (Node.js 20.6 o posterior); versión utilizada en el TP 07: v24.18.0.
- Express ^5.1.0, Mongoose ^9.11.4, EJS ^3.1.10.
- express-ejs-layouts ^2.5.1 y Morgan ^1.10.0.
- ESLint ^9.0.0 y Prettier ^3.6.2.
- MongoDB Atlas Free (M0): base reservas_salas_u9, colección reservas.
- CommonJS (require / module.exports).
Las versiones concretas resueltas se encuentran en package-lock.json.

3. Preparación de MongoDB Atlas y entorno
Desde la raíz del proyecto, en PowerShell:
npm.cmd ci
Copy-Item .env.example .env
Crear o reutilizar un clúster gratuito en MongoDB Atlas. Configurar el usuario en Database Access, autorizar la IP pública de la computadora en Network Access, obtener la URI real desde Connect → Drivers → Node.js y guardarla únicamente en .env.

La plantilla pública .env.example contiene valores ilustrativos:
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST_REAL/reservas_salas_u9?retryWrites=true&w=majority
HOST_REAL es un marcador: no permite conectarse. En el archivo privado .env, conservar el usuario, contraseña y host verdaderos y seleccionar la base reservas_salas_u9. Si la contraseña incluye caracteres reservados de URI, codificarlos. Nunca subir .env, secretos ni node_modules.

Se conserva el ajuste DNS autorizado de la unidad anterior en src/config/base-datos.js:
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
El ajuste cambia los resolutores DNS del proceso Node.js, no los permisos de Atlas. Si falla la conexión, revisar el host, DNS, clúster, acceso de red y credenciales. El servidor espera a conectarse antes de escuchar el puerto.
4. Ejecución
npm.cmd start
Para reiniciar automáticamente durante el desarrollo:
npm.cmd run dev
Los scripts cargan .env mediante node --env-file=.env. Dirección local predeterminada: <http://localhost:3000> (o el puerto indicado en PORT). El servidor mantiene la conexión entre peticiones y contempla cierre ordenado con SIGINT y SIGTERM. Los programas de scripts/ cierran sus conexiones al finalizar.
5. Organización por capas
tp-09-salas-crud-mongodb/
├── src/
│   ├── index.js                    # Conectar Atlas, iniciar y cerrar servidor
│   ├── app.js                      # Express, EJS, parsers, routers y errores
│   ├── config/
│   │   ├── entorno.js              # PORT, NODE_ENV, URI
│   │   └── base-datos.js           # DNS y conexión/desconexión Mongoose
│   ├── modelos/
│   │   └── reserva.js              # Esquema y validaciones Mongoose
│   ├── servicios/
│   │   └── reservas.js             # CRUD asíncrono sobre MongoDB
│   ├── controladores/
│   │   ├── reservas.js             # Respuestas HTML
│   │   └── reservas-api.js         # Respuestas JSON
│   ├── rutas/
│   │   ├── reservas.js             # Router HTML
│   │   └── reservas-api.js         # Router REST
│   └── middleware/
│       ├── reservas.js             # Validaciones por método
│       └── solicitudes.js          # Identificación y duración
├── scripts/                        # Utilidades heredadas de MongoDB
├── views/                          # Vistas EJS
├── public/                         # CSS y recursos estáticos
├── .env.example                    # Plantilla sin secretos
├── .gitignore
├── eslint.config.js
├── package.json
├── package-lock.json
└── README.md
Las rutas delegan en controladores; los controladores utilizan el servicio; el servicio accede al modelo Mongoose. Las respuestas HTTP no se construyen en el servicio y las rutas no hacen consultas directas.
6. Modelo y reglas de validación
Campo Tipo Regla
estudiante String Obligatorio, trim
email String Obligatorio, trim, presencia de @
sala String Sala Norte, Sala Sur o Sala Multimedia
fecha String Obligatorio, trim
turno String Mañana, Tarde o Noche
personas Number Entero entre 1 y 6
estado String pendiente o confirmada; por defecto pendiente

MongoDB asigna _id de tipo ObjectId; la API expone ese valor como id textual. Las operaciones por ID no convierten el identificador a número.

- POST: recibe los seis campos originales; aunque se envíe estado o _id, no se asignan desde el cliente. El esquema aplica estado: "pendiente" por defecto.
- PUT: exige los siete campos editables. No completa campos faltantes automáticamente ni admite campos desconocidos.
- PATCH: admite exclusivamente personas y/o estado, con al menos uno presente; los campos omitidos permanecen sin cambios.
- PUT/PATCH: rechazan _id, $set, campos adicionales, cuerpos ausentes, arreglos, booleanos, valores numéricos no válidos y objetos enviados como cantidad de personas. personas puede recibirse como número o como texto numérico no vacío, y debe representar un entero de 1 a 6.
Las actualizaciones pasan por validaciones HTTP y de esquema. El servicio construye explícitamente el reemplazo o el operador $set, con runValidators: true, upsert: false y retorno del documento actualizado.

Límites: no se valida un calendario real, fecha futura, superposición de horarios, cupo compartido ni unicidad de reservas. Cambiar el estado a confirmada es una decisión explícita, no un control de disponibilidad. No hay autenticación ni autorización en esta unidad.
7. Contrato HTTP de la API
Base: <http://localhost:3000>.
Método Ruta Resultado
GET /api/reservas 200, arreglo de reservas (incluso [])
GET /api/reservas/:id 200, recurso individual; 400 ID inválido; 404 ausente
POST /api/reservas 201, recurso creado con estado: pendiente y encabezado Location
PUT /api/reservas/:id 200, reemplazo completo y mismo ID
PATCH /api/reservas/:id 200, modificación parcial y mismo ID
DELETE /api/reservas/:id 204, cuerpo vacío cuando elimina un documento

Un ID de formato válido pero inexistente devuelve 404 para GET, PUT, PATCH y DELETE. PUT/PATCH no generan nuevos recursos (upsert: false). Si se repite DELETE o se consulta un recurso eliminado, el resultado es 404. Las entradas inválidas o el JSON mal formado producen 400 sin modificar datos; los fallos internos producen 500 JSON sin trazas ni secretos. Las rutas desconocidas de /api responden en JSON.

Lectura simple: el listado no agrega paginación ni metadatos. No se incorporan consultas avanzadas de la unidad 10. El filtro por sala heredado del TP 08 puede seguir disponible en la implementación, pero no es un requisito nuevo de este trabajo.
8. Ejemplos para Postman
Usar Postman de escritorio. Mantener el servidor ejecutándose. Para POST, PUT y PATCH seleccionar Body → raw → JSON y comprobar Content-Type: application/json. Para GET y DELETE seleccionar Body → none.
8.1 Crear (POST)
POST <http://localhost:3000/api/reservas>
{
  "estudiante": "Ana Ejemplo",
  "email": "<ana@example.com>",
  "sala": "Sala Norte",
  "fecha": "2026-10-28",
  "turno": "Mañana",
  "personas": 2
}
Esperado: 201 Created, nuevo id, estado: "pendiente" y cabecera de respuesta Location: /api/reservas/ID_CREADO. Guardar ese ID para las siguientes solicitudes. La fecha es ilustrativa.
8.2 Consultar (GET)
GET <http://localhost:3000/api/reservas/ID_CREADO>

Esperado: 200, mismo ID y los valores guardados. Si Location es una ruta relativa, anteponer <http://localhost:3000>.
8.3 Reemplazar (PUT)
PUT <http://localhost:3000/api/reservas/ID_CREADO>
{
  "estudiante": "Ana Ejemplo",
  "email": "<ana@example.com>",
  "sala": "Sala Norte",
  "fecha": "2026-10-28",
  "turno": "Mañana",
  "personas": 2,
  "estado": "confirmada"
}
Esperado: 200, el mismo ID y los siete campos establecidos. Si falta cualquiera de ellos, debe responder 400 sin reemplazar el documento.
8.4 Actualizar parcialmente (PATCH)
PATCH <http://localhost:3000/api/reservas/ID_CREADO>
{
  "personas": 3
}
Esperado: 200, personas: 3 y el resto intacto, incluido estado: "confirmada". Para cambiar solo el estado:
{
  "estado": "pendiente"
}
PATCH con {}, _id, $set o cualquier campo distinto de personas y estado debe producir 400 sin modificaciones.
8.5 Eliminar (DELETE)
Antes de eliminar, identificar una reserva creada exclusivamente para este ejercicio mediante GET. Enviar:

DELETE <http://localhost:3000/api/reservas/ID_DE_EJERCICIO>

Esperado: 204 No Content, sin cuerpo. Un GET o segundo DELETE con ese ID debe devolver 404. El listado debe tener una reserva menos y las demás conservarse. No borrar datos del TP 08, la colección completa ni documentos ajenos al ejercicio.

Eliminar un documento es distinto de cambiar estado: la eliminación física lo retira de la colección y de los listados; la confirmación o vuelta a pendiente conserva el documento y su identificador.
9. Continuidad del sitio HTML
Se preservan las páginas del TP 08:
Método Ruta Comportamiento esperado
GET / Inicio EJS (200)
GET /reservas Listado EJS desde Atlas (200)
GET /reservas/nueva Formulario EJS (200)
GET /reservas/:id Detalle por ObjectId o error HTML
POST /reservas Válido: guarda y redirige 302; inválido: 400, errores y valores conservados
GET /estado JSON con servicio, solicitudId y cantidad real en Atlas
GET /css/estilos.css CSS estático
GET /ruta-inexistente Página EJS de error (404)

Las modificaciones realizadas desde la API deben reflejarse en las consultas HTML. Se conservan layout, CSS, Morgan, identificación de solicitudes, medición de duración y cierre ordenado del servidor.
10. Persistencia y matriz de evidencias
La cátedra solicita resultados observados, no solamente resultados esperados. La siguiente matriz queda preparada para completar con capturas de Postman, navegador y Atlas de este TP 09. No se declara ejecutada ninguna prueba de TP 09 sin su evidencia.
Caso Resultado esperado Observación/evidencia TP 09
POST válido 201, Location, estado pendiente Pendiente
PUT completo 200, mismo ID, siete campos Pendiente
PUT incompleto 400, recurso intacto Pendiente
PATCH personas 200, otros campos conservados Pendiente
PATCH estado 200, otros campos conservados Pendiente
PATCH vacío, extra, _id o $set 400, sin modificación Pendiente
Personas 0, 7, 2.5, true, arreglo u objeto 400, sin modificación Pendiente
Estado, sala o turno inválidos 400, sin modificación Pendiente
ID mal formado 400 JSON Pendiente
ID válido inexistente (GET/PUT/PATCH/DELETE) 404, sin creación Pendiente
JSON mal formado o cuerpo ausente 400 JSON Pendiente
DELETE existente 204, sin cuerpo; cantidad -1 Pendiente
Segundo DELETE / GET posterior 404 Pendiente
Reinicio después de PUT/PATCH Conserva las modificaciones Pendiente
Reinicio después de DELETE Recurso sigue ausente Pendiente
HTML, formulario y /estado Contratos conservados Pendiente
Fallo inesperado simulado en entorno aislado 500, sin secretos Pendiente
Prettier y ESLint Sin errores Pendiente de ejecución en TP 09

Secuencia de persistencia: crear una reserva de ejercicio, registrar ID y cantidad inicial, actualizarla y registrar sus nuevos valores, reiniciar el servidor con la misma base reservas_salas_u9, comprobar que el cambio persiste; eliminar otro documento de ejercicio, reiniciar y comprobar que sigue ausente. Comparar la colección reservas_salas_u9/reservas en Atlas. No inventar cantidades ni repetir solicitudes POST para sustituir la evidencia de persistencia.

Las capturas deben identificar método, URL, estado y respuesta. En POST también la cabecera Location. Ocultar datos sensibles y usar únicamente datos ficticios. Registrar cantidad antes y después de los casos rechazados para demostrar que no se alteraron reservas.
11. Calidad y seguridad
Desde la raíz del proyecto:
npm.cmd run format
npm.cmd run check
format ejecuta Prettier sobre src y scripts; check verifica el formato y ejecuta ESLint. Conservar package.json, package-lock.json, .env.example, .gitignore, CommonJS y la configuración de calidad. No ejecutar cambios automáticos de dependencias sin revisar su impacto.

El .env real, claves, URI privada, node_modules/ y datos personales no deben publicarse. La API es una práctica académica sin autenticación ni autorización; no debe desplegarse públicamente sin implementar las protecciones correspondientes. Las consultas avanzadas y relaciones de datos quedan para la unidad 10.
12. Comparación TP 08 y TP 09
Aspecto TP 08 TP 09
POST Crea con estado pendiente Se conserva
GET listado y detalle Lectura persistente Se conserva, sin nuevos metadatos
PUT No implementado Reemplazo de siete campos
PATCH No implementado Solo personas y estado
DELETE No implementado Eliminación física por ID
Validación Principalmente creación Validación específica por método
Actualizaciones Mongoose No aplica runValidators: true, upsert: false
Persistencia Creación y lectura También actualización y eliminación
Base Atlas reservas_salas_u8 reservas_salas_u9
HTML y /estado Consultan Atlas Se mantienen y reflejan cambios

 1. Entrega
Subir el proyecto a un repositorio individual accesible al docente, con el nombre sugerido tp-09-salas-crud-mongodb. Debe incluir código fuente, vistas, estilos, scripts, package.json, package-lock.json, .env.example, .gitignore, configuración de ESLint y este README. Incorporar únicamente capturas o registros efectivamente obtenidos.

Estado documental actual: el código de PUT, PATCH y DELETE fue preparado durante el desarrollo del TP 09; la ejecución y las evidencias de Postman, persistencia y continuidad deben registrarse antes de considerar completa la entrega.
