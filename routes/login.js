var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var pool = require('./dbPool'); // 使用同一个数据库连接池
//登录
router.post('/', function(req, res) {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  //从数据库查询用户信息
  pool.query('SELECT * FROM user WHERE userName = ?', [username], function(error, results) {
    if (error) {
      //数据库查询出错
      return res.status(500).json({success: false, message: '服务错误'});
    }
    if (results.length === 0) {
      //用户名不存在
      return res.status(401).json({success: false, message: '用户名不存在'});
    }

    const user = results[0];

    //使用 bcrypt 比较提供的密码和数据库中的加密密码
    bcrypt.compare(password, user.userPwd, function(err, result) {
      if (err) {
        //发生错误
        return res.status(500).json({success: false, message: '密码比较时发生错误'});
      }
      if (result) {
        //密码匹配，登录成功
        res.json({success: true, message: "登陆成功"});
      } else {
        //密码不匹配，登录失败
        res.status(401).json({success: false, message: '密码错误'});
      }
    });
  });
});

module.exports = router;
