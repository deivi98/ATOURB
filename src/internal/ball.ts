import Event from "./event";

/**
 * Clase Ball
 * Conjunto de eventos listos
 * para serializarse y enviarse a través del socket
 * al resto de procesos/clientes
 */
export default class Ball {

    private _events: Event[];   // Conjunto/Lista de eventos

    /**
     * Constructor de Ball
     * @param events lista de eventos
     */
    constructor(events: Event[]) {
        this._events = events;
    }

    /**
     * Devuelve la lista de eventos
     */
    get events(): Event[] {
        return this._events;
    }

    /**
     * Serializa el Ball
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deserializa el objeto para obtener el objeto Ball de nuevo
     * @param object objeto
     */
    public static deserialize(object: Object): Ball {

        const ball: Ball = Object.assign(new Ball([]), object);

		if(ball.events) {
			for(var i = 0; i < ball.events.length; i++) {
				ball.events[i] = Event.deserialize(ball.events[i]);
			}
		}

        return ball;
    }
}
