const http = require('http');

const server = http.createServer((req, res)=> {

    res.writeHead(200, {
        "set-cookie" : [
        "test=abc123",
         "nojs=true;HttpOnly",
        "mysite=only;SameSite=Strict",
         "everything=now;HttpOnly;Secure;SameSite=Strict",
         "duration=400days;Max-Age=34560000",
         "year=2026;Expires=thu, 31 Dec 2026 23:59:59 GMT"
        ]
    });

    res.end('hola mundo');
});

server.listen(3000, () => {
    console.log('Listening on http://127.0.0.1:3000');
});


//npm init -y
//npm i express
//npm i -D nodemon


