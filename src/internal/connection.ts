import { Dealer } from "zeromq";

/**
 * Clase Connection
 * Almacena informacion sobre la conexion
 * a otros clientes
 */
export default class Connection {

    private _id: string;          // ID del proceso o cliente de la conexion
    private _dealer: Dealer;      // Dealer de la conexion

    /**
     * Constructor de la conexion
     * @param id id del cliente
     * @param dealer dealer del cliente
     */
    constructor(id: string, dealer: Dealer) {
        this._id = id;
        this._dealer = dealer;
    }

    /**
     * Devuelve el id del cliente de la conexion
     */
    get id(): string {
        return this._id;
    }

    /**
     * Devuelve el dealer de la conexion
     */
    get dealer(): Dealer {
        return this._dealer;
    }

}
