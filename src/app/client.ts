import Process from '../internal/process';
import Message from './message';
import Event from '../internal/event';
import { EventEmitter } from 'events';

/**
 * Client class
 * Simulates an application client
 */
export default class Client extends EventEmitter {

    private _id: string;            // Unique ID of client
    private _process: Process;      // Associated process to this client

    /**
     * Constructor
     * @param id client id
     * @param ip client ip
     * @param port client port
     */
    constructor(id: string, ip: string, port: number, n: number, f: number, logical: boolean) {
        super();
        this._id = id;
        this._process = new Process(id, ip, port, n, f, logical);
    }
    
    /**
     * Returns ID of client
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns IP of client
     */
    get ip(): string {
        return this._process.ip;
    }

    /**
     * Returns port of client
     */
    get port(): number {
        return this._process.port;
    }

    /**
     * Initiates the client, and listen for messages from process
     */
    public async init(): Promise<void> {

        // When the process receives an event, the client sends it to the application layer
        this._process.on('to-deliver', (event: Event) => {
            this.emit('to-deliver', event);
        });

        // When the process receives an event in disorder, the client sends it to the application layer
        this._process.on('u-deliver', (event: Event) => {
            this.emit('u-deliver', event);
        });

        return await this._process.init();
    }

    /**
     * Connects the client to other clients
     * @param ip other client IP
     * @param port other client port
     */
    public connect(id: string, ip: string, port: number): void {
        this._process.connect(id, ip, port);

        console.log("Client " + this._id + " connected to " + id + " (" + ip + ":" + port + ")");
    }

    /**
     * Closes the client and its connections correctly
     */
    public close(): void {
        this._process.close();
    }

    /**
     * Broadcasts a message (sends it to process)
     * @param msg message to send
     */
    public broadcast(msg: Message): void {
        this._process.broadcast(msg);
    }
}

/**
 * Main generic program to execute a client locally
 */
if(typeof module !== 'undefined' && !module.parent) {

    // Check all parameters
    if(process.argv.length != 6) {
        console.log("Use: ts-node client.ts <id> <ip> <port> <total of nodes>");
        process.exit();
    }

    // Obtain parameters
    const id: string = process.argv[2];
    const ip: string = process.argv[3];
    const port: number = parseInt(process.argv[4]);
    const n: number = parseInt(process.argv[5]);
    var f: number;
    if(n % 2 == 0) {
        f = Math.floor((n - 1) / 2);
    } else {
        f = Math.floor(n / 2);
    }

    // Creates and initializes the client
    const client = new Client(id, ip, port, n, f, false);

    client.init()
    .then(() => {

        console.log("N = " + n + ", F = " + f);
        console.log("Type connect:<id>:<ip>:<port> to connect to other client.");
        console.log("To send a message just type normally");
        console.log("---------------------------------------------------------------");

        // Once iniciated, we listen to the messages recieved and we print them
        client.on('to-deliver', (event: Event) => {
            console.log(event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        });

        // We also listen the keyboard to send messages and connect to other clients
        const stdin = process.openStdin();
        stdin.addListener("data", function(d) {
            const cmd: string = d.toString().trim();

            const args = cmd.split(":");
            
            if(args.length == 4 && args[0] == "connect") {
                client.connect(args[1], args[2], parseInt(args[3]));
            } else {
                client.broadcast(new Message(cmd));
            }
        });

    })
    .catch((error: any) => {
        console.log("Error initiating the client " + id);
        console.log(error);
        process.exit();
    });
    
    // Listen the signal CTRL + C and terminates the program correctly
    process.on('SIGINT', function() {
        client.close();
        process.exit();
    });
}
