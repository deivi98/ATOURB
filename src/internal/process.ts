import { Router, Dealer } from "zeromq";
import { EventEmitter } from "events";
import Message from "../app/message";
import Event from "./event";
import ATOURB from "./atourb";
import Connection from "./connection";

/**
 * Process class
 * Class in charge of unifying the logic of
 * all components, in addition of the connections
 * to other processes.
 */
export default class Process extends EventEmitter {

    private _eventIdInc = 0;                                    // Auto incremental process id variable generator
    private _id: string;                                        // Unique process ID
    private _ip: string;                                        // Process IP
    private _port: number;                                      // Process port
    private _router: Router;                                    // Process router to listen
    private _atourb: ATOURB;                                    // ATOURB component

    /**
     * Process constructor
     * @param id unique id of process
     * @param ip ip of process
     * @param port port of process
     */
    constructor(id: string, ip: string, port: number, n: number, f: number, logical: boolean) {
        super();
        this._id = id;
        this._ip = ip;
        this._port = port;
        this._router = new Router();
        this._atourb = new ATOURB(this, n, f, logical);
    }

    /**
     * Returns the process id
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns the process IP
     */
    get ip(): string {
        return this._ip;
    }

    /**
     * Returns the process port
     */
    get port(): number {
        return this._port;
    }

    /**
     * Returns the program algorithm
     */
    get atourb(): ATOURB {
        return this._atourb;
    }

    /**
     * Initializes the process and start listening events
     */
    public async init(): Promise<void> {

        await this._router.bind("tcp://" + this._ip + ":" + this._port)
        .then(() => {
            console.log("Process " + this._id + " listening...");
        });

        this.listen();
    }

    /**
     * Creates a new connection with its dealer and connects to other client
     * @param ip other process ip
     * @param port other process port
     */
    public connect(id: string, ip: string, port: number) {

        const connectionDealer: Dealer = new Dealer();
        connectionDealer.routingId = this._id;
        connectionDealer.connect("tcp://" + ip + ":" + port);

        const connection: Connection = new Connection(id, connectionDealer);

        this._atourb.peers.push(connection);
    }

    /**
     * Termitates the process correctly
     */
    public close(): void {

        this._atourb.peers.forEach((peer: Connection) => {
            peer.close();
        });
        this._router.close();
    }

    /**
     * Listen to other processes events
     */
    private listen(): void {

        const processContext: Process = this;

        this._router.receive().then((buffer) => {
            // const origin: string = buffer[0].toString();
            const event: Event = Event.deserialize(JSON.parse(buffer[1].toString()));

            this._atourb.receiveHandler(event);
            processContext.listen(); // Start listening next one
        });
    }

    /**
     * Builds an event with its message and sends it
     * to the algorithm
     * @param msg message to send
     */
    public broadcast(msg: Message): void {

        const eventId: string = this._id + "_#" + this.newEventId();

        const event: Event = new Event(eventId, msg);
        this._atourb.broadcast(event);
    }

    /**
     * Returns a new event unique id
     */
    private newEventId(): number {
        return this._eventIdInc++;
    }
}
