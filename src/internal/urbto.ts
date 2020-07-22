import Process from './process';
import Event from './event';
import Clock from './clock';
import Connection from './connection';

/**
 * Clase URBTO
 * Componente que se encarga de la disusión y ordenación de los
 * eventos a traves de la red entre procesos
 */
export default class URBTO {
    
    // Variables algoritmo URBTO
    private _n: number;                                                 // Numero de nodos totales del a red
    private _f: number;                                                 // Numero posible de fallos
    private _peers: Connection[];                                       // Conjunto de conexiones correctas
    private _recieved: { [id: string]: Event; };                        // Conjunto de eventos recibidos
    private _lastDeliveredProcessEvents: { [id: string]: Event; };      // Conjunto de ultimos eventos entregados a la aplicacion por proceso
    private _lastDisorderDeliveredProcessEvents: { [id: string]: Event; };      // Conjunto de ultimos eventos entregados en desorden a la aplicacion por proceso
    private _lastDeliveredTs: number;                                   // Tiempo del último evento entregado   

    // Variables adicionales
    private _process: Process;                                          // Proceso al que pertenece

    /**
     * Constructor del componente
     * @param process proceso al que pertenece
     */
    constructor(process: Process, n: number, f: number) {
        this._process = process;
        this._recieved = {};
        this._lastDeliveredProcessEvents = {};
        this._lastDisorderDeliveredProcessEvents = {};
        this._lastDeliveredTs = 0;
        this._peers = [];
        this._n = n;
        this._f = f;
    }

    /**
     * Devuelve el conjunto de conexiones correctas a otros procesos
     */
    get peers(): Connection[] {
        return this._peers;
    }

    /**
     * Prepara el envio del evento
     * @param event evento a enviar
     */
    public urbtoBroadcast(event: Event): void {
        event.ts = Clock.getTime();
        event.nor = 0;
        event.sourceId = this._process.id;
        this.recieveHandler(event, this._process.id);
    }

    private isLastDeliveredOfAnyProcess(event: Event): boolean {
        return ((Object.values(this._lastDeliveredProcessEvents).find((e: Event) => {
            return e.id == event.id;
        }) !== undefined) || (Object.values(this._lastDisorderDeliveredProcessEvents).find((e: Event) => {
            return e.id == event.id;
        }) !== undefined));
    }

    /**
     * Recibe un evento y su origen
     * @param event evento recibido
     */
    public recieveHandler(event: Event, senderId: string): void {

        if(this._recieved[event.id]) {

            this._recieved[event.id].nor++;
            // console.log("Recieved " + this._recieved[event.id].nor + " times");

            if(this.isDeliverable(this._recieved[event.id])) {
                this.orderAndDeliverEvents();
            }
        } else if(!this.isLastDeliveredOfAnyProcess(event)) {
            this._recieved[event.id] = event.copy();
            this._recieved[event.id].nor++;

            // console.log("First time received! From: " + senderId);

            this._peers.forEach((peer: Connection) => {
                // if(peer.id != senderId) {
                    if(!peer.closed) {
                        // console.log("To: " + peer.id);
                        peer.dealer.send(event.serialize()).catch((err: any) => {
                            console.log(err);
                        });
                    }
                // }
            });

       }
        // Update clock
    }

    /**
     * Ordena los eventos y los entrega a la aplicación si es preciso
     */
    public orderAndDeliverEvents(): void {
        var
            minTsOfNonDeliverable: number = Number.MAX_SAFE_INTEGER,
            deliverableEvents: Event[] = [],
            maxNor: number,
            realDeliverableEvents: Event[] = [];
        
        Object.keys(this._recieved).forEach((idA: string) => {
            Object.keys(this._recieved).forEach((idB: string) => {
               
                if(idA != idB) {
                    if(this._recieved[idA].ts == this._recieved[idB].ts) {

                        maxNor = Math.max(this._recieved[idA].nor, this._recieved[idB].nor);
                        this._recieved[idA].nor = maxNor;
                        this._recieved[idB].nor = maxNor;
                    }
                }
            }); 
        });

        Object.keys(this._recieved).forEach((id: string) => {
            const event: Event = this._recieved[id];

            if(event.ts < this._lastDeliveredTs) {
                delete this._recieved[event.id];
                this._lastDisorderDeliveredProcessEvents[event.sourceId] = event;
                this._process.emit('message-disorder', event);
            } else if(this.isDeliverable(event)) {
                deliverableEvents.push(event);
            } else if(event.ts < minTsOfNonDeliverable) {
                minTsOfNonDeliverable = event.ts;
            }
        });

        // Para cada evento inicialmente entregable
        deliverableEvents.forEach((event: Event) => {
            // Si su tiempo es posterior al tiempo del evento no entregable más antiguo,
            // entonces este tampoco es entregable, si es anterior, entonces sí es realmente
            // entregable.
            if(event.ts <= minTsOfNonDeliverable) {
                realDeliverableEvents.push(event);
                delete this._recieved[event.id];
            }
        });

        // Para todos los eventos finalmente entregables,
        // los ordenamos por tiempo y por id del proceso/cliente emisor
        // y los entregamos a la aplicación.
        realDeliverableEvents.sort(function(e1: Event, e2: Event): number {
            return (e1.ts - e2.ts) || (e1.sourceId == e2.sourceId ? 0: (e1.sourceId < e2.sourceId ? -1: 1));
        }).forEach((event: Event) => {
            this._lastDeliveredProcessEvents[event.sourceId] = event;
            this._lastDeliveredTs = event.ts;
            this._process.emit('message', event);
        });
    }

    /**
     * Devuelve si el evento es entregable a la aplicación,
     * es decir, si ha dado el número de saltos suficientes
     * como para poder afirmar con alta probabilidad que
     * el resto de procesos correctos lo han recibido también.
     * @param event evento a comprobar
     */
    private isDeliverable(event: Event): boolean {
        return event.nor >= this._n - this._f;
    }
    
}
