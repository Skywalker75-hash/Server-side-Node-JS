var express = require('express');
var router = express.Router();
var pool = require('../dbPool');
// 删除已选课程信息
router.post('/', function(req, res) {
    const { username, courseCodes } = req.body;  // 接收课程代码数组
    console.log(username);
    console.log(courseCodes);

    // 首先通过用户名查找用户ID
    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(error, users) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询用户ID错误' });
        }
        if (users.length === 0) {
            console.log(error);
            return res.status(404).json({ success: false, message: '未找到该用户名对应的用户' });
        }
        const userID = users[0].userID; // 获取用户ID

        // 通过课程代码查找所有课程ID
        const placeholders = courseCodes.map(() => '?').join(',');
        pool.query(`SELECT CourseID FROM Courses WHERE CourseCode IN (${placeholders})`, courseCodes, function(error, courses) {
            if (error) {
                return res.status(500).json({ success: false, message: '查询课程ID错误' });
            }
            if (courses.length === 0) {
                return res.status(404).json({ success: false, message: '未找到对应的课程' });
            }
            const courseIDs = courses.map(course => course.CourseID);

            // 检查并删除所有选课记录
            const deletePlaceholders = courseIDs.map(() => '?').join(',');
            pool.query(`DELETE FROM Enrollments WHERE UserID = ? AND CourseID IN (${deletePlaceholders})`, [userID, ...courseIDs], function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: '删除选课记录错误' });
                }
                // 删除成功，返回成功消息
                res.json({
                    success: true,
                    message: '成功删除选定课程'
                });
            });
        });
    });
});

module.exports = router;
