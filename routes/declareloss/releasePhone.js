var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

// 更新挂失信息，添加电话号码
router.post('/', function(req, res) {
    const { LossItemID, Phone } = req.body;

    // 检查必需的信息是否已提供
    if (!LossItemID || !Phone) {
        return res.status(400).json({ success: false, message: '请提供完整的信息' });
    }

    // 更新LossItems表中的电话号码
    pool.query('UPDATE LossItems SET Phone = ? WHERE LossItemID = ?',
        [Phone, LossItemID], function(error, results) {
            if (error) {
                return res.status(500).json({ success: false, message: '更新LossItems表错误' });
            }
            if (results.affectedRows === 0) {
                // 没有找到指定的LossItemID，或者没有更新任何行
                return res.status(404).json({ success: false, message: '未找到指定的挂失条目或电话号码未变更' });
            }
            res.json({ success: true, message: '电话号码已成功更新' });
        });
});

module.exports = router;
