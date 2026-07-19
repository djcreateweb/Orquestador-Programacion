// errors.js — Error de dominio con código, estado HTTP y mensaje PÚBLICO genérico.
// El mensaje interno (para logs) puede ser específico; el público nunca revela si
// falló el usuario o el PIN, ni detalles sensibles (§6.5).

export class ErrorPresentia extends Error {
  /**
   * @param {string} code   código estable (p.ej. 'PIN_INCORRECTO')
   * @param {number} status estado HTTP
   * @param {string} mensaje mensaje interno (logs)
   * @param {string} [publico] mensaje mostrado al usuario (genérico)
   */
  constructor(code, status, mensaje, publico) {
    super(mensaje);
    this.name = 'ErrorPresentia';
    this.code = code;
    this.status = status;
    this.publico = publico ?? 'La operación no se pudo completar.';
  }
}

export const err = (code, status, mensaje, publico) => new ErrorPresentia(code, status, mensaje, publico);
