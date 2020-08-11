/* eslint-disable handle-callback-err */
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

require('dotenv').config()

const PORT = process.env.PORT || 9888
const STORAGE = process.env.STORAGE || '/var/www/docker_storage/image_file_upload'
const app = express()

app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    var dir = STORAGE
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    callback(null, dir)
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname)
  }
})

const uploadForm = (req, res) => {
  res.render('uploadForm')
}

const upload = (req, res, next) => {
  const upload = multer({ storage: storage }).array('files', 12)
  upload(req, res, function (err) {
    if (err) {
      return res.end('Something went wrong:(')
    }
    res.end('Upload completed.')
  })
}

const list = (req, res) => {
  res.write('<html><head><title>Images</title></head><body>')
  fs.readdir(STORAGE, (err, files) => {
    files.forEach(file => {
      const href = `/images/${encodeURIComponent(file)}`
      res.write(`<a href="${href}">${file}</a><br/>\n`)
    })
    res.end('</body></html>')
  })
}

const gallery = (req, res) => {
  fs.readdir(STORAGE, (err, files) => {
    res.render('gallery', { STORAGE: STORAGE, files: files })
  })
}

const loginAction = (req, res) => {
  const email = req.body.email
  const password = req.body.password
  console.log(`${email} sent ${password}`)
  res.cookie('authCookie', 'express')
  res.header('Location', '/')
  res.send()
}

app.post('/login', loginAction)

// only logged in users can proceed
app.get('*', (req, res, next) => {
  const auth = req.cookies.authCookie
  if (!auth) {
    res.render('login')
  } else {
    next()
  }
})

app.get('/uploadForm', uploadForm)
app.post('/upload', upload)
app.get('/list', list)
app.get('/', gallery)
app.use('/images', express.static(STORAGE))

console.log(`Listening on ${PORT}`)
app.listen(PORT)
