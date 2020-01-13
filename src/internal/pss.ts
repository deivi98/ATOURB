import { Dealer } from 'zeromq';

/**
 * Clase PSS (Peer Sample Service)
 * A partir de un conjunto de conexiones correctas
 * devuelve una muestra aleatoria sin repetición
 * de K conexiones a procesos correctos
 */
export default class PSS {

    /**
     * Permuta aleatoriamente el conjunto o lista de conexiones
     * @param peers conjunto de conexiones
     */
    private static shuffle(peers: Dealer[]): Dealer[] {
        var ctr = peers.length;
        var temp: Dealer;
        var index: number;
    
        while(ctr > 0) {
            index = Math.floor(Math.random() * ctr);
            ctr--;

            temp = peers[ctr];
            peers[ctr] = peers[index];
            peers[index] = temp;
        }

        return peers;
    }

    /**
     * Devuelve una muestra aleatoria de K conexiones a procesos correctos
     * @param peers conjunto de conexiones
     * @param K tamaño de la muestra
     */
    public static sample(peers: Dealer[], K: number): Dealer[] {

        // Si no hay conexiones suficientes para la muestra, se devuelven todos
        if(peers.length < K) {
            return peers;
        }

        peers = PSS.shuffle(peers);
        return peers.slice(0, K-1);
    }
}
