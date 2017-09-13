
const VmL=require('../lib/VmL')



module.exports = [

  { method: 'GET', path: '/', config: { auth: false }, handler: VmL.getRoot },
  { method: 'GET', path: '/shortcode/{shortcode}', handler: VmL.useShortcode },
  { method: 'GET', path: '/signout', config: { auth: false }, handler: VmL.getSignout },
  { method: 'GET', path: '/signin', config: { auth: false }, handler: VmL.getSignin },
  { method: 'POST', path: '/signin', config: { auth: false }, handler: VmL.postSignin },
  { method: 'GET', path: '/licences',  handler: VmL.getLicences },
  { method: 'GET', path: '/licences/{licence_id}', handler: VmL.getLicence },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: VmL.getLicenceContact },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: VmL.getLicenceMap },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: VmL.getLicenceTerms }
]
