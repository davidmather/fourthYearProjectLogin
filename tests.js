// Import the dependencies for testing
var request = require('supertest');
const crypto = require('crypto');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
describe('login tests', function () {
    var server;
    var spdyServer;
    var accountsService;
    beforeEach(function () {
        let login = require('./index');
        server = login.app;
        spdyServer = login.spdyServer;
        accountsService = require('../accountsService/index');

    });
    afterEach(function () {
        spdyServer.close();
        //accountsService.forceShutdown();
    });
    it('responds to /login', function testSlash(done) {
        this.timeout(10000);
        request(server)
            .post('/login').send({
                username: "davidmather@live.ie",
                password: "Qazwsx09@"
            })
            .expect(200, done);
    });
    it('responds to /register', function testSlash(done) {
        this.timeout(10000);
        request(server)
            .post('/register').send({
            username: "example",
            password: "qwerty",
            email: "email@example.com"
        }).expect(200, done);
    });
    it('responds to /logout without cookies', function testSlash(done) {
        this.timeout(10000);
        request(server).post('/logout').send({}).expect(200, done);
    });
    it('responds to /logout with cookies', function testSlash(done) {
        this.timeout(10000);
        request(server).post('/logout').set('Cookie', ['cid=35', 'user='+crypto.createHash('md5').update("Qazwsx09@", 'utf8').digest('hex')]).send({}).expect(200, done);
    });
    it('responds to /getActiveUsers with cookies', function testSlash(done) {
        this.timeout(10000);
        request(server).post('/getActiveUsers').set('Cookie', ['cid=35', 'user='+crypto.createHash('md5').update("Qazwsx09@", 'utf8').digest('hex')]).send({}).expect(200, done);
    });
    it('404 everything else', function testPath(done) {
        this.timeout(10000);
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });
});
