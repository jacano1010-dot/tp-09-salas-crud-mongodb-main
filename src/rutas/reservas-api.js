const express = require("express");

const {
  validarReservaApi,
  validarReemplazoApi,
  validarParcialApi,
} = require("../middleware/reservas");

function crearRouterReservasApi(controlador) {
  const router = express.Router();

  
  router.get("/", controlador.listar);

  
  router.get("/:id", controlador.detalle);


  router.post("/", validarReservaApi, controlador.crear);


  router.put("/:id", validarReemplazoApi, controlador.reemplazar);


  router.patch("/:id", validarParcialApi, controlador.modificarParcialmente);


  router.delete("/:id", controlador.eliminar);

  return router;
}

module.exports = crearRouterReservasApi;
