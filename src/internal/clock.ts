/**
 * Clock class
 */
export default class Clock {

    /**
     * Returns the actual time
     */
    public static getTime(): number {
        return Date.now();
    }

}

/**
 * LogicalClock class
 */
export class LogicalClock {
    
    private _logicalTime: number;

    constructor() {
        this._logicalTime = 0;
    }

    /**
     * Returns the actual time
     */
    public getTime(): number {
        return this._logicalTime++;
    }
    
    /**
     * Updates the clock
     */
    public updateClock(time: number) {

        if(time > this._logicalTime) {
            this._logicalTime = time + 1;
        }
    }

}