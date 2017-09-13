const fs = require('fs')

const API = require('./API')



function authenticateUser (id,password,cb) {
  console.log('authenticate user')
  console.log(id)
  console.log(password)
  API.user.login(id,password,(data)=>{
    console.log('auth user returns:')
//    console.log(data)
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
