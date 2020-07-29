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

/**
 * Clase LogicalClock
 * Simple clase para obtener el tiempo logico actual
 */
export class LogicalClock {
    
    private _logicalTime: number;

    constructor() {
        this._logicalTime = 0;
    }

    /**
     * Devuelve el tiempo ahora
     */
    public getTime(): number {
        return this._logicalTime++;
    }
    
    /**
     * Actualiza el tiempo logico
     */
    public updateClock(time: number) {

        if(time > this._logicalTime) {
            this._logicalTime = time;
        }
    }

}