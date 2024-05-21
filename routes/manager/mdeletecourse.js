var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//删除课程信息
router.post('/', function(req, res) {
    const { courseCodes } = req.body;  // 接收课程代码数组
    console.log(courseCodes);

    //通过课程代码删除所有课程
    const placeholders = courseCodes.map(() => '?').join(',');
    pool.query(`DELETE FROM Courses WHERE CourseCode IN (${placeholders})`, courseCodes, function(error, result) {
        if (error) {
            return res.status(500).json({ success: false, message: '删除课程错误' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '未找到对应的课程' });
        }
        // 删除成功，返回成功消息
        res.json({
            success: true,
            message: '成功删除选定课程'
        });
    });
});

module.exports = router;
