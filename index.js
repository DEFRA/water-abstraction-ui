require('dotenv').config()

const serverOptions = {
  connections: {
    router: {
      stripTrailingSlash: true
    }
  }
}
const Hapi = require('hapi')
const server = new Hapi.Server(serverOptions)
const Disinfect = require('disinfect');
const SanitizePayload = require('hapi-sanitize-payload')


server.connection({
  port: process.env.PORT
})

server.state('sessionCookie', {
  ttl: 24 * 60 * 60 * 1000, // One day
  isSecure: false,
  isHttpOnly: false,
  isSameSite: 'Lax',
  encoding: 'base64json'
});




server.register([
  {
      register: require('node-hapi-airbrake'),
      options: {
        key: process.env.errbit_key,
        host: process.env.errbit_server
      }
  },


  {
  // Session plugin
  register: require('hapi-server-session'),
  options: {
    cookie: {
      isSecure: false,
      isSameSite: false
    }
  }
}, {
  // Plugin to display the routes table to console at startup
  // See https://www.npmjs.com/package/blipp
  register: require('blipp'),
  options: {
    showAuth: true
  }
}, {
  register: require('hapi-auth-cookie')
}, {
  // Plugin to prevent CSS attack by applying Google's Caja HTML Sanitizer on route query, payload, and params
  // See https://www.npmjs.com/package/disinfect
  register: Disinfect,
  options: {
    deleteEmpty: true,
    deleteWhitespace: true,
    disinfectQuery: true,
    disinfectParams: true,
    disinfectPayload: true
  }
}, {
  // Plugin to recursively sanitize or prune values in a request.payload object
  // See https://www.npmjs.com/package/hapi-sanitize-payload
  register: SanitizePayload,
  options: {
    pruneMethod: 'delete'
  }
}, require('inert'), require('vision')], (err) => {



  server.auth.strategy('standard', 'cookie', {
    password: 'somecrazycookiesecretthatcantbeguesseswouldgohere', // cookie secret
    isSecure: false, // required for non-https applications
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: '/signin',
    isHttpOnly: false
  });

  server.auth.default({
    strategy: 'standard',
    mode: 'try'
  });

  // load views
  server.views(require('./src/views'))
  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/VmL'))


})

server.errorHandler = function(error) {
  throw error
}


server.ext({
  type: 'onPreHandler',
  method: function(request, reply) {


    if(request.payload){
      console.log(request.payload)
    }



    var moment = require('moment')
    var status = null;
    var fs = require('fs');
    fs.stat("./server-status", function(err, stats) {
      //get timestamp of server status file and calc difference from now in seconds...
      var difference
      try{
      var mtime = stats.mtime;
      difference = parseInt(moment().diff(mtime) / 1000);
//      console.log(`Service status last checked ${difference} seconds ago`)
    } catch(e){
      difference=9999
    }

//    console.log('time difference since last check '+difference)



    fs.readFile('./server-status', function read(err, data) {
      if (err) {
//        console.log('local file not found')
        fs.writeFile("./server-status", '1', function(err) {
          if (err) {
            return console.log(err);
          }

        });
        processServerStatus(status)

      } else {
        status = data;
//        console.log('local server status read as ' + status)
        processServerStatus(status)
      }
    });

      if (difference > 60) {
        //refresh the file every minute
        var AWS = require('aws-sdk');
        var config = new AWS.Config({
          accessKeyId: process.env.s3_key,
          secretAccessKey: process.env.s3_secret
        });

        var s3 = new AWS.S3(config);
        var params = {
          Bucket: process.env.s3_bucket,
          Key: process.env.environment+'-status'
        };
        s3.getObject(params, function(err, data) {
          if (err) {
//            console.log(`s3 file not found at ${process.env.environment}-status . assume online`)

          } else {
            status = data.Body.toString()
//            console.log(`s3 file found at ${process.env.environment}-status with value of ${status}`)
            fs.writeFile("./server-status", status, function(err) {
              if (err) {
                return console.log(err);
              }

            });
          }
        });
      }
})

    function processServerStatus(status) {
//      console.log('processServerStatus=' + status)
      if (status == 0) {
        var offline = true;
      } else {
        var offline = false;
      }
//      console.log('offline = ' + offline)





      if (offline && request.path.indexOf('public') == -1) {
        var viewContext = {}
        viewContext.session = request.session
        viewContext.pageTitle = 'Water Abstraction'
        viewContext.insideHeader = ''
        viewContext.headerClass = 'with-proposition'
        viewContext.topOfPage = null
        viewContext.head = null
        viewContext.bodyStart = null
        viewContext.afterHeader = null
        viewContext.path = request.path
        return reply.view('water/offline', viewContext)
      }
      return reply.continue();
    }





  }
});
// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log(`Service ${process.env.servicename} running at: ${server.info.uri}`)
})
module.exports = server
