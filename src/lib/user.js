const fs = require('fs')

const API = require('./API')



function authenticateUser (id,password,cb) {

  API.user.login(id,password,(data)=>{
    cb(data)
  })
/**
  if (id==='demouser' && password==='wat3r15l1f3'){
  var user={status:true,user:{name:'Demo User',userid:1},message:null}
  } else {
  var user={status:false,user:null,message:'incorrect username or password'}
  }

  return user
  **/
}


module.exports = {
  authenticate: authenticateUser
}
