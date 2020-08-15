/**
 * Message class
 * Information the application wants to
 * deliver lastly
 */
export default class Message {

    private _data: string;          // Message data
    private _ts: number;            // Real timestamp of creation

    /**
     * Message constructor
     * @param data message
     */
    constructor(data: string) {
        this._data = data;
        this._ts = Date.now();
    }

    /**
     * Returns the message data
     */
    get data(): string {
        return this._data;
    }
    
    /**
     * Returns the timestamp of the message
     */
    get ts(): number {
        return this._ts;
    }

    public copy(): Message {
        return new Message(this._data);
    }

    /**
     * Serializes the message
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deserialize the message back into a Message object
     * @param object resulting object
     */
    public static deserialize(object: Object): Message {
        const msg: Message = Object.assign(new Message(undefined), object);
		return msg;
	}
}
