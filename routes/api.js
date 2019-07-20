var express = require('express');
var fs = require('fs');
var common = require('../lib/common');
var cookieSession = require('cookie-session');
var mysql=require('mysql');
var router = express.Router();
var Geetest = require('gt3-sdk');
var path = require('path');
var formidable = require('formidable');

var app = express();
var db=mysql.createPool({host: 'localhost', user: 'root', password: 'hd564964', database: 'test'});


var captcha = new Geetest({
    geetest_id: '588074561b1c078c748343ec5ed403a2', // 将xxx替换为您申请的 id
    geetest_key: 'ee7bc312f037c06dff83a6b9b9b94fd7' // 将xxx替换为您申请的 key
});

app.use(cookieSession({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true
}));
router.get('/banner',(req,res)=>{
    db.query(`SELECT * FROM bannertable`,(err,data)=>{
        if(err){
            console.error(err);
            res.status(500).send('database error').end();
        }else{
            for(let i in data){
                data[i].src = 'http://'+req.headers.host+'/images/'+data[i].src;
            }
            res.json(data).end();
        }
    })
})
router.get('/goods',(req,res)=>{
    db.query(`SELECT * FROM goodstable`,(err,data)=>{
        if(err){
            console.error(err);
            res.status(500).send('database error').end();
        }else{
            for(let i in data){
                data[i].goodsImg = 'http://'+req.headers.host+'/images/'+data[i].goodsImg;
            }
            res.json(data).end();
        }
    })
})
router.get('/news',(req,res)=>{
    db.query(`SELECT * FROM newstable`,(err,data)=>{
        if(err){
            console.error(err);
            res.status(500).send('database error').end();
        }else{
            res.json(data).end();
        }
    })
})

router.get("/gt/register", function (req, res) {
    // 向极验申请每次验证所需的challenge
    captcha.register({
        client_type: 'unknown',
        ip_address: 'unknown'
    }, function (err, data) {
        if (err) {
            console.error(err);
            return;
        }

        if (!data.success) {
            // 进入 failback，如果一直进入此模式，请检查服务器到极验服务器是否可访问
            // 可以通过修改 hosts 把极验服务器 api.geetest.com 指到不可访问的地址

            // 为以防万一，你可以选择以下两种方式之一：

            // 1. 继续使用极验提供的failback备用方案
            req.session.fallback = true;
            res.josn(data);

            // 2. 使用自己提供的备用方案
            // todo

        } else {
            // 正常模式
            req.session.fallback = false;
            res.json(data);
        }
    });
});

router.post("/gt/form-validate", function (req, res) {

    // 对form表单提供的验证凭证进行验证
    captcha1.validate(req.session.fallback, {

        geetest_challenge: req.body.geetest_challenge,
        geetest_validate: req.body.geetest_validate,
        geetest_seccode: req.body.geetest_seccode

    }, function (err, success) {

        if (err) {
            // 网络错误
            res.send(err);

        } else if (!success) {

            // 二次验证失败
            res.send("<h1 style='text-align: center'>登录失败</h1>");

        } else {
            res.send("<h1 style='text-align: center'>登录成功</h1>");
        }

    });
});
router.post('/login',(req,res)=>{
    var tel=req.body.tel;
    var password=common.md5(req.body.password+common.MD5_SUFFIX);
    db.query(`SELECT * FROM UserTable WHERE tel='${tel}'`,(err,data)=>{
        if(err){
            res.status(500).send('database error').end();
        }else{               
            if(data.length==0){
                res.json({code:1,msg:'用户不存在,请注册！'}).end();
            }else{                    
                if(data[0].password==password){
                    req.session['admin_id']=data[0].ID
                    res.json({code:0,msg:'登录成功！'}).end();
                }else{
                    res.json({code:2,msg:'密码错误！'}).end();
                }
            }
        }
    })
    
});
// 检查登录状态
    router.use((req,res,next)=>{
        if(!req.session['admin_id']){
            res.json({code:0,msg:'重新登录'}).end();
        }else{
            next();
        }
    });
router.post('/register',(req,res)=>{
    var tel=req.body.tel;
    var password=common.md5(req.body.password+common.MD5_SUFFIX);
    console.log(tel.length)
    db.query(`SELECT * FROM UserTable WHERE tel='${tel}'`,(err,data)=>{
        if(err){
            console.error(err);
            res.status(500).send('database error').end();
        }else{
            if(data.length==0){
                db.query(`INSERT INTO UserTable (tel,password) VALUES ('${tel}','${password}')`,(err,data)=>{
                    if(err){
                        console.error(err);
                        res.status(500).send('database error').end();
                    }else{               
                        res.json({code:0,msg:'注册成功！'}).end();
                    }
                })
            }else{
                res.json({code:1,msg:'用户已存在！'}).end();
            }
        }
    })
    
    
});


module.exports = router;
