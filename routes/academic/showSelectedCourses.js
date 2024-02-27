var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 查询已选课程信息
router.post('/', function(req, res) {
    const { username } = req.body;

    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, result) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: '未找到用户' });
        } else {
            const UserID = result[0].userID;
            pool.query('SELECT * FROM Courses JOIN enrollments ON enrollments.CourseID = Courses.CourseID WHERE UserID = ?', [UserID], function(err, queryResults) {
                if (err) {
                    return res.status(500).json({ success: false, message: '查询Courses和enrollments表错误' });
                }
                // 返回json数据包
                res.json({
                    success: true,
                    message: '查询成功',
                    data: queryResults
                });
            });
        }
    });
});

module.exports = router;
