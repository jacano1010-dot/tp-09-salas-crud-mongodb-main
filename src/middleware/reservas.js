const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];

const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

const estadosPermitidos = ["pendiente", "confirmada"];

const camposCreacion = [
  "estudiante",
  "email",
  "sala",
  "fecha",
  "turno",
  "personas",
];

const camposReemplazo = [...camposCreacion, "estado"];

const camposParciales = ["personas", "estado"];

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas de estudio";
  next();
}

function esObjetoPlano(valor) {
  return (
    valor !== null &&
    typeof valor === "object" &&
    !Array.isArray(valor) &&
    Object.getPrototypeOf(valor) === Object.prototype
  );
}

function convertirPersonas(valor) {
  if (typeof valor === "number") {
    return valor;
  }

  if (
    typeof valor === "string" &&
    valor.trim() !== "" &&
    /^[0-9]+$/.test(valor.trim())
  ) {
    return Number(valor.trim());
  }

  return NaN;
}

function validarDatosReserva(datos, modo = "crear") {
  const errores = [];

  if (!esObjetoPlano(datos)) {
    return {
      errores: ["El cuerpo debe ser un objeto JSON válido."],
      reserva: {},
    };
  }

  const camposPermitidos =
    modo === "reemplazar"
      ? camposReemplazo
      : modo === "parcial"
        ? camposParciales
        : camposCreacion;

  const camposPresentes = Object.keys(datos);

  
  if (modo !== "crear") {
    for (const campo of camposPresentes) {
      if (!camposPermitidos.includes(campo)) {
        errores.push(`El campo ${campo} no está permitido.`);
      }
    }
  }

  if (modo === "parcial" && camposPresentes.length === 0) {
    errores.push("PATCH requiere al menos un campo.");
  }

  const reserva = {};

  function validarTexto(campo, etiqueta) {
    const valor = datos[campo];

    if (typeof valor !== "string" || valor.trim() === "") {
      errores.push(`${etiqueta} debe ser un texto obligatorio.`);
      return;
    }

    reserva[campo] = valor.trim();
  }

  if (modo !== "parcial") {
    validarTexto("estudiante", "El estudiante");
    validarTexto("email", "El correo electrónico");
    validarTexto("sala", "La sala");
    validarTexto("fecha", "La fecha");
    validarTexto("turno", "El turno");

    if (reserva.email && !reserva.email.includes("@")) {
      errores.push("El correo electrónico debe contener @.");
    }

    if (reserva.sala && !salasPermitidas.includes(reserva.sala)) {
      errores.push("La sala seleccionada no es válida.");
    }

    if (reserva.turno && !turnosPermitidos.includes(reserva.turno)) {
      errores.push("El turno seleccionado no es válido.");
    }
  }

  
  if (
    modo !== "parcial" ||
    Object.prototype.hasOwnProperty.call(datos, "personas")
  ) {
    const personas = convertirPersonas(datos.personas);

    if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
      errores.push(
        "La cantidad de personas debe ser un número entero entre 1 y 6."
      );
    } else {
      reserva.personas = personas;
    }
  }

 
  if (
    modo === "reemplazar" ||
    (modo === "parcial" &&
      Object.prototype.hasOwnProperty.call(datos, "estado"))
  ) {
    if (
      typeof datos.estado !== "string" ||
      !estadosPermitidos.includes(datos.estado)
    ) {
      errores.push("El estado debe ser pendiente o confirmada.");
    } else {
      reserva.estado = datos.estado;
    }
  }

  return {
    errores,
    reserva,
  };
}

function validarReserva(req, res, next) {
  const resultado = validarDatosReserva(req.body, "crear");

  if (resultado.errores.length > 0) {
    const valores = esObjetoPlano(req.body) ? req.body : {};

    const valoresFormulario = {};

    for (const campo of camposCreacion) {
      const valor = valores[campo];

      valoresFormulario[campo] =
        typeof valor === "string" || typeof valor === "number"
          ? String(valor)
          : "";
    }

    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      errores: resultado.errores,
      valores: valoresFormulario,
      salasPermitidas,
      turnosPermitidos,
    });
  }

  req.reservaValidada = resultado.reserva;

  return next();
}

function responderErrorApi(res, errores) {
  return res.status(400).json({
    error: "Datos de reserva inválidos.",
    detalles: errores,
  });
}

function validarReservaApi(req, res, next) {
  const resultado = validarDatosReserva(req.body, "crear");

  if (resultado.errores.length > 0) {
    return responderErrorApi(res, resultado.errores);
  }

  req.reservaValidada = resultado.reserva;

  return next();
}

function validarReemplazoApi(req, res, next) {
  const resultado = validarDatosReserva(req.body, "reemplazar");

  if (resultado.errores.length > 0) {
    return responderErrorApi(res, resultado.errores);
  }

  req.reservaValidada = resultado.reserva;

  return next();
}

function validarParcialApi(req, res, next) {
  const resultado = validarDatosReserva(req.body, "parcial");

  if (resultado.errores.length > 0) {
    return responderErrorApi(res, resultado.errores);
  }

  req.reservaValidada = resultado.reserva;

  return next();
}

module.exports = {
  prepararAreaReservas,
  validarReserva,
  validarReservaApi,
  validarReemplazoApi,
  validarParcialApi,
  validarDatosReserva,
  salasPermitidas,
  turnosPermitidos,
  estadosPermitidos,
};
