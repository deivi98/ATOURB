import Process from './process';
import Event from './event';
import Clock from './clock';
import { Dealer } from "zeromq";
import Ball from './ball';

/**
 * Clase DisseminationComponent
 * Componente que se encarga de la disusión de los
 * eventos a traves de la red entre procesos
 */
export default class DisseminationComponent {
    
    // Variables algoritmo
    public static TTL: number = 2;                  // Maximo numero de saltos de los eventos (Numero de nodos)
    private _nextBall: { [id: string]: Event; };    // Conjunto de eventos a enviar en la proxima ronda
    private _peers: Dealer[];                       // Conjunto de conexiones correctas (N nodos)
    
    // Variables adicionales
    private _process: Process;                      // Proceso al que pertenece
    private _nextRoundInterval: NodeJS.Timeout;     // Variable que guarda el interval repetitivo de las rondas

    /**
     * Constructor del componente
     * @param process proceso al que pertenece
     */
    constructor(process: Process) {
        this._process = process;
        this._nextBall = {};
        this._peers = [];
    }

    /**
     * Devuelve el conjunto de conexiones correctas a otros procesos
     */
    get peers(): Dealer[] {
        return this._peers;
    }

    /**
     * Prepara el envio del evento
     * @param event evento a enviar
     */
    public epToBroadcast(event: Event): void {
        event.ts = Clock.getTime();
        event.ttl = 0;
        event.sourceId = this._process.id;
        this._nextBall[event.id] = event;
    }

    /**
     * Recibe y procesa una ball de otro proceso
     * @param ball ball recibida
     */
    public recieveBall(ball: Ball): void {
        
        // Para cada evento del ball
        ball.events.forEach((event: Event) => {
            // Si no ha llegado al límite de saltos
            if(event.ttl < DisseminationComponent.TTL) {
                
                const localEvent: Event = this._nextBall[event.id];
                // Si ya existe el evento aquí
                if(localEvent) {
                    // Actualizamos su ttl y es preciso
                    if(localEvent.ttl < event.ttl) {
                        localEvent.ttl = event.ttl;
                    }
                } else {
                    // Si no, lo añadimos a la lista de proximos eventos a difundir
                    this._nextBall[event.id] = event;
                    // Si no existia en la proxima ball, y es la primera vez que
                    // este proceso ve este evento
                    // if(!this._process.orderingComponent.hasBeenSeen(event)) {
                    //     this._nextBall[event.id] = event;
                    // }
                }
            }
            // updateClock(event.ts) Solo si se usa relojes logicos
        });
    }

    /**
     * Ejecuta la siguiente ronda
     * @param context contexto del componente (Necesario para poder acceder a sus variables
     * desde el conexto de la funcion (Ahora es la del interval))
     */
    public nextRound(context: DisseminationComponent): void {
        // Aumenta los ttls de todos los eventos a difundir
        Object.keys(context._nextBall).forEach((id: string) => {
            context._nextBall[id].ttl++;
        });

        // Obtiene al lista de los eventos
        const events: Event[] = Object.values(context._nextBall);

        // Si no es nula, crea una ball con los eventos, la serializa y la envia a todas las conexiones
        if(events.length > 0) {

            const ball = new Ball(events);
            context._peers.forEach((peer: Dealer) => {
                peer.send(ball.serialize());
            });
        }

        // Finalmente envia al componente de ordenacion los eventos y limpia la lista para la siguiente ronda
        context._process.orderingComponent.orderEvents(events);
        context._nextBall = {};
    }

    // Funciones adicionales

    /**
     * Comienza las rondas
     */
    public startFirstRound(): void {
        this._nextRoundInterval = setInterval(this.nextRound, 500, this);
    }

    /**
     * Detiene las rondas
     */
    public endRounds(): void {
        clearInterval(this._nextRoundInterval);
    }
}
