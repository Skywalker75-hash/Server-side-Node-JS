var express = require('express');
var router = express.Router();
var pool = require('../dbPool');

router.post('/', function(req, res) {
    const { username, courseCodes } = req.body;

    if (!username || !courseCodes || courseCodes.length === 0) {
        return res.status(400).json({ success: false, message: '请提供完整信息' });
    }

    pool.query('SELECT userID FROM user WHERE userName = ?', [username], function(err, userResult) {
        if (err) {
            return res.status(500).json({ success: false, message: '查询user表错误' });
        }
        if (userResult.length == 0) {
            return res.status(404).json({ success: false, message: '未找到用户' });
        }
        const userId = userResult[0].userID;
        checkCourseSelection(userId, courseCodes, res);
    });
});

function checkCourseSelection(userId, courseCodes, res) {
    let coursesDetails = [];
    courseCodes.forEach((courseCode, index) => {
        pool.query('SELECT CourseID, ClassTime FROM Courses WHERE CourseCode = ?', [courseCode], function(err, courseResults) {
            if (err) {
                return res.status(500).json({ success: false, message: '查询courses表错误' });
            }
            if (courseResults.length === 0) {
                return res.status(404).json({ success: false, message: `未找到课程: ${courseCode}` });
            }

            const courseId = courseResults[0].CourseID;
            const classTime = courseResults[0].ClassTime;

            coursesDetails.push({ courseId, classTime });

            // 打印添加每个课程后的数组状态
            console.log("Added course details:", coursesDetails);

            // 在所有课程信息被添加后打印整个数组
            if (coursesDetails.length === courseCodes.length) {
                console.log("Final course details array:", coursesDetails);
                checkForTimeConflicts(userId, coursesDetails, res);
            }
        });
    });
}

function checkForTimeConflicts(userId, coursesDetails, res) {

    // 首先检查新选课程间是否有冲突
    for (let i = 0; i < coursesDetails.length; i++) {
        for (let j = i + 1; j < coursesDetails.length; j++) {
            const classTime1 = parseClassTime(coursesDetails[i].classTime);
            const classTime2 = parseClassTime(coursesDetails[j].classTime);
            if (checkTimeConflict(classTime1, classTime2)) {
                return res.json({ success: false, message: '新选课程时间冲突' });
            }
        }
    }

    // 然后检查新选课程与已选课程之间是否有冲突
    pool.query('SELECT Courses.CourseID, Courses.ClassTime FROM Enrollments JOIN Courses ON Enrollments.CourseID = Courses.CourseID WHERE Enrollments.UserId = ?', [userId], function(error, enrolledCourses) {
        if (error) {
            return res.status(500).json({ success: false, message: '查询enrollments表错误' });
        }

        for (let enrolledCourse of enrolledCourses) {
            const enrolledClassTime = parseClassTime(enrolledCourse.ClassTime);

            for (let courseDetail of coursesDetails) {
                const courseClassTime = parseClassTime(courseDetail.classTime);
                if (checkTimeConflict(enrolledClassTime, courseClassTime)) {
                    return res.json({ success: false, message: '选课时间冲突' });
                }
            }
        }

        // 如果没有时间冲突，执行选课逻辑
        enrollCourses(userId, coursesDetails, res);
    });
}

function enrollCourses(userId, coursesDetails, res) {
    const values = coursesDetails.map(detail => [userId, detail.courseId]);
    const sql = 'INSERT INTO Enrollments (UserId, CourseID) VALUES ?';

    pool.query(sql, [values], function(err, result) {
        if (err) {
            return res.status(500).json({ success: false, message: '选课失败' });
        }
        res.json({ success: true, message: '选课成功', enrolledCount: result.affectedRows });
    });
}

function checkTimeConflict(classTime1, classTime2) {
    console.log("冲突检测");
    for (let time1 of classTime1) {
        for (let time2 of classTime2) {
            if (time1.day === time2.day) {
                for (let period of time1.periods) {
                    if (time2.periods.includes(period)) {
                        return true; // 存在冲突
                    }
                }
            }
        }
    }
    return false; // 不存在冲突
}

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

module.exports = router;
