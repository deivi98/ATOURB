import { Router, Dealer } from "zeromq";
import { EventEmitter } from "events";
import DisseminationComponent from "./disseminationcomponent";
import OrderingComponent from "./orderingcomponent";
import Message from "../app/message";
import Event from "./event";
import Ball from "./ball";

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
    private _disseminationComponent: DisseminationComponent;    // Componente de difusión
    private _orderingComponent: OrderingComponent;              // Componente de ordenación

    /**
     * Constructor del proceso
     * @param id id único del proceso
     * @param ip ip del proceso
     * @param port puerto del proceso
     */
    constructor(id: string, ip: string, port: number) {
        super();
        this._id = id;
        this._ip = ip;
        this._port = port;
        this._router = new Router();
        this._disseminationComponent = new DisseminationComponent(this);
        this._orderingComponent = new OrderingComponent(this);
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
    get orderingComponent(): OrderingComponent {
        return this._orderingComponent;
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
        this._disseminationComponent.startFirstRound();
    }

    /**
     * Crea una nueva conexión y la conecta con la dirección del proceso externo
     * @param ip ip del proceso externo
     * @param port puerto del proceso externo
     */
    public connect(ip: string, port: number) {

        const connectionDealer: Dealer = new Dealer();
        connectionDealer.connect("tcp://" + ip + ":" + port);
        this._disseminationComponent.peers.push(connectionDealer);
    }

    /**
     * Termina el proceso correctamente
     */
    public close(): void {

        this._disseminationComponent.endRounds();
        this._disseminationComponent.peers.forEach((dealer: Dealer) => {
            dealer.close();
        });
        this._router.close();
    }

    /**
     * Escucha contínuamente los balls enviados por otros procesos
     */
    private listen(): void {

        const processContext: Process = this;

        this._router.receive().then((buffer) => {
            const serializedBall: Object = JSON.parse(buffer[1].toString());

            var ball: Ball = Ball.deserialize(serializedBall);

            this._disseminationComponent.recieveBall(ball);
            processContext.listen(); // Escuchamos al siguiente
        });
    }

    /**
     * Construye un evento con el mensaje y lo envia
     * al componente de difusión
     * @param msg Mensaje a enviar
     */
    public epToBroadcast(msg: Message): void {

        const eventId: string = this._id + "_#" + this.newEventId();

        const event: Event = new Event(eventId, msg);
        this._disseminationComponent.epToBroadcast(event);
    }

    /**
     * Devuelve un nuevo id de evento
     */
    private newEventId(): number {
        return this._eventIdInc++;
    }
}
