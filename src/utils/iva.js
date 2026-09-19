/**
 * Calcula IVA discriminado por alícuota a partir de los items de una venta.
 * Misma lógica que ya validaste en la versión original (Stockeado8.html),
 * portada acá para que viva en el servidor y no se pueda manipular
 * desde el cliente.
 *
 * alícuotas soportadas: 21, 10.5, 27, 0 (exento), -1 (no gravado)
 */
function calcularIVA(items = [], condicionFiscal = 'Consumidor Final') {
  let gravado = 0, exento = 0, noGravado = 0, iva21 = 0, iva105 = 0, iva27 = 0;

  for (const it of items) {
    const sub = (Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0) * (1 - (Number(it.descuentoPct || 0) / 100));
    const al = Number(it.ivaAlicuota ?? 21);

    if (al === -1) noGravado += sub;
    else if (al === 0) exento += sub;
    else {
      gravado += sub;
      if (al === 21) iva21 += sub * 0.21;
      else if (al === 10.5) iva105 += sub * 0.105;
      else if (al === 27) iva27 += sub * 0.27;
    }
  }

  // Consumidor Final ve precio final, sin discriminar IVA en el total mostrado
  const totalIVA = condicionFiscal === 'Consumidor Final' ? 0 : iva21 + iva105 + iva27;
  const subtotal = gravado + exento + noGravado;
  const total = subtotal + totalIVA;

  return {
    subtotal: round2(subtotal),
    iva21: round2(iva21),
    iva105: round2(iva105),
    iva27: round2(iva27),
    total: round2(total),
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { calcularIVA };
