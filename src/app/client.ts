import Process from '../internal/process';
import Message from './message';
import Event from '../internal/event';
import { EventEmitter } from 'events';

/**
 * Clase Client
 * Simula el cliente de una aplicación
 */
export default class Client extends EventEmitter {

    private _id: string;            // ID único del cliente
    private _process: Process;      // Proceso responsable del cliente

    /**
     * Constructor
     * @param id id del cliente
     * @param ip ip del cliente
     * @param port puerto de escucha
     */
    constructor(id: string, ip: string, port: number, n: number, f: number) {
        super();
        this._id = id;
        this._process = new Process(id, ip, port, n, f);
    }
    
    /**
     * Devuelve el id del cliente
     */
    get id(): string {
        return this._id;
    }

    /**
     * Devuelve la ip del cliente
     */
    get ip(): string {
        return this._process.ip;
    }

    /**
     * Devuelve el puerto del cliente
     */
    get port(): number {
        return this._process.port;
    }

    /**
     * Inicia el cliente, e inicia la escucha de eventos
     */
    public async init(): Promise<void> {

        // Cuando el proceso recibe un evento, el cliente lo retransmite a la aplicación
        this._process.on('message', (event: Event) => {
            this.emit('message', event);
        });

        // Cuando el proceso recibe un evento en desorden, el cliente lo retransmite a la aplicación
        this._process.on('message-disorder', (event: Event) => {
            this.emit('message-disorder', event);
        });

        return await this._process.init();
    }

    /**
     * Conecta el cliente con otro cliente
     * @param ip ip de otro cliente
     * @param port puerto de otro cliente
     */
    public connect(id: string, ip: string, port: number): void {
        this._process.connect(id, ip, port);

        console.log("Cliente " + this._id + " conectado a " + id + " (" + ip + ":" + port + ")");
    }

    /**
     * Cierra el cliente y sus conexiones correctamente
     */
    public close(): void {
        this._process.close();
    }

    /**
     * Envia un mensaje siguiendo el protocolo EpTo
     * @param msg Mensaje a enviar
     */
    public urbtoBroadcast(msg: Message): void {
        this._process.urbtoBroadcast(msg);
    }
}

/**
 * Programa principal genérico para la ejecución
 * de un cliente individual de forma local
 */
if(typeof module !== 'undefined' && !module.parent) {

    // Se asegura de recibir todos los parametros
    if(process.argv.length != 6) {
        console.log("Use: ts-node client.ts <id> <ip> <port> <total of nodes>");
        process.exit();
    }

    // Obtiene los parametros
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

    // Creamos e iniciamos el cliente
    const client = new Client(id, ip, port, n, f);

    client.init()
    .then(() => {

        console.log("N = " + n + ", F = " + f);
        console.log("Introduzca connect:<id>:<ip>:<port> para conectarse a otro cliente.");
        console.log("Para enviar un mensaje escriba libremente");
        console.log("---------------------------------------------------------------");

        // Una vez iniciado, escuchamos e imprimimos eventos recibidos en cuanto lleguen
        client.on('message', (event: Event) => {
            console.log(event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        });

        // Escuchamos la entrada para conectarnos a más clientes o enviar mensajes
        const stdin = process.openStdin();
        stdin.addListener("data", function(d) {
            const cmd: string = d.toString().trim();

            const args = cmd.split(":");
            
            if(args.length == 4 && args[0] == "connect") {
                client.connect(args[1], args[2], parseInt(args[3]));
            } else {
                client.urbtoBroadcast(new Message(cmd));
            }
        });

    })
    .catch((error: any) => {
        console.log("Error al iniciar cliente " + id);
        console.log(error);
        process.exit();
    });
    
    // Escucha la señal CTRL + C y cierra el programa correctamente
    process.on('SIGINT', function() {
        client.close();
        process.exit();
    });
}
