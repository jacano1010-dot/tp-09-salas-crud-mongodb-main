const crearApp = require("./app");

const crearServicioReservas = require("./servicios/reservas");

const crearControladorReservas = require("./controladores/reservas");

const crearControladorReservasApi = require("./controladores/reservas-api");

const {
  conectarBaseDatos,
  desconectarBaseDatos,
} = require("./config/base-datos");

const { puerto, formatoMorgan } = require("./config/entorno");


const servicioReservas = crearServicioReservas();


const controladorReservas = crearControladorReservas(servicioReservas);


const controladorReservasApi = crearControladorReservasApi(servicioReservas);


const app = crearApp({
  controladorReservas,
  controladorReservasApi,
  formatoMorgan,
});

let servidor;
let cerrando = false;


async function iniciar() {
  try {
    await conectarBaseDatos();

    servidor = app.listen(puerto, () => {
      console.log(`Servidor ejecutándose en http://localhost:${puerto}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);

    process.exitCode = 1;

    await desconectarBaseDatos();
  }
}


async function cerrarServidor(senal) {
  if (cerrando) {
    return;
  }

  cerrando = true;

  console.log(`Cerrando servidor por ${senal}...`);

  try {
    if (servidor) {
      await new Promise((resolve, reject) => {
        servidor.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    await desconectarBaseDatos();

    console.log("Servidor cerrado correctamente.");
  } catch {
    console.error("Error durante el cierre del servidor.");

    process.exitCode = 1;
  }
}


process.on("SIGINT", () => {
  void cerrarServidor("SIGINT");
});


process.on("SIGTERM", () => {
  void cerrarServidor("SIGTERM");
});


void iniciar();
