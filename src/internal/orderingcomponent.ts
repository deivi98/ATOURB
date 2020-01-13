import Process from './process';
import Event from './event';
import DisseminationComponent from './disseminationcomponent';

/**
 * Clase OrderingComponent
 * Componente de ordenación, se encarga de ordenar
 * los eventos según tiempo y proceso/cliente emisor
 * y los entrega a la aplicación
 */
export default class OrderingComponent {

    // Variables algoritmo EpTO
    private _recieved: { [id: string]: Event; };        // Conjunto de eventos recibidos por el componente
    private _delivered: { [id: string]: Event; };       // Conjunto de eventos ya entregados a la aplicación
    private _lastDeliveredTs: number;                   // Tiempo del último evento entregado

    // Variables adicionales
    private _process: Process;                          // Proceso al que pertenece

    /**
     * Constructor del componente
     * @param process proceso al que pertenece
     */
    constructor(process: Process) {
        this._process = process;
        this._recieved = {};
        this._delivered = {};
        this._lastDeliveredTs = 0;
    }

    /**
     * Ordena los eventos y los entrega a la aplicación si es preciso
     * @param ball ball con el conjunto de eventos proximos
     */
    public orderEvents(ball: Event[]): void {

        // Aumenta el ttl de todos los eventos recibidos por el componente
        Object.keys(this._recieved).forEach((id: string) => {
            this._recieved[id].ttl++;
        });

        // Para cada evento del ball
        ball.forEach((event: Event) => {
            // Si no ha sido entregado y no es anterior al último evento entregado
            if(!this._delivered[event.id] && event.ts >= this._lastDeliveredTs) {

                // Si ya habia sido recibido por el componente
                if(this._recieved[event.id]) {
                    // Actualizamos su ttl si es preciso
                    if(this._recieved[event.id].ttl < event.ttl) {
                        this._recieved[event.id].ttl = event.ttl;
                    }
                } else {
                    // Si no, se añade
                    this._recieved[event.id] = event;
                }
            }
        });

        // Variables auxiliares
        var minQueuedTs: number = Number.MAX_VALUE;     // Tiempo del evento no entregable más antiguo
        var deliverableEvents: Event[] = [];            // Eventos entregables
        var realDeliverableEvents: Event[] = [];        // Eventos finalmente entregables

        // Para cada evento en recibidos
        Object.keys(this._recieved).forEach((id: string) => {
            const event = this._recieved[id];

            // Si es entregable
            if(this.isDeliverable(event)) {
                // Lo añadimos a entregables
                deliverableEvents.push(event);
            } else if(event.ts < minQueuedTs) {
                // Si no, si su tiempo es anterior al minimo encontrado
                // de entre los eventos no entregables, actualizamos minimo
                minQueuedTs = event.ts;
            }
        });

        // Para cada evento inicialmente entregable
        deliverableEvents.forEach((event: Event) => {
            // Si su tiempo es posterior al tiempo del evento no entregable más antiguo,
            // entonces este tampoco es entregable, si es anterior, entonces sí es realmente
            // entregable.
            if(event.ts <= minQueuedTs) {
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
            this._delivered[event.id] = event;
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
        return event.ttl > DisseminationComponent.TTL;
    }
}
