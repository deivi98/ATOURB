# EpTO: An Epidemic Total Order Algorithm for Large-Scale Distributed Systems
# URB: Uniform Reliable Broadcast

    Implementación simple del algoritmo en NodeJS.

    - Numero de veces que recibes el mensaje actua igual al TTL de EpTO
    - El numero de veces necesario de recepciones de un mismo mensaje para garantizar que todo proceso correcto lo ha recibido es n / 2 + 1
    - Utilizar proceso ordenacion de EpTO pero sin rondas
    - Si se recibe un mensaje 4 veces despues de que ya hayan sido entregado mensajes posteriores a este, NO se descarta, se entrega en desorden y se indica que esta en desorden

## Estructura del proyecto:
```
.
├── LICENSE                                 // Licencia del proyecto
├── README.md                               // Este archivo
├── docs                                    // Documentos de implementación
├── package-lock.json                       // Dependencias del proyecto
├── package.json                            // Propiedades del proyecto
└── src                                     // Código
    ├── app                                     // Código de la aplicación de prueba
    │   ├── client.ts                               // Simulación de cliente de aplicación
    │   └── message.ts                              // Mensaje de la aplicación
    ├── index.ts                            // Programa principal de testeo
    └── internal                            // Código interno de la librería
        ├── ball.ts                         
        ├── clock.ts
        ├── disseminationcomponent.ts
        ├── event.ts
        ├── orderingcomponent.ts
        ├── process.ts
        └── pss.ts
```

## Requerimientos previos

1. Tener npm y node instalado
2. Tener ts-node instalado
3. Tener typescript instalado

## Pasos para desplegar 

1. Ejecutar `npm i`
2. Para ejecutar un cliente `ts-node src/app/client.ts <id> <ip> <port>`
3. Para ejecutar la prueba programada `npm start`

## Autores

* **David González** - [deivi98](https://github.com/deivi98)
