const port = 16001;
const spdy = require('spdy');
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const uuid = require('uuid');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const PROTO_PATH = path.join(__dirname, 'protos/accounts.proto');
var protoLoader = require('@grpc/proto-loader');
var grpc = require('grpc');
//Load the protobuf
var proto = grpc.loadPackageDefinition(
    protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })
);
// Load in our service definition
const REMOTE_SERVER = process.env.GRPC_SERVER || "localhost:5001";

//Create gRPC client
let client = new proto.example.Account(
    REMOTE_SERVER,
    grpc.credentials.createInsecure()
);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies.
app.use('/public',express.static(path.join(__dirname, 'public')));

var allowedOrigins = [
    'https://localhost:8443',
	'https://40.74.19.17:8443'
];

app.use(function(req, res, next) {
    let origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});



app.post('/register', function(req, res) {
    let username=req.body.username;
    let password=req.body.password;
    let email=req.body.email;
    console.log(req);
    password = crypto.createHash('md5').update(password, 'utf8').digest('hex');
    const params = {
        username: username,
        password: password,
        email: email
    };
    client.register(params, function(error, response) {
        if (error) console.log(error);
        console.log(response);
        console.log("cid"+JSON.parse(response.result).cid);
        console.log("cid2"+response.result[0].cid);
        res.clearCookie('sessionCookie');
        res.cookie("user", password, {
                 maxAge: 3600000
             });
        res.cookie("cid", JSON.parse(response.result).cid, {
            maxAge: 3600000
        }).send(response.result);
        console.log('The Result Is: ' + response.result);
    });
});

app.post('/login', function(req, res) {
	var username=req.body.username;
    var password=req.body.password;
    password = crypto.createHash('md5').update(password, 'utf8').digest('hex');
	console.log(req);

    const params = {
        username: username,
        password: password
    };
    client.login(params, function(error, response) {
        if (error){
            console.log(error);
            res.send(JSON.stringify({success:false}));
        }
        else {
            console.log(response);
            console.log('The Result Is: ' + response.result);

            res.clearCookie('sessionCookie');
            res.cookie("user", password, {
                maxAge: 3600000
            });
            let loginResult = JSON.parse(response.result);
            res.cookie("cid", loginResult.cid, {
                maxAge: 3600000
            });
            res.cookie("admin", loginResult.admin.data[0], {
                maxAge: 3600000
            }).send(response.result);
        }

    });
});

app.post('/logout', function(req, res) {
    if(req.cookies.cid !== undefined || req.cookies.user !== undefined){
        customerId = req.cookies.cid;
        console.log(req);

        const params = {
            cid: customerId,
            password: req.cookies.user
        };
        client.logout(params, function(error, response) {
            if (error){
                console.log(error);
                res.send(JSON.parse({success:false}));
            }
            console.log(response);
            console.log("deleting cookies");
            res.clearCookie('user');
            res.clearCookie('cid');
            res.clearCookie('admin');
            res.cookie('sessionCookie',uuid.v1(), { maxAge: 900000, httpOnly: true });
            console.log('The Result Is: ' + response.result); // 'The Result Is: 5'
            res.send(response.result);
        });
    } else {
        console.log("Already logged out!");
        res.send("Already logged out!")
    }

});

app.post('/getActiveUsers', function(req, res) {
    if(req.cookies.cid !== undefined && req.cookies.user !== undefined){
        customerId = req.cookies.cid;
        const params = {
            cid: customerId,
            password: req.cookies.user
        };
        console.log("params");
        console.log(params);
        client.getActiveUsers(params, function(error, response) {
            if (error){
                console.log(error);
                res.send(JSON.parse({success:false}));
            }
            console.log(response);

            var result = {
                ActiveUsers: response.result,
                success: true
            };
            console.log(result); // 'The Result Is: 5'
            res.send(result);
        });
    }

});

const options = {
    key: fs.readFileSync(__dirname + '/key.pem'),
    cert:  fs.readFileSync(__dirname + '/cert.pem')
};
console.log(options);

var serverListen = spdy
  .createServer(options, app)
  .listen(port, (error) => {
    if (error) {
      console.error(error);
      return process.exit(1)
    } else {
      console.log('Listening on port: ' + port + '.')
    }
  });

module.exports = {app:app, spdyServer:serverListen};
