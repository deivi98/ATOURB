# aTO-URB: Approximated Total Order Uniform Reliable Broadcast

    Implementación simple del algoritmo en NodeJS.

## Project Structure
```
.
├── LICENSE                                 
├── README.md                               
├── docs                                    // Useful documentation
├── package-lock.json                       // NPM Project dependencies
├── package.json                            // NPM Project properties
└── src                                     // Code
    ├── app                                     // Application layer example code
    │   ├── client.ts                               // Client simulation
    │   └── message.ts                              // Application message
    ├── index.ts                            // Test main program
    └── internal                            // Algorithm code
        ├── connection.ts                         
        ├── clock.ts
        ├── event.ts
        ├── process.ts
        └── atourb.ts
```

## Previous requirements

1. Have npm y node installed
2. Have ts-node installed
3. Have typescript installed

## Steps to deploy

1. Run `npm i`
2. Run `ts-node src/app/client.ts <id> <ip> <port>` to start a client manually
3. Run `npm start` to use the test program

## Authors

* **David González** - [deivi98](https://github.com/deivi98)
