const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { scheduleSimilarityCalculation } = require('./routes/market/similarityCalculator'); // 确保这个路径与你的文件结构相匹配

const app = express();

// 视图引擎设置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 中间件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 路由配置：每一个URL路径配置一条语句
var loginRouter = require('./routes/login/login');//登录
var registerRouter = require('./routes/login/register');//注册
var recoverpassRouter = require('./routes/login/recoverpassword');//重置密码

var registercardRouter= require('./routes/campuscard/registercard');//注册校园卡
var queryAccountRouter=require('./routes/campuscard/queryAccount');//查询校园卡
var reportLostRouter = require('./routes/campuscard/reportLoss');//挂失校园卡
var cancelLossRouter = require('./routes/campuscard/cancelLoss');//解挂校园卡
var rechargeCardRouter = require('./routes/campuscard/rechargeCard');//充值校园卡

var getCoursesRouter =  require('./routes/academic/getCourses');//获取课程信息
var showSchoolCoursesRouter = require('./routes/academic/showSchoolCourses');//获取特定学院课程
var selectCoursesRouter = require('./routes/academic/selectCourses');//选课
var showSelectedCoursesRouter = require('./routes/academic/showSelectedCourses');//展示已选课程
var deleteCourseRouter = require('.//routes/academic//deleteCourse');//删除已选课程

var classScheduleRouter = require('./routes/classschedule/classSchedule');//课程表

var releaseThingsRouter = require('./routes/market/releaseThings');//上传发布物品信息
var removeThingsRouter = require('./routes/market/removeThings');//下架发布的物品
var showThingsRouter = require('./routes/market/showThings');//展示数据库中物品信息
var interactionsRouter = require('./routes/market/interactions');//记录用户对物品的点击次数
var showuserThingsRouter = require('./routes/market/showuserThings');//展示自己发布的商品
var buyThingsRouter = require('./routes/market/buyThings');//购买商品

var declareLossRouter = require('./routes/declareloss/releaseLoss');//上传挂失物品
var showLossRouter = require('./routes/declareloss/showLoss');//展示挂失物品
var releasePhoneRouter = require('./routes/declareloss/releasePhone');//上传手机号
var removeLossRouter = require('./routes/declareloss/removeLoss');//删除挂失
var showuserLossRouter = require('./routes/declareloss/showuserLoss');//展示自己挂失的物品

var mloginRouter = require('./routes/manager/mlogin');//管理员登录
var mdeletecourseRouter = require('./routes/manager/mdeletecourse');//管理员删除课程
var addcourseRouter = require('./routes/manager/addcourse');//管理员添加课程

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
app.use('/showSchoolCourses',showSchoolCoursesRouter);
app.use('/releaseThings',releaseThingsRouter);
app.use('/showThings',showThingsRouter);
app.use('/interactions',interactionsRouter);
app.use('/removeThings',removeThingsRouter);
app.use('/showuserThings',showuserThingsRouter);
app.use('/buyThings',buyThingsRouter);
app.use('/releaseLoss',declareLossRouter);
app.use('/showLoss',showLossRouter);
app.use('/releasePhone',releasePhoneRouter);
app.use('/removeLoss',removeLossRouter);
app.use('/showuserLoss',showuserLossRouter);
app.use('/registercard',registercardRouter);
app.use('/deleteCourse',deleteCourseRouter);
app.use('/mdeletecourse',mdeletecourseRouter);
app.use('/addcourse',addcourseRouter);
app.use('/mlogin',mloginRouter);


// 错误处理
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// 定时任务
scheduleSimilarityCalculation();

// 服务器启动
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
