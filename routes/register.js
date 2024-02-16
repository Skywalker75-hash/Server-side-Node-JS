var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var pool = require('./dbPool'); // 使用同一个数据库连接池

// 注册新用户
router.post('/', async function(req, res) {
    const { username, password } = req.body;
    console.log(username);
    console.log(password);

    //检查用户名和密码是否被提供
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '未提供完整的用户名和密码' });
    }

    try {
        //检查用户名是否已存在
        const checkUserExist = await pool.query('SELECT * FROM user WHERE userName = ?', [username]);
        if (checkUserExist.length > 0) {
            return res.status(409).json({ success: false, message: '用户已存在' });
        }

        //加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //将新用户插入数据库
        await pool.query('INSERT INTO user (userName, userPwd) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ success: true, message: '注册成功' });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ success: false, message: '注册失败，服务出错' });
    }
});

module.exports = router;
