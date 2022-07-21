const app = require('./index');
const supertest = require('supertest');
const request = supertest(app);
const expect = require("chai").expect;
  
  describe("POST /user/create", function() {
    
    it("it should have status code 200 if the user is successfully created", function(done) {
      request
      
     .post('/user/create')
     .send({"email": user.email, password: "123456"})
  
      .expect(200)
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});

describe("POST /login", function() {
  it("it should have status code 200 if the user successfully logs in", function(done) {
    request
   .post('/login')
   .send({"email": user.email, password: "123456"})
      .expect(200)
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});