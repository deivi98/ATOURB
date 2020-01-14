import Client from './app/client';
import Message from './app/message';
import Event from './internal/event';
import * as fs from 'fs';

/**
 * Programa de testeo de EpTO con numero de nodos indefinido
 */

const n: number = 2;
var clients: Client[] = [];
var messageInterval: NodeJS.Timeout;
var nextMessage: number = 0;

if(!fs.existsSync("test/")) {
    fs.mkdirSync("test/");
}

async function startClients(): Promise<void[]> {

    var clientPromises: Promise<void>[] = [];

    for(var i = 0; i < n; i++) {
        var client: Client = new Client('client' + (i+1), '127.0.0.1', 5000 + i + 1);
        clientPromises.push(client.init());
        console.log("Preparado cliente " + client.id);
        clients.push(client);
    }

    return Promise.all(clientPromises);
}

function randomMessage() {

    var clientPos: number = Math.floor(Math.random() * n);
    var randomClient: Client = clients[clientPos];
    
    randomClient.epToBroadcast(new Message("Mensaje automatico " + (++nextMessage)));
}

function listenMessages(client: Client) {

    if(fs.existsSync("test/" + client.id + ".log")) {
        fs.unlink('test/' + client.id + '.log', (err) => {
            if (err) throw err;
        });
    }
    
    var nextOutputMessage: number = 0;

    client.on('message', (event: Event) => {
        // console.log("CLIENT " + client.id + " | " + event.sourceId + "(" + event.id +  ") > " + event.msg.data);
        const msg: string = "(" + (++nextOutputMessage) +  ") " + event.sourceId + "(" + event.id +  ") > " + event.msg.data + '\n';
        fs.appendFileSync('test/' + client.id + '.log', msg, 'utf8');
    });
}

startClients()
.then(() => {

    for(var i = 0; i < n; i++) {

        listenMessages(clients[i]);

        for(var e = 0; e < n; e++) {
            if(i != e) {
                clients[i].connect('127.0.0.1', 5000 + e + 1);
            }
        }
    }

    messageInterval = setInterval(randomMessage, 200);
})
.catch((error: any) => {
    console.log("Error al iniciar los clientes:");
    console.log(error);
    process.exit();
});

function closeClients(): void {
    for(var i: 0; i < n; i++) {
        clients[i].close();
    }
    clearInterval(messageInterval);
    console.log("Cerrando conexiones y clientes...");
    setTimeout(function() {
        process.exit();
    }, 2000);
}

// Escucha la señal CTRL + C y cierra el programa correctamente
process.on('SIGINT', closeClients);