var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var pool = require('./dbPool'); // 使用同一个数据库连接池

// 重置密码
router.post('/', function(req, res) {
    const { username, newPassword } = req.body;
    console.log(username);
    console.log(newPassword);

    // 从数据库查询用户信息以确认用户名存在
    pool.query('SELECT * FROM user WHERE userName = ?', [username], function(error, results) {
        if (error) {
            // 数据库查询出错
            return res.status(500).json({success: false, message: '服务错误'});
        }
        if (results.length === 0) {
            // 用户名不存在
            return res.status(401).json({success: false, message: '用户名不存在'});
        }

        // 用户名存在，加密新密码
        bcrypt.hash(newPassword, 10, function(hashError, hashedPassword) {
            if (hashError) {
                // 密码加密出错
                return res.status(500).json({success: false, message: '密码加密出错'});
            }
            //更新数据库中的密码
            pool.query('UPDATE user SET userPwd = ? WHERE userName = ?', [hashedPassword, username], function(updateError) {
                if (updateError) {
                    // 更新数据库出错
                    return res.status(500).json({success: false, message: '数据库更新出错'});
                }
                // 密码更新成功
                res.json({success: true, message: "密码重置成功"});
            });
        });
    });
});

module.exports = router;
