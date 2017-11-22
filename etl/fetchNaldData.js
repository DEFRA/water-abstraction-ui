require('dotenv').config()
fs=require('fs')
var AWS = require('aws-sdk');
var config = new AWS.Config({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET
});
console.log(config)
var s3 = new AWS.S3(config);
var params = {
  Bucket: process.env.S3_PATH,
  Key: 'nald/'+process.env.environment+'-nald.xls'
};
console.log(params)
s3.getObject(params, function(err, data) {
  if (err) {
    console.log(err)
    //we don't actually care if there's an error as we always assume online if we don't know...
    //console.log(`s3 file not found at ${process.env.environment}-status`)

    return
  } else {
    //read file contents from s3, and write to local file
    if(err == null)
        {
            var buff = new Buffer(data.Body, "binary"); //i've tried everything.
            var fd = fs.openSync("nalds-data.xls", "w");
            fs.writeSync(fd, buff, 0, buff.length,0);
        }

  }
});
