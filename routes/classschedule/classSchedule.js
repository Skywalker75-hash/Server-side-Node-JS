var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

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
            pool.query('SELECT CourseName,ClassTime FROM Courses JOIN enrollments ON enrollments.CourseID = Courses.CourseID WHERE UserID = ?', [UserID], function(err, queryResults) {
                if (err) {
                    return res.status(500).json({ success: false, message: '查询Courses和enrollments表错误' });
                }

                // 新的数据结构来存储拆分后的课程时间
                const splitCourseTimes = [];

                // 遍历查询结果，并拆分ClassTime
                queryResults.forEach(course => {
                    // 分割ClassTime，例如："周2 12节，周4 56节" -> ["周2 12节", "周4 56节"]
                    const times = course.ClassTime.split('，');
                    times.forEach(time => {
                        splitCourseTimes.push({
                            CourseName: course.CourseName,
                            ClassTime: time
                        });
                    });
                });

                // 返回拆分后的课程时间列表
                res.json({
                    success: true,
                    message: '查询成功',
                    data: splitCourseTimes
                });
            });
        }
    });
});
module.exports = router;
