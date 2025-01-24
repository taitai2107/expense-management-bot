const {pool} = require("../config/connect");

class Utils {
   static async getUserId(telegram_id) {
        try {
            const checkUserQuery = `SELECT id FROM users WHERE telegram_id = ?`;
            const [userRows] = await pool.execute(checkUserQuery, [telegram_id]);

            if (userRows.length === 0) {
                return { success: false, message: "Tài khoản không tồn tại." };
            }

            return { success: true, userId: userRows[0].id };
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
            return { success: false, message: "Đã xảy ra lỗi khi lấy dữ liệu." };
        }
    }
    static isValidDate = (dateString) => {
        dateString = dateString.trim().replace(/\s+/g, ' ');

        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (isoDateRegex.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                return false;
            }
            const daysInMonth = new Date(year, month, 0).getDate();
            return day <= daysInMonth;
        }

        const usDateTimeRegex = /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2} (AM|PM)$/i;
        if (usDateTimeRegex.test(dateString)) {
            const [datePart, timePart, period] = dateString.split(' ');
            const [month, day, year] = datePart.split('/').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                return false;
            }
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day > daysInMonth) {
                return false;
            }

            const [hours, minutes, seconds] = timePart.split(':').map(Number);
            if (hours < 1 || hours > 12 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
                return false;
            }
            return true;
        }
        return false;
    };


}
module.exports = Utils;
