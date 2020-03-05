import Message from '../app/message';

/**
 * Clase Event
 * Contiene los datos de los eventos que se
 * envían entre procesos
 */
export default class Event {

    private _id: string;            // ID único de evento (Incluso entre infinitos procesos)
    private _sourceId: string;      // ID único de proceso/cliente emisor
    private _nor: number;           // Número de recepciones del evento
    private _ts: number;            // Tiempo en el que fue emitido
    private _msg: Message;          // Mensaje del evento

    /**
     * Constructor del evento
     * @param id id único del evento
     * @param msg mensaje del evento
     */
    constructor(id: string, msg: Message, sourceId: string = undefined, nor: number = undefined, ts: number = undefined) {
        this._id = id;
        this._sourceId = sourceId;
        this._nor = nor;
        this._ts = ts;
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
     * Devuelve el nor del evento
     */
    get nor(): number {
        return this._nor;
    }

    /**
     * Setea el ttl del evento
     */
    set nor(nor: number) {
        this._nor = nor;
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

    public copy(): Event {
        return new Event(this._id, this._msg.copy(), this._sourceId, this._nor, this._ts);
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
