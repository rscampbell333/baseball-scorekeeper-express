var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var cors = require('cors')

var indexRouter = require('./routes/index')
var gamesRouter = require('./routes/games')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors({
  origin: 'http://localhost:3000',
  exposedHeaders: ['location']
}))

app.use('/', indexRouter)
app.use('/scorekeeper', gamesRouter)

module.exports = app
