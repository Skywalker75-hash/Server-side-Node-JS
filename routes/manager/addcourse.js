var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 添加课程信息
router.post('/', function(req, res) {
    const { CourseName, CourseCode, CreditHours, Department, ClassTime } = req.body;  // 接收课程信息
    console.log(CourseName, CourseCode, CreditHours, Department, ClassTime);

    // 插入课程信息到Courses表
    const sql = `
        INSERT INTO Courses (CourseName, CourseCode, CreditHours, Department, ClassTime)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [CourseName, CourseCode, CreditHours, Department, ClassTime];

    pool.query(sql, values, function(error, result) {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: '课程代码已存在' });
            }
            return res.status(500).json({ success: false, message: '添加课程错误' });
        }
        // 添加成功，返回成功消息
        res.json({
            success: true,
            message: '成功添加课程'
        });
    });
});

module.exports = router;
