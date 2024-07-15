const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
// const multer  = require('multer')
const port = process.env.PORT || 30001;
// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares)
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'public/')
//     },
//     filename: function (req, file, cb) {
//      let data = new Date()
//      let images = "images/" +file.originalname
//      req.body.images=images
//       cb(null, images)
//     }
//   })
  
//   const bodyParser = multer({ storage: storage }).any()

// // To handle POST, PUT and PATCH you need to use a body-parser
// // You can use the one used by JSON Server
// server.use(bodyParser)
// server.post("/products",(req, res, next) => {
//   let data=new Date()
//   // req.body.createdAt=data.toIsostring()


//   // Continue to JSON Server router
//   next()
// })

// Use default router
server.use(router)
server.listen(port)