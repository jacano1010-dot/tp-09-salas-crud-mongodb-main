const path = require("node:path");
const { cwd } = require("node:process");
const express = require("express");
const morgan = require("morgan");
const expressLayouts = require("express-ejs-layouts");

const {
  identificarSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");

const crearRouterReservas = require("./rutas/reservas");
const crearRouterReservasApi = require("./rutas/reservas-api");

function crearApp({
  controladorReservas,
  controladorReservasApi,
  formatoMorgan,
}) {
  const app = express();

  
  app.use(morgan(formatoMorgan));
  app.use(identificarSolicitud);
  app.use(medirDuracion);

  
  app.use(expressLayouts);
  app.use(express.static(path.join(cwd(), "public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());


  app.set("view engine", "ejs");
  app.set("views", path.join(cwd(), "views"));
  app.set("layout", "layouts/main");

  
  app.get("/", controladorReservas.inicio);
  app.get("/estado", controladorReservas.estado);

 
  const reservasRouter = crearRouterReservas(controladorReservas);
  app.use("/reservas", reservasRouter);


  const reservasApiRouter = crearRouterReservasApi(controladorReservasApi);
  app.use("/api/reservas", reservasApiRouter);


  app.use("/api", (req, res) => {
    return res.status(404).json({
      error: "El endpoint solicitado no existe.",
    });
  });

  
  app.use((req, res) => {
    return res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const esApi = req.path === "/api" || req.path.startsWith("/api/");

    const esJsonInvalido =
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type === "entity.parse.failed";

    const esValidacionMongoose =
      error.name === "ValidationError" || error.name === "CastError";

    const estado =
      esJsonInvalido || esValidacionMongoose || error.status === 400
        ? 400
        : 500;

    if (estado === 500) {
      console.error("Error interno al procesar una solicitud.");
    }

    if (esApi) {
      return res.status(estado).json({
        error:
          estado === 400
            ? "La solicitud contiene datos inválidos."
            : "Error interno del servidor.",
      });
    }

    return res.status(estado).render("no-encontrado", {
      titulo: estado === 400 ? "Solicitud inválida" : "Error del servidor",
      mensaje:
        estado === 400
          ? "No se pudo procesar la solicitud."
          : "Ocurrió un error inesperado.",
    });
  });

  return app;
}

module.exports = crearApp;
