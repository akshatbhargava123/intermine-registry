/**
 * Router for the InterMine Registry Front End endpoints.
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var passport = require('passport');

/**
 * Endpoint:  /login
 * Method:    GET
 * Description: Render the login view if the user is not logged in. Otherwise
 * redirect to home page.
 */
router.get('/login', function(req, res, next){
  if (typeof req.user === "undefined"){
    res.render('login', {user: req.user});
  } else {
    res.redirect('/');
  }
});

/**
 * Endpoint:  /login
 * Method:    POST
 * Description: Authenticate user with passport. If failure, reload. If success,
 * redirect to home page.
 */
router.post('/login', passport.authenticate(
	'local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

/**
 * Endpoint:  /logout
 * Method:    GET
 * Description: Logout user. Redirect to home page.
 */
router.get('/logout', function(req, res, next){
    req.logout();
    res.redirect('/');
});

/**
 * Endpoint:  /
 * Method:    GET
 * Description: Render home page, sending user as parameter.
 */
router.get('/', function(req, res, next) {
    if (typeof (req.query.success)){
      var operation = req.query.success;
      if (operation == 1){
        return res.render('index', { user: req.user, message: "Instance Added Successfully" });
      } else if (operation == 2) {
        return res.render('index', { user: req.user, message: "Instance Updated Successfuly" });
      }
    }
    return res.render('index', { user: req.user });
});

/**
 * Endpoint:  /instance
 * Method:    GET
 * Description: Render add instance page if user is logged in. Otherwhise,
 * redirect to unauthorized.
 */
router.get('/instance', function(req, res, next) {
    console.log(req.user);
    if (typeof req.user === "undefined"){
      res.render('403');
    } else {
      res.render('addInstance', {user: req.user});
    }
});

/**
 * Called from POST /instance. Does the Update instance procedure. Recieve
 * the same params that the POST /instance endpoint.
 */
function updateInstance(req, res, next){
  var organisms = [];
  var neighbours = [];

  // Get fields from form
  if (req.body.newOrganisms !== "") {
    organisms = req.body.newOrganisms.split(",") ;
  }

  if (req.body.newNeighbours !== "") {
    neighbours = req.body.newNeighbours.split(",");
  }

  var isProduction = true;
  if (req.body.newIsDev === 1){
    var isProduction = false;
  }

  // Do a request to the API PUT endpoint, passing body and authentication
  var reqUrl = req.protocol + '://' + req.get('host') + "/service/instances/" + req.body.updateId;
  request.put({
    body: {
      "name": req.body.newName,
      "url": req.body.newUrl,
      "description": req.body.newDesc,
      "twitter": req.body.newTwitter,
      "location": {
        "latitude": req.body.newLatitude,
        "longitude": req.body.newLongitude
      },
      "organisms": organisms,
      "neighbours": neighbours,
      "isProduction": isProduction
    },
    auth: {
      "user": req.user.user,
      "pass": req.user.password
    },
    url: reqUrl,
    json: true
  }, function (err, httpResponse, body){

    if (typeof body === "string"){
      body = JSON.parse(body);
    }

    // If not sucessfull, render add Instance view with form filled and error message
    if (body.statusCode != 201){
      res.render('addInstance', {
          name: req.body.newName,
          url: req.body.newUrl,
          desc: req.body.newDesc,
          twitter: req.body.newTwitter,
          lat: req.body.newLatitude,
          lon: req.body.newLongitude,
          organisms: req.body.newOrganisms,
          neighbours: req.body.newNeighbours,
          message: body.friendlyMessage
      });
    } else {
      res.redirect('/?success=2');
    }
  });

}

/**
 * Endpoint:  /instance
 * Method:    POST
 * Description: Add or update and instance to the registry from front end.
 */
router.post('/instance', function(req, res, next) {

    // If method is PUT (update instance), call update function
    if (req.body._method === "put"){
      updateInstance(req, res, next);
      return;
    }

    // Get fields from form
    if (req.body.newOrganisms !== "") {
      var organisms = req.body.newOrganisms.split(",") ;
    }

    if (req.body.newNeighbours !== "") {
      var neighbours = req.body.newNeighbours.split(",");
    }

    var isProduction = true;
    if (req.body.newIsDev === 1){
      var isProduction = false;
    }

    // Do a request to the API POST endpoint, passing body and authentication
    var reqUrl = req.protocol + '://' + req.get('host') + "/service/instances";
    request.post({
      body: {
        "name": req.body.newName,
        "url": req.body.newUrl,
        "description": req.body.newDesc,
        "twitter": req.body.newTwitter,
        "location": {
          "latitude": req.body.newLatitude,
          "longitude": req.body.newLongitude
        },
        "organisms": organisms,
        "neighbours": neighbours,
        "isProduction": isProduction
      },
      auth: {
        "user": req.user.user,
        "pass": req.user.password
      },
      url: reqUrl,
      json: true
    }, function (err, httpResponse, body){

      if (typeof body === "string"){
        body = JSON.parse(body);
      }

      // If not sucessfull, render add Instance view with form filled and error message
      if (body.statusCode != 201){
        res.render('addInstance', {
            name: req.body.newName,
            url: req.body.newUrl,
            desc: req.body.newDesc,
            twitter: req.body.newTwitter,
            lat: req.body.newLatitude,
            lon: req.body.newLongitude,
            organisms: req.body.newOrganisms,
            neighbours: req.body.newNeighbours,
            message: body.friendlyMessage
        });
      } else {
        res.redirect('/?success=1');
      }
    });
});

module.exports = router;
