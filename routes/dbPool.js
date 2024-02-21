//数据库连接池
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10, // 连接池允许的最大连接数
    host: 'localhost',     // 数据库服务器地址
    user: 'root',  // 数据库用户名
    password: '123456', // 数据库密码
    database: 'demo1' // 数据库名
});

module.exports = pool;
