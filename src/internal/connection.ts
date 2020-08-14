import { Dealer } from "zeromq";

/**
 * Connection class
 * Saves the information to
 * connect to other clients
 */
export default class Connection {

    private _id: string;          // Connection process ID
    private _dealer: Dealer;      // Connection dealer
    private _closed: boolean = false;

    /**
     * Connection constructor
     * @param id client ID
     * @param dealer dealer
     */
    constructor(id: string, dealer: Dealer) {
        this._id = id;
        this._dealer = dealer;
    }

    /**
     * Returns the client ID
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns wether the connection is closed or not
     */
    get closed(): boolean {
        return this._closed;
    }

    /**
     * Returns the connection dealer
     */
    get dealer(): Dealer {
        return this._dealer;
    }

    /**
     * Closes the connection safely
     */
    public close(): void {
        this._closed = true;
        this._dealer.close();
    }
}
