import Process from './process';
import Event from './event';
import Clock from './clock';
import { LogicalClock } from './clock';
import Connection from './connection';

/**
 * ATOURB algorithm class
 * Main algorithm of this program. It manages
 * message dissemination and ordering
 */
export default class ATOURB {
    
    // Algorithm variables
    private _n: number;                                                 // Total nodes in the network
    private _f: number;                                                 // Maximum non-correct processes
    private _peers: Connection[];                                       // Process conecction peers set
    private _recieved: { [id: string]: Event; };                        // Map of received events
    private _lastDeliveredProcessEvents: { [id: string]: Event; };      // Map of last delivered events per process origin
    private _lastDisorderDeliveredProcessEvents: { [id: string]: Event; };      // Mast of last disorder delivered events per process origin
    private _lastDeliveredTs: number;                                   // Timestamp of the last delivered process

    // Additional variables
    private _process: Process;                                          // Associated process
    private _logical: boolean;                                          // Wether the clock is logical or not
    private _logicalClock: LogicalClock;                                // Logical clock

    /**
     * Algorithm class constructor
     * @param process program process
     */
    constructor(process: Process, n: number, f: number, logical: boolean) {
        this._process = process;
        this._recieved = {};
        this._lastDeliveredProcessEvents = {};
        this._lastDisorderDeliveredProcessEvents = {};
        this._lastDeliveredTs = 0;
        this._peers = [];
        this._n = n;
        this._f = f;
        this._logical = logical;
        this._logicalClock = new LogicalClock();
    }

    /**
     * Returns the set of connections to other clients
     */
    get peers(): Connection[] {
        return this._peers;
    }

    /**
     * Prepares the event and sends it
     * @param event event to send
     */
    public broadcast(event: Event): void {
        if(this._logical) {
            event.ts = this._logicalClock.getTime();
        } else {
            event.ts = Clock.getTime();
        }
        event.nor = 0;
        event.sourceId = this._process.id;
        this.receiveHandler(event);
    }

    /**
     * Checks if the event is one of the last delivered
     * of any of the processes
     * @param event event to check
     */
    private isLastDeliveredOfAnyProcess(event: Event): boolean {
        return ((Object.values(this._lastDeliveredProcessEvents).find((e: Event) => {
            return e.id == event.id;
        }) !== undefined) || (Object.values(this._lastDisorderDeliveredProcessEvents).find((e: Event) => {
            return e.id == event.id;
        }) !== undefined));
    }

    /**
     * Receive an event
     * @param event received event
     */
    public receiveHandler(event: Event): void {

        if(this._recieved[event.id]) {

            this._recieved[event.id].nor++;

            if(this.isDeliverable(this._recieved[event.id])) {
                this.orderAndDeliverEvents();
            }
        } else if(!this.isLastDeliveredOfAnyProcess(event)) {

            this._recieved[event.id] = event.copy();
            this._recieved[event.id].nor++;

            this._peers.forEach((peer: Connection) => {

                if(!peer.closed) {
                    peer.dealer.send(event.serialize()).catch((err: any) => {
                        console.log(err);
                    });
                }
            });
        }
       
        // Update logical clock
        if(this._logical) {
            this._logicalClock.updateClock(event.ts);
        }
    }

    /**
     * Order the events and delivers them to the application if possible
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
                this._process.emit('u-deliver', event);
            } else if(this.isDeliverable(event)) {
                deliverableEvents.push(event);
            } else if(event.ts < minTsOfNonDeliverable) {
                minTsOfNonDeliverable = event.ts;
            }
        });

        // For each event initially deliverable
        deliverableEvents.forEach((event: Event) => {
            // If its timestamp is later than the timestamp of the oldest non-deliverable event
            // then neither this one is deliverable, if its previous, then it is deliverable.
            if(event.ts <= minTsOfNonDeliverable) {
                realDeliverableEvents.push(event);
                delete this._recieved[event.id];
            }
        });

        // For all events finally deliverable,
        // we order them by time and origin process id/client
        // and we deliver it to the application.
        realDeliverableEvents.sort(function(e1: Event, e2: Event): number {
            return (e1.ts - e2.ts) || (e1.sourceId == e2.sourceId ? 0: (e1.sourceId < e2.sourceId ? -1: 1));
        }).forEach((event: Event) => {
            this._lastDeliveredProcessEvents[event.sourceId] = event;
            this._lastDeliveredTs = event.ts;
            this._process.emit('to-deliver', event);
        });
    }

    /**
     * Returns wether the event is deliverable or not.
     * In other words, if the event has jumped enough number
     * of times to have been received by the rest of correct
     * processes.
     * @param event evento a comprobar
     */
    private isDeliverable(event: Event): boolean {
        return event.nor >= this._n - this._f;
    }
    
}
