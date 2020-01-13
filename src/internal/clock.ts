/**
 * Clase Clock
 * Simple clase para obtener el tiempo
 * actual en milisegundos
 */
export default class Clock {

    /**
     * Devuelve el tiempo ahora
     */
    public static getTime(): number {
        return Date.now();
    }
}
