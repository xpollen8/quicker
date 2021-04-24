# myWrap

A very simple pooled mysql wrapper w/over-ridable defaults

# Install

```
npm i --save https://github.com/xpollen8/mywrap
```

# Usage

```
const myWrap = require('mywrap');

const db = new myWrap({
    insecureAuth: true|false,        // default: true
    waitForConnections: true|false,  // default: true
    connectionLimit: 10,             // default: 10
    queueLimit: 0                    // default: 0 (unlimited)
    host: '...',                     // default: 'localhost'
    user: '...',                     // default: 'root'
    password: '...',                 // default: ''
    database: '...',                 // default: ''
});

await db.start();
const [ rows, columns ] = await db.query("select ....");
await db.finish();
```
