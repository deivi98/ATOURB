import Client from './app/client';
import Message from './app/message';
import Event from './internal/event';
import * as fs from 'fs';
import * as readlineSync from 'readline-sync';
import * as rimraf from 'rimraf';
import * as sprintfjs from 'sprintf-js';

/**
 * Programa de testeo de EpTO con numero de nodos indefinido
 */

const delayMessageMillis: number = 300;      // Tiempo en milisegundos entre envio de mensajes aleatorios
var localClients: Client[] = [];            // Array de clientes
var messageInterval: NodeJS.Timeout;        // Interval de NodeJS para el envio de mensajes continuado
var nextMessage: number = 0;                // Siguiente id autoincremental de mensaje
var manual: boolean = false;

if(!fs.existsSync("network.json")) {
    console.log("La configuracion de red (network.json) no existe!");
    process.exit(-1);
}

// Leemos configuracion
const networkConfig = JSON.parse(fs.readFileSync('network.json', 'utf8'));

function countTotalClients(networkConfig): number {
    let count: number = 0;

    Object.values(networkConfig).forEach((nodeConfig) => {
        count += parseInt(nodeConfig["clients"]);
    });

    return count;
}

const N: number = countTotalClients(networkConfig);
const F: number = N / 2 - 1;

// Eliminamos la carpeta test si existe y la volvemos a crear
if(fs.existsSync("test/")) {
    rimraf.sync("test/");
}
fs.mkdirSync("test/");

/**
 * Funcion que crea e inicializa los clientes locales
 */
async function startLocalClients(): Promise<void[]> {

    var clientPromises: Promise<void>[] = [];

    const localNetwork = networkConfig["127.0.0.1"];

    if(!localNetwork) {
        console.log("Configuracion de red invalida. Ningun cliente local se ha configurado");
        process.exit(-1);
    }

    const initialPort: number = localNetwork["initialPort"];
    const n: number = localNetwork["clients"];
    const nodeName: string = localNetwork["nodeName"];

    for(var i = 1; i <= n; i++) {
        var client: Client = new Client('n-' + nodeName + '-client' + i, '0.0.0.0', initialPort + i, N, F);
        clientPromises.push(client.init());
        console.log("Preparado cliente " + client.id);
        localClients.push(client);
    }

    return Promise.all(clientPromises);
}

/**
 * Funcion que selecciona un cliente aleatorio
 * del array y envia un mensaje
 */
function randomMessage() {

    var clientPos: number = Math.floor(Math.random() * localClients.length);
    var randomClient: Client = localClients[clientPos];
    
    randomClient.urbtoBroadcast(new Message("Mensaje automatico " + (++nextMessage)));
}

/**
 * Funcion de escucha y logueo de los mensajes
 * recibidos por un cliente
 * @param client cliente
 */
function listenMessages(client: Client) {

    // Borramos el archivo log si existe un antiguo
    if(fs.existsSync("test/" + client.id + ".log")) {
        fs.unlinkSync('test/' + client.id + '.log');
    }
    
    // fs.closeSync(fs.openSync("test/" + client.id + ".log", 'w'));
    
    var nextOutputMessage: number = 0;

    // Cliente escucha un mensaje y lo loguea sincronamente en el log (Para evitar desorden al loguear)
    client.on('message', (event: Event) => {

        if(manual) {
            console.log("CLIENT " + client.id + " | " + event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        } else {
            const id: string = event.id.split("_")[1];
            const msg: string = sprintfjs.sprintf("%9d | %20s (%5s) [%20d] > " + event.msg.data + '\n', ++nextOutputMessage, event.sourceId, id, event.ts);
            fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
        }
    });
    
    // Cliente escucha un mensaje en desorden y lo loguea sincronamente en el log (Para evitar desorden al loguear)
    client.on('message-disorder', (event: Event) => {

        if(manual) {
            console.log("[DISORDER] CLIENT " + client.id + " | " + event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        } else {
            const id: string = event.id.split("_")[1];
            const msg: string = sprintfjs.sprintf("[DISORDER] %9d | %20s (%5s) [%20d] > " + event.msg.data + '\n', ++nextOutputMessage, event.sourceId, id, event.ts);
            fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
        }
    });
}

/**
 * Espera a que inicien los clientes
 * para iniciar su escucha y conectarlos
 * cada uno al resto de clientes
 */
startLocalClients()
.then(() => {

    // Conectamos cada cliente local con el resto de los locales
    localClients.forEach((a: Client) => {
        listenMessages(a);

        localClients.forEach((b: Client) => {
            if(a.id != b.id) {
                a.connect(b.id, b.ip, b.port);
            }
        });
    });

    // Conectamos cada cliente local con el resto de clientes de todos los nodos remotos 
    Object.keys(networkConfig).forEach(function(key) {
        if(key != "127.0.0.1") {
            const remoteNodeNetwork = networkConfig[key];
            const initalRemotePort: number = remoteNodeNetwork["initialPort"];
            const m: number = remoteNodeNetwork["clients"];
            const nodeName: string = remoteNodeNetwork["nodeName"];

            localClients.forEach((client: Client) => {
                for(var e = 1; e <= m; e++) {
                    client.connect('n-' + nodeName + '-client' + e, key, initalRemotePort + e);
                } 
            });
        }
    });

    console.log("----------------------------------------------------------------");
    console.log("Todos los clientes han sido iniciados y conectados correctamente");
    
    if(readlineSync.keyInYN('Quieres enviar mensaje manualmente? (Si no, estos se enviaran aleatoriamente cada ' + delayMessageMillis + 'ms)')) {
        console.log("----------------------------------------------------------------");
        console.log("Para enviar mensajes escribe <id_cliente>:<mensaje> y pulsa intro");

        manual = true;
        listenKeyboardMessages();
    } else {
        console.log("Envio aleatorio continuo de mensajes aleatorios iniciado");
        // Inicia el envio continuo de mensajes aleatorios
        messageInterval = setInterval(randomMessage, delayMessageMillis);
    }

})
.catch((error: any) => {
    console.log("Error al iniciar los clientes:");
    console.log(error);
    process.exit();
});

function listenKeyboardMessages(): void {

    // Escuchamos la entrada para enviar mensajes
    const stdin = process.openStdin();
    stdin.addListener("data", function(d) {
        const cmd: string = d.toString().trim();

        const args = cmd.split(":");
        
        if(args.length > 1) {

            const localClient: Client = localClients[parseInt(args[0]) - 1];

            if(!localClient) {
                console.log("No existe el cliente local " + args[0] + "!");
                return;
            }

            localClient.urbtoBroadcast(new Message(args[1]));
        } else {
            console.log("ERROR: Formato invalido. Para enviar mensajes escribe <id_cliente>:<mensaje> y pulsa intro");
        }
    });
}

/**
 * Cierra los clientes y sus conexiones correctamente
 * antes de terminar el programa
 */
function closeClients(): void {
    for(var i: 0; i < localClients.length; i++) {
        localClients[i].close();
    }
    clearInterval(messageInterval);
    console.log("Cerrando conexiones y clientes...");
    setTimeout(function() {
        process.exit();
    }, 2000);
}

// Escucha la señal CTRL + C y cierra el programa correctamente
process.on('SIGINT', closeClients);