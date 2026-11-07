const express = require("express");

const {
  validarReservaApi,
  validarReemplazoApi,
  validarParcialApi,
} = require("../middleware/reservas");

function crearRouterReservasApi(controlador) {
  const router = express.Router();

  // GET - Listar todas las reservas
  router.get("/", controlador.listar);

  // GET - Consultar una reserva por ID
  router.get("/:id", controlador.detalle);

  // POST - Crear una reserva
  router.post("/", validarReservaApi, controlador.crear);

  // PUT - Reemplazar una reserva completa
  router.put("/:id", validarReemplazoApi, controlador.reemplazar);

  // PATCH - Modificar parcialmente una reserva
  router.patch("/:id", validarParcialApi, controlador.modificarParcialmente);

  // DELETE - Eliminar físicamente una reserva
  router.delete("/:id", controlador.eliminar);

  return router;
}

module.exports = crearRouterReservasApi;
