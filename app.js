var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var mysql = require('mysql');
var logger = require('morgan');
var consolidate = require('consolidate');


var indexRouter = require('./routes/index');
var api = require('./routes/api');

var app = express();


app.use(cookieParser());
(function(){
    var keys=[];
    for(var i=0;i<10000;i++){
        keys[i] = 'a_'+Math.random();
    }

    app.use(cookieSession({
        name:'sess_id',
        keys:keys,
        maxAge:20*60*1000
    }));
})();


app.use(logger('dev'));
app.use(bodyParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('/', indexRouter);
app.use('/api', api);

app.engine('html', consolidate.ejs);
app.set('views', 'dist');
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'dist')));
module.exports = app;
