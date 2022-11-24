var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv')
dotenv.config()
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var fileUpload=require('express-fileupload')
var db=require('./config/connection')
var session=require('express-session')
var hbs=require('express-handlebars')
var app = express();
const Handlebars=require('handlebars')
// require('dotenv').config()



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// caching disabled for every route
app.use((req, res, next)=> {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret:"key",
    cookie:{maxAge:600000}
  })
)

//index of tables
Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

db.connect((err)=>{
  if(err)
    console.log('connection error'+err);
  else
    console.log('database connected');
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
