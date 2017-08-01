const fs = require('fs')
const baseFilePath = __dirname + '/../public/data/licences/'


function authenticateUser (id,password) {
  if (id==='demouser' && password==='password'){
  var user={status:true,user:{name:'Demo User',userid:1},message:null}
  } else {
  var user={status:false,user:null,message:'incorrect username or password'}
  }

  return user
}


module.exports = {
  authenticate: authenticateUser
}
