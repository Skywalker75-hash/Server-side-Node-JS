var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

//选课
router.post('/', function(req, res) {
    const { username, courseCode } = req.body;

    if (!username || !courseCode) {
        return res.status(400).json({ success: false, message: '请提供完整信息' });
    }

    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(err, userResult) {
        if (err) {
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if(userResult.length == 0){
            return res.status(404).json({ success: false, message: '未找到用户' });
        }
        const userId = userResult[0].userID;

        pool.query('SELECT CourseID, ClassTime FROM Courses WHERE CourseCode = ?', [courseCode], function(err, courseResults) {
            if (err) {
                return res.status(500).json({ success: false, message: '查询courses表错误' });
            }
            if (courseResults.length === 0) {
                return res.status(404).json({ success: false, message: '未找到课程' });
            }

            const courseId = courseResults[0].CourseID;
            const newClassTime = courseResults[0].ClassTime;


            pool.query('SELECT Courses.CourseID,Courses.CourseCode, Courses.ClassTime FROM Enrollments JOIN Courses ON Enrollments.CourseID = Courses.CourseID WHERE Enrollments.UserId = ?', [userId], function(error, enrolledCourses) {
                if (error) {
                    return res.status(500).json({success: false, message: '查询enrollments表错误'});
                }
                let a = false;//a是标志位，为true代表课程已选，为false代表课程没选
                for (let j of enrolledCourses) {
                    const id = j.CourseCode;
                    if (id == courseCode) {
                        a = true;
                        break;
                    }
                }
                if (a) {
                    return res.json({success: false, message: '该课程已选'});
                }
                else{
                let i = false;//i是标志位，为true表示冲突，为false表示没有冲突
                const Parsed1 = parseClassTime(newClassTime);//从newClassTime中提取Parsed1时间信息
                for (let j of enrolledCourses) {
                    const Parsed2 = parseClassTime(j.ClassTime);//从j.ClassTime中提取Parsed2时间信息
                    if (checkTimeConflict(Parsed1, Parsed2)) {   //调用checkTimeConflict函数检查两个时间信息是否有冲突
                        i = true;
                        break;
                    }
                }

                if (i) {
                    return res.json({success: false, message: '选课时间冲突'});
                } else {
                    // 如果没有时间冲突，执行选课逻辑
                    pool.query('INSERT INTO Enrollments (UserId, CourseID) VALUES (?, ?)', [userId, courseId], function (insertError) {
                        if (insertError) {
                            return res.status(500).json({success: false, message: '插入enrollments表错误'});
                        }
                        res.json({success: true, message: '选课成功'});
                    });
                }
            }
            });

        });
    });
});

module.exports = router;

//解析上课时间的函数
function parseClassTime(classTimeStr) {
    let classTimes = [];
    const days = classTimeStr.split('，');
    days.forEach(day => {
        const parts = day.trim().match(/^周(\d)\s(\d+)节$/);
        if (parts) {
            const dayOfWeek = parseInt(parts[1], 10);
            const periods = parts[2].split('').map(Number);
            classTimes.push({ day: dayOfWeek, periods: periods });
        }
    });
    return classTimes;
}

//检查上课时间是否冲突的函数
function checkTimeConflict(classTime1, classTime2) {
    for (let time1 of classTime1) {
        for (let time2 of classTime2) {
            if (time1.day === time2.day) { // 如果是同一天
                for (let period of time1.periods) {
                    if (time2.periods.includes(period)) { //检查是否有节次冲突
                        return true; // 存在冲突
                    }
                }
            }
        }
    }
    return false; // 不存在冲突
}

