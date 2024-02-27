var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express(); // 创建 Express 应用实例

// 路由配置：每一个URL路径配置一条语句
var loginRouter = require('./routes/login/login');//登录
var registerRouter = require('./routes/login/register');//注册
var recoverpassRouter = require('./routes/login/recoverpassword');//重置密码

var queryAccountRouter=require('./routes/campuscard/queryAccount');//查询校园卡
var reportLostRouter = require('./routes/campuscard/reportLoss');//挂失校园卡
var cancelLossRouter = require('./routes/campuscard/cancelLoss');//解挂校园卡
var rechargeCardRouter = require('./routes/campuscard/rechargeCard');//充值校园卡

var getCoursesRouter =  require('./routes/academic/getCourses');//获取课程信息
var selectCoursesRouter = require('./routes/academic/selectCourses');//选课
var showSelectedCoursesRouter = require('./routes/academic/showSelectedCourses');//展示已选课程

var classScheduleRouter = require('./routes/classschedule/classSchedule');//课程表

// 视图引擎设置
app.set('views', path.join(__dirname, 'views')); // 设置视图文件的目录
app.set('view engine', 'ejs'); // 设置视图模板引擎为 ejs

// 使用各种中间件
app.use(express.static('public'));
app.use(logger('dev')); // 使用 morgan 日志中间件以 'dev' 格式记录日志
app.use(express.json()); // 解析 JSON 格式的请求体数据
app.use(express.urlencoded({ extended: false })); // 解析 URL-encoded 格式的请求体数据
app.use(cookieParser()); // 解析 Cookie
app.use(express.static(path.join(__dirname, 'public'))); // 设置静态文件目录

// 使用路由中间件，为应用定义路由
app.use('/login', loginRouter);
app.use('/register',registerRouter);
app.use('/recoverpassword',recoverpassRouter);
app.use('/queryAccount',queryAccountRouter);
app.use('/reportLoss',reportLostRouter);
app.use('/cancelLoss',cancelLossRouter);
app.use('/rechargeCard',rechargeCardRouter);
app.use('/getCourses',getCoursesRouter);
app.use('/selectCourses',selectCoursesRouter);
app.use('/showSelectedCourses',showSelectedCoursesRouter);
app.use('/classSchedule',classScheduleRouter);

// 捕获 404 错误并转发到错误处理器
app.use(function(req, res, next) {
  next(createError(404));
});

// 错误处理器
app.use(function(err, req, res, next) {
  // 设置局部变量，仅在开发环境中提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});
//
module.exports = app; // 导出 app 实例，以便可以在其他文件（如bin/www）中使用
