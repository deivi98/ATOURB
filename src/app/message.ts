/**
 * Clase Message
 * Lo que la aplicación desea enviar
 * y recibir en última instancia
 */
export default class Message {

    private _data: string;          // Mensaje o frase

    /**
     * Constructor del mensaje
     * @param data mensaje
     */
    constructor(data: string) {
        this._data = data;
    }

    /**
     * Devuelve los datos del mensaje
     */
    get data(): string {
        return this._data;
    }

    public copy(): Message {
        return new Message(this._data);
    }

    /**
     * Serializa el objeto mensaje
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deserializa un objeto para que vuelva a ser de tipo Message
     * @param object objeto a deserializar
     */
    public static deserialize(object: Object): Message {
        const msg: Message = Object.assign(new Message(undefined), object);
		return msg;
	}
}
