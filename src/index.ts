import Client from './app/client';
import Message from './app/message';
import Event from './internal/event';
import * as fs from 'fs';
import * as readline from 'readline';
import * as rimraf from 'rimraf';
import * as sprintfjs from 'sprintf-js';

/**
 * Undefined number of nodes testing program of the algorithm
 */

const delayMessageMillis: number = 200;     // Delay between secuential random message sending
var localClients: Client[] = [];            // Clients array
var messageInterval: NodeJS.Timeout;        // NodeJS interval to repeat random message sending
var nextMessage: number = 0;                // Message generation autoincremental identifier
var manual: boolean = false;                // Wether the message sending is manual or not
var logicalTime: boolean = true;            // Wether the clock being used is logical or not
var avgLatency: number = 0;                 // Average of latency of all messages delivered by all processes in this program node
var totalDeliveredMessages: number = 0;     // Total delivered messages of all clients

if(!fs.existsSync("network.json")) {
    console.log("The network configuration (network.json) does not exist!");
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
var F: number;
if(N % 2 == 0) {
    F = Math.floor((N - 1) / 2);
} else {
    F = Math.floor(N / 2);
}
var rd: readline.Interface;

// Delete test result folder if exists and create it again to store new results
if(fs.existsSync("test/")) {
    rimraf.sync("test/");
}
fs.mkdirSync("test/");

/**
 * Function to create and initialize network clients
 */
async function startLocalClients(): Promise<void[]> {

    var clientPromises: Promise<void>[] = [];

    const localNetwork = networkConfig["127.0.0.1"];

    if(!localNetwork) {
        console.log("Invalid configuration. No client was successfully configured.");
        process.exit(-1);
    }

    const initialPort: number = localNetwork["initialPort"];
    const n: number = localNetwork["clients"];
    const nodeName: string = localNetwork["nodeName"];

    for(var i = 1; i <= n; i++) {
        var client: Client = new Client('n-' + nodeName + '-client' + i, '0.0.0.0', initialPort + i, N, F, logicalTime);
        clientPromises.push(client.init());
        console.log("Client " + client.id + " ready.");
        localClients.push(client);
    }

    return Promise.all(clientPromises);
}

/**
 * Function that selects randomly a client and
 * send a message through it
 */
function randomMessage() {

    var clientPos: number = Math.floor(Math.random() * localClients.length);
    var randomClient: Client = localClients[clientPos];
    
    randomClient.broadcast(new Message("Automated message " + (++nextMessage)));
}
    
/**
 * Listen to client messages and saves them to the logs
 * @param client client
 */
function listenMessages(client: Client) {

    // Deletes old log if exists
    if(fs.existsSync("test/" + client.id + ".log")) {
        fs.unlinkSync('test/' + client.id + '.log');
    }
    
    const msg: string = sprintfjs.sprintf("%15s | %20s (%5s) [%20s]\n", "PRINT ORDER", "SENDER PROCESS", "ID", "TIMESTAMP");
    fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
    // fs.closeSync(fs.openSync("test/" + client.id + ".log", 'w'));

    var nextOutputMessage: number = 0;

    // Client listen to message and logs it sinchronously (to avoid disorder when logging)
    client.on('to-deliver', (event: Event) => {

        if(manual) {
            console.log("CLIENT " + client.id + " | " + event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        } else {
            const id: string = event.id.split("_")[1];
            const latency: number = Date.now() - event.msg.ts;
            avgLatency += latency;
            totalDeliveredMessages++;
            const msg: string = sprintfjs.sprintf("%15d | %20s (%5s) [%20d] > " + event.msg.data + '\n', ++nextOutputMessage, event.sourceId, id, event.ts);
            fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
        }
    });
    
    // Client listen to message in disorder and logs it sinchronously (to avoid disorder when logging)
    client.on('u-deliver', (event: Event) => {

        if(manual) {
            console.log("[DISORDER] CLIENT " + client.id + " | " + event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        } else {
            const id: string = event.id.split("_")[1];
            const latency: number = Date.now() - event.msg.ts;
            avgLatency += latency;
            totalDeliveredMessages++;
            const msg: string = sprintfjs.sprintf("[DISORDER] %15d | %20s (%5s) [%20d] > " + event.msg.data + '\n', ++nextOutputMessage, event.sourceId, id, event.ts);
            fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
        }
    });
}

/**
 * Waits for clients to initiate and start
 * to listen and connect them each one to the
 * rest of the clients
 */
startLocalClients()
.then(() => {

    // Connects each local client to the rest of local clients (that belong to this program)
    localClients.forEach((a: Client) => {
        listenMessages(a);

        localClients.forEach((b: Client) => {
            if(a.id != b.id) {
                a.connect(b.id, b.ip, b.port);
            }
        });
    });

    // Connects each local client to the rest of the remote clients from other remote programs (following the network configuration)
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
    console.log("N = " + N + ", F = " + F);
    console.log("All clients sucessfully initialized and connected.");

    rd = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rd.question('Do you want to send messages manually? (If not, messages will be sent randomly each ' + delayMessageMillis + 'ms) [y/n]: ', response => {
        
        if(response.toLowerCase().startsWith("y")) {

            console.log("----------------------------------------------------------------");
            console.log("To send a message type <client_id>:<message> and press enter");

            manual = true;
        } else {

            console.log("Continuous random message sending initiated");
            // Initiates random message sending
            messageInterval = setInterval(randomMessage, delayMessageMillis);
        }
        listenKeyboardMessages();
    });
    
    // if(readlineSync.keyInYN('Quieres enviar mensaje manualmente? (Si no, estos se enviaran aleatoriamente cada ' + delayMessageMillis + 'ms)')) {
    //     console.log("----------------------------------------------------------------");
    //     console.log("Para enviar mensajes escribe <id_cliente>:<mensaje> y pulsa intro");

    //     manual = true;
    //     listenKeyboardMessages();
    // } else {
    //     console.log("Envio aleatorio continuo de mensajes aleatorios iniciado");
    //     // Inicia el envio continuo de mensajes aleatorios
    //     messageInterval = setInterval(randomMessage, delayMessageMillis);
    // }

})
.catch((error: any) => {
    console.log("Error while initiating client:");
    console.log(error);
    process.exit();
});

function listenKeyboardMessages(): void {
    // Listen keyboard to send messages
    rd.on('line', function(cmd: string) {
        const args = cmd.split(":");
        
        if(args.length > 1 && manual == true) {

            const localClient: Client = localClients[parseInt(args[0]) - 1];

            if(!localClient) {
                console.log("Local client with id " + args[0] + " does not exist!");
                return;
            }

            localClient.broadcast(new Message(args[1]));
        } else {

            if(cmd.toLowerCase() == "exit") {
                closeClients();
                return;
            } else if(cmd.toLowerCase() == "killone") {
                closeRandomClient(); 
                return;
            } else if(cmd.toLowerCase().startsWith("kill")) {
                const args = cmd.split(":");

                if(args.length == 2) {
                    const l: number = parseInt(args[1]);
                    
                    for(var i: number = 0; i < l; i++) {
                        closeRandomClient();
                    }
                }
                return;
            } else if(cmd.toLowerCase() == "pause") {
                clearInterval(messageInterval);
                console.log("Continuous random message sending paused.");
                return;
            } else if(cmd.toLowerCase() == "resume") {
                messageInterval = setInterval(randomMessage, delayMessageMillis);
                console.log("Continuous random message sending resumed.");
                return;
            }
            console.log("ERROR: Invalid format. To send a message type <client_id>:<message> and press enter");
        }
    });
}

var closedClients: number = 0;

/**
 * Closes a random client
 */
function closeRandomClient() {

    if(closedClients >= N) {
        console.log("There are no more clients to kill.");
        return;
    }

    var clientPos: number = Math.floor(Math.random() * localClients.length);
    var randomClient: Client = localClients[clientPos];

    while(randomClient.closed) {
        clientPos = Math.floor(Math.random() * localClients.length);
        randomClient = localClients[clientPos];
    }

    randomClient.close();
    console.log("Client " + (clientPos + 1) + " terminated.");

    closedClients++;
}

/**
 * Closes the clients and their connections safely
 * before terminating the program
 */
function closeClients(): void {
    for(var i: 0; i < localClients.length; i++) {
        if(!localClients[i].closed) {
            localClients[i].close();
        }
    }
    rd.close();
    clearInterval(messageInterval);
    console.log("Closing clients and connections...");
    printResults();
    setTimeout(function() {
        process.exit();
    }, 5000);
}

function printResults(): void {
    console.log("------------ RESULTS ---------------");
    console.log("CLIENTS AVG MESSAGE LATENCY: " + (avgLatency / totalDeliveredMessages));
    console.log("------------------------------------");
}

process.on('SIGINT', closeClients);