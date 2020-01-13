import Client from './app/client';
import Message from './app/message';
import Event from './internal/event';

/**
 * Programa de testeo
 */

var client1 = new Client('client1', '127.0.0.1', 5551);
var client2 = new Client('client2', '127.0.0.1', 5552);

async function startClients(): Promise<void> {

    await client1.init();
    await client2.init();
}

startClients()
.then(() => {
    client1.on('message', (event: Event) => {
        console.log(event.sourceId + "(" + event.id +  ") > " + event.msg.data);
    });

    client2.on('message', (event: Event) => {
        console.log(event.sourceId + "(" + event.id +  ") > " + event.msg.data);
    });

    client1.connect('127.0.0.1', 5552);
    client2.connect('127.0.0.1', 5551);

    client1.epToBroadcast(new Message("Hola que tal soy el cliente 1"));
    client2.epToBroadcast(new Message("Hola que tal soy el cliente 2"));
    client1.epToBroadcast(new Message("Hola que tal soy el cliente 1 otra vez"));
})
.catch((error: any) => {
    console.log("Error al iniciar los clientes:");
    console.log(error);
    process.exit();
});

function closeClients(): void {
    client1.close()
    client2.close()
    process.exit();
}

// Escucha la señal CTRL + C y cierra el programa correctamente
process.on('SIGINT', closeClients);