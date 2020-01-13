import Message from '../app/message';

/**
 * Clase Event
 * Contiene los datos de los eventos que se
 * envían entre procesos
 */
export default class Event {

    private _id: string;            // ID único de evento (Incluso entre infinitos procesos)
    private _sourceId: string;      // ID único de proceso/cliente emisor
    private _ttl: number;           // Número de saltos realizados por el evento
    private _ts: number;            // Tiempo en el que fue emitido
    private _msg: Message;          // Mensaje del evento

    /**
     * Constructor del evento
     * @param id id único del evento
     * @param msg mensaje del evento
     */
    constructor(id: string, msg: Message) {
        this._id = id;
        this._sourceId = undefined;
        this._ttl = undefined;
        this._ts = undefined;
        this._msg = msg;
    }

    /**
     * Devuelve el id
     */
    get id(): string {
        return this._id;
    }

    /**
     * Devuelve el id del proceso/cliente emisor
     */
    get sourceId(): string {
        return this._sourceId;
    }

    /**
     * Setea el id del proceso/cliente emisor
     */
    set sourceId(sourceId: string) {
        this._sourceId = sourceId;
    }

    /**
     * Devuelve el ttl del evento
     */
    get ttl(): number {
        return this._ttl;
    }

    /**
     * Setea el ttl del evento
     */
    set ttl(ttl: number) {
        this._ttl = ttl;
    }

    /**
     * Devuelve el tiempo del evento
     */
    get ts(): number {
        return this._ts;
    }

    /**
     * Setea el tiempo del evento
     */
    set ts(ts: number) {
        this._ts = ts;
    }

    /**
     * Devuelve el mensaje del evento
     */
    get msg(): Message {
        return this._msg;
    }

    /**
     * Setea el mensaje del evento
     */
    set msg(msg: Message) {
        this._msg = msg;
    }

    /**
     * Serializa el evento
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deserializa el objeto para obtener el Evento
     * @param object objeto
     */
    public static deserialize(object: Object): Event {
        const event: Event = Object.assign(new Event(undefined, undefined), object);
        
        if(event.msg) {
		    event.msg = Message.deserialize(event.msg);
		}

		return event;
	}
}
