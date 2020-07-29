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

export class LogicalClock {
    
    static logicalTime: number = 0;

    /**
     * Devuelve el tiempo ahora
     */
    public static getTime(): number {
        return this.logicalTime;
    }
    
    /**
     * Devuelve el tiempo ahora
     */
    public static updateClock(time: number) {

        if(time > this.logicalTime) {
            this.logicalTime = time;
        }
    }

}