const fs = require('fs')



function authenticateUser (id,password) {
  if (id==='demouser' && password==='wat3r15l1f3'){
  var user={status:true,user:{name:'Demo User',userid:1},message:null}
  } else {
  var user={status:false,user:null,message:'incorrect username or password'}
  }

  return user
}


module.exports = {
  authenticate: authenticateUser
}
