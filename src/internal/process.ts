import { Router, Dealer } from "zeromq";
import { EventEmitter } from "events";
import Message from "../app/message";
import Event from "./event";
import URBTO from "./urbto";
import Connection from "./connection";

/**
 * Clase Process
 * Clase encargada de unificar la lógica
 * de todos los componentes, además de las conexiones
 * con otros procesos.
 */
export default class Process extends EventEmitter {

    private _eventIdInc = 0;                                    // Variable para general secuencialmente los ids de los eventos
    private _id: string;                                        // ID único del proceso
    private _ip: string;                                        // IP del proceso
    private _port: number;                                      // Puerto de escucha del proceso
    private _router: Router;                                    // Router de escucha del proceso
    private _urbto: URBTO;                                      // Componente URBTO

    /**
     * Constructor del proceso
     * @param id id único del proceso
     * @param ip ip del proceso
     * @param port puerto del proceso
     */
    constructor(id: string, ip: string, port: number, n: number, f: number, logical: boolean) {
        super();
        this._id = id;
        this._ip = ip;
        this._port = port;
        this._router = new Router();
        this._urbto = new URBTO(this, n, f, logical);
    }

    /**
     * Devuelve el id del proceso
     */
    get id(): string {
        return this._id;
    }

    /**
     * Devuelve la ip del proceso
     */
    get ip(): string {
        return this._ip;
    }

    /**
     * Devuelve el puerto del proceso
     */
    get port(): number {
        return this._port;
    }

    /**
     * Devuelve el componente de ordenación del proceso
     */
    get urbto(): URBTO {
        return this._urbto;
    }

    /**
     * Inicia el proceso internamente
     */
    public async init(): Promise<void> {

        await this._router.bind("tcp://" + this._ip + ":" + this._port)
        .then(() => {
            console.log("Proceso " + this._id + " escuchando...");
        });

        this.listen();
    }

    /**
     * Crea una nueva conexión y la conecta con la dirección del proceso externo
     * @param ip ip del proceso externo
     * @param port puerto del proceso externo
     */
    public connect(id: string, ip: string, port: number) {

        const connectionDealer: Dealer = new Dealer();
        connectionDealer.routingId = this._id;
        connectionDealer.connect("tcp://" + ip + ":" + port);

        const connection: Connection = new Connection(id, connectionDealer);

        this._urbto.peers.push(connection);
    }

    /**
     * Termina el proceso correctamente
     */
    public close(): void {

        this._urbto.peers.forEach((peer: Connection) => {
            peer.close();
        });
        this._router.close();
    }

    /**
     * Escucha contínuamente los balls enviados por otros procesos
     */
    private listen(): void {

        const processContext: Process = this;

        this._router.receive().then((buffer) => {
            const origin: string = buffer[0].toString();
            const event: Event = Event.deserialize(JSON.parse(buffer[1].toString()));

            this._urbto.recieveHandler(event, origin);
            processContext.listen(); // Escuchamos al siguiente
        });
    }

    /**
     * Construye un evento con el mensaje y lo envia
     * al componente de difusión
     * @param msg Mensaje a enviar
     */
    public urbtoBroadcast(msg: Message): void {

        const eventId: string = this._id + "_#" + this.newEventId();

        const event: Event = new Event(eventId, msg);
        this._urbto.urbtoBroadcast(event);
    }

    /**
     * Devuelve un nuevo id de evento
     */
    private newEventId(): number {
        return this._eventIdInc++;
    }
}
