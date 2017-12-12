require('dotenv').config()


/**
request.cookieAuth.set(user);

**/

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


// logging options
const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        myConsoleReporter: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout']
    }
};


server.register([
  {
    register: require('good'),
    options: goodOptions
  },

  {
  register: require('hapi-error'),
  options : {
    templateName : 'water/error.html',
    statusCodes : {
      401 : {
        redirect : '/login'
      }
    }
  }
},
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
  },
  {
    // Plugin to recursively sanitize or prune values in a request.payload object
    // See https://www.npmjs.com/package/hapi-sanitize-payload
    register: SanitizePayload,
    options: {
      pruneMethod: 'delete'
    }
  },

  require('inert'), require('vision')
], (err) => {

  server.auth.strategy('standard', 'cookie', {
    password: process.env.cookie_secret, // cookie secret
    isSecure: process.env.NODE_ENV == 'production', // use secure cookie in production
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: '/signin',
    isHttpOnly: true,
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

    if (request.path.indexOf('public') != -1) {
      //files in public dir are always online...
      return reply.continue();
    } else {

      console.log('check for cookie!')
      var cookie = request.state.sessionCookie
      if(cookie){
        request.session=cookie
        console.log("cookie found")
      } else {
        console.log("COOKIE NOT FOUND")
      }


      function updateS3StatusFile() {
        //private function to refresh status control file from s3
        //contents of file: 0=offline, 1=online
        //it's a fire and forget function, we don't wait for a response
        var AWS = require('aws-sdk');
        var config = new AWS.Config({
          accessKeyId: process.env.s3_key,
          secretAccessKey: process.env.s3_secret
        });
        var s3 = new AWS.S3(config);
        var params = {
          Bucket: process.env.s3_bucket,
          Key: process.env.environment + '-status'
        };
        s3.getObject(params, function(err, data) {
          if (err) {
            //we don't actually care if there's an error as we always assume online if we don't know...
            //console.log(`s3 file not found at ${process.env.environment}-status`)

            return
          } else {
            //read file contents from s3, and write to local file
            status = data.Body.toString()
            fs.writeFile("./server-status", status, function(err) {
              if (err) {
                console.log(err);
              } else {
                //s3 file updated
              }

            });
          }
        });
      }


      var moment = require('moment')
      var status = null;
      var fs = require('fs');
      var difference

      //check for local file with service status from s3
      fs.stat("./server-status", function(err, stats) {
        //get timestamp of server status file and calc difference from now in seconds...
        console.log('try stat')
        try {
          var mtime = stats.mtime;
          difference = parseInt(moment().diff(mtime) / 1000);
          //Service status last checked ${difference} seconds ago
        } catch (e) {
          //local status file not found
          console.log(e)
          difference = null
        }

        if (!difference) {
          //local file not found. get from S3 and assume we're online
          processServerStatus(1)
          updateS3StatusFile()
        } else if (difference > 60) {
          //local file found AND older than 60 seconds so refresh it...
          updateS3StatusFile()
        }

try{
        fs.readFile('./server-status', function read(err, data) {
          if (err) {
            //local file not found, so write it in with status of 1
            fs.writeFile("./server-status", '1', function(err) {
              if (err) {
                return console.log(err);
              }
            });
            processServerStatus(1)
          } else {
            //Local file contents: ' + data
            status = data;
            processServerStatus(status)
          }
        });
}catch(e){
              processServerStatus(1)
}
      })

      function processServerStatus(status) {
        console.log('processServerStatus=' + status)
        if (status == 0) {
          var offline = true;
        } else {
          var offline = false;
        }
        console.log('offline = ' + offline)





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
  }

});



// Start the server if not testing with Lab
if (!module.parent) {
  server.start((err) => {
    if (err) {
      throw err
    }
    console.log(`Service ${process.env.servicename} running at: ${server.info.uri}`)
  })
}
module.exports = server
