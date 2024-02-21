var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//查询并显示课程信息
router.post('/', function(req, res) {
    pool.query('SELECT * FROM Courses', function(error, results) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询Courses表错误' });
        }
        //返回json数据包
        res.json({
            success: true,
            message: '查询成功',
            data: results
        });
    });
});

module.exports = router;
