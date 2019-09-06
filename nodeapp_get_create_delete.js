
var port = process.env.PORT || 8080;

var http = require('http');
var fs = require('fs');
var path = require('path');

const url = require('url');
var mysql = require('mysql');
 

// Returning the DB connection
function getDBConnection(){
    
// Note: Here you need to type the database connection information!!!
var con = mysql.createConnection({
        host: "yourdbhostname",
        user: "yourdbusername",
        password: "yourdbpassword",
        database: "yourdbname"
    }); 
  return con;
}


 // Get the Mime Content-Type based on the file extention
 function getContentType(fileext){
    
    // Default contentType need to be text/html to display the error404.html if we type wrong URL 
    var contentType = 'text/html';

    switch (fileext) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
         case '.ico':
            contentType = 'image/x-icon';
            break;
     }
      return contentType;
   }

   
// The module validate containing the Validate Class and funtionality for validate user input (validate.js)
 const Validate = require('./validate');

 // Validate the users input ( Person ) and using the module with the Validate Class and functions (validate.js)
 // Returning TRUE if all input are valid !
 function validateInputData(name, email, age){
    
    var allinputvalid = false;
    var vname = false;
    var vemail = false;
    var vage = false;
    
    const validate = new Validate();

    if( name != "" ){
       
        vname = validate.ValidateAllLetters(name);
        if(vname)
           vname = validate.ValidateStringLength(name, 2, 30);
        console.log("Valid Name: " + vname);
       }
     if( email != "" ){
        
         vemail = validate.ValidateEmail(email);
         if(vemail)
            vemail = validate.ValidateStringLength(email, 8, 30);
         console.log("Valid email: " + vemail);
     }
     if( age != "" ){
         
         vage = validate.ValidateAge(age, 18, 125);
         console.log("Valid age: " + vage);
      }

    if( vname == true && vemail == true && vage == true )
       allinputvalid = true;

    return allinputvalid;

 }



// The Server 
http.createServer(function (request, response) {
           
    var filePath = '.' + request.url;

    // Routing - mapping the URL clicked by user to the matching HTML-file
    if (filePath == './')
        filePath = './views/index.html';
    if (filePath == './about')
        filePath = './views/about.html';
    if (filePath == './showpersons')
        filePath = './views/showpersons.html';
    if( filePath == './showformcreateperson' )
        filePath = './views/createperson.html';

    var pathurl = url.parse(request.url).pathname;
    var extname = path.extname(filePath);

    // Try to get the Mime Content-type based from the current file exteention
    var contentType = getContentType(extname);

    // Here goes the routing / what kind of HTTP request the server get from link user click or
    // files includes in the HTML-files
    if( pathurl === "/persons" ){
        
        // Get the DB Connection
        var con = getDBConnection();

        con.connect(function(err) {
        if (err) 
            throw err;
        else
            con.query("SELECT * FROM node_crud ORDER BY id DESC", function (err, result, fields) {
        if (err) 
            throw err;
        else{
              response.writeHead(200, {"Content-Type": "application/json"});
              response.end(JSON.stringify(result));
              }
          });
       });
   
    }
    else if (pathurl.indexOf('/deleteperson/') != -1 ){

        var urlid = pathurl.split("/");
        id = urlid[2];
        
        console.log("Id to be deleted: " + id ); 

        // Get the DB Connection
        var con = getDBConnection();

        con.connect(function(err) {
        if (err) throw err;
        else
            con.query("DELETE FROM node_crud WHERE Id=" + id, function (err, result, fields) {
        if (err) throw err;
        else{
              response.writeHead(200, {"Content-Type": "application/json"});
              response.end(JSON.stringify(result));
              }
          });
       });
    }
    else if( pathurl === "/createperson" ){

       var body = "";

       var inputdatavalid = false;

       request.on('data', function (chunk) {
            body += chunk;
         });
   
       request.on('end', function () {
   
           postBody = JSON.parse(body);
           
           // Check users input data (Person) by this function call using the module in Class Validate / validate.js
           inputdatavalid = validateInputData(postBody.name, postBody.email, postBody.age);

           // If all user data are valid add the Persons
           if( inputdatavalid == true ){
          
              // Get the DB Connection
              var con = getDBConnection();
              
              con.connect(function(err) {
                 if (err) throw err;
                 else
                     con.query("INSERT INTO node_crud (name,email,age) values('" + postBody.name + "','" + postBody.email + "'," + postBody.age + ")", function (err, results, fields) {
                     if(err) throw err;
                  else{
                      response.writeHead(200, {"Content-Type": "application/json"});
                      response.end(JSON.stringify(results));
                      }
                  });
              });
            }
            else{
                 response.writeHead(404, {"Content-Type": "application/json"});
                 response.end();
                }
        });
    } 
    else if( ( filePath.indexOf('.html') != -1 || pathurl.indexOf('/public/') != -1 ) ){

            fs.readFile(filePath, function(error, content) {
        
            if (error) {
                fs.readFile('./views/error404.html', function(error, content) {
                response.writeHead(404, { 'Content-Type': contentType });
                 response.end(content, 'utf-8');
                });
              }
             else {
                   response.writeHead(200, { 'Content-Type': contentType });
                   response.end(content, 'utf-8');
                 }
           });
        }
    else{
         
         fs.readFile(__dirname + '/views/error404.html', function (err, data) {
         if (err){
            response.writeHead(404);
            response.write('file not found');
            }
        else{
             response.writeHead(200, {'Content-Type': 'text/html'});
             response.write(data);
             }
         response.end();
       });
    }


}).listen(port);
console.log('Server running at 8080');
