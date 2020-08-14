import Message from '../app/message';

/**
 * Event class
 * Contains the message and the event parameters
 */
export default class Event {

    private _id: string;            // Unique event ID
    private _sourceId: string;      // Unique process ID
    private _nor: number;           // Number of receptions of the event
    private _ts: number;            // Timestamp in which the event was created
    private _msg: Message;          // Message information

    /**
     * Event constructor
     * @param id event unique id
     * @param msg event message
     */
    constructor(id: string, msg: Message, sourceId: string = undefined, nor: number = undefined, ts: number = undefined) {
        this._id = id;
        this._sourceId = sourceId;
        this._nor = nor;
        this._ts = ts;
        this._msg = msg;
    }

    /**
     * Returns the event id
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns the process sender id
     */
    get sourceId(): string {
        return this._sourceId;
    }

    /**
     * Sets the sender process
     */
    set sourceId(sourceId: string) {
        this._sourceId = sourceId;
    }

    /**
     * Returns the number of receptions of the event
     */
    get nor(): number {
        return this._nor;
    }

    /**
     * Sets the number of receptions of the event
     */
    set nor(nor: number) {
        this._nor = nor;
    }

    /**
     * Returns the timestamp of the event
     */
    get ts(): number {
        return this._ts;
    }

    /**
     * Sets the timestamp of the event
     */
    set ts(ts: number) {
        this._ts = ts;
    }

    /**
     * Returns the message of the event
     */
    get msg(): Message {
        return this._msg;
    }

    /**
     * Sets the message of the event
     */
    set msg(msg: Message) {
        this._msg = msg;
    }

    /**
     * Returns an exact copy of the object
     */
    public copy(): Event {
        return new Event(this._id, this._msg.copy(), this._sourceId, this._nor, this._ts);
    }

    /**
     * Serializes the event
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deseralize the event back to an object
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
