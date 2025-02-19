const { pool } = require("../config/connect");

const categories = {
    budget_luong: "Lương",
    budget_an_uong: "Ăn uống",
    budget_giai_tri: "Giải trí",
    budget_di_lai: "Đi lại",
    budget_khac: "Khác"
};

const getMonthlySpending = async (user_id, categor, month) => {
    try {
        const query = `
            SELECT IFNULL(SUM(money_chi), 0) AS total_spending
            FROM expenses
            WHERE category = ? AND MONTH(date) = ? AND user_id = ? ;
        `;
        const [rows] = await pool.execute(query, [categor, month, user_id]);
        return rows[0].total_spending;
    } catch (error) {
        console.error("Error in getMonthlySpending:", error);
        throw error;
    }
};

let getBudgetText = async (userId, redisClient) => {
    let rawData = await redisClient.get(`bg_${userId}`);
    console.log("Dữ liệu từ Redis:", rawData);
    if (!rawData) {
        return "📌 Menu của bạn (Không đặt ngân sách)";
    }
    let budgetData;
    try {
        budgetData = JSON.parse(rawData);
    } catch (error) {
        console.error("Lỗi parse :", error);
        return `📌 Menu của bạn (Dữ liệu ngân sách không hợp lệ)\n❌ Dữ liệu lỗi: ${rawData}`;
    }
    let result = '';
    for (let budget in budgetData.budgets) {

        const cate = categories[budget] || budget;

        let money = await getMonthlySpending(budgetData.uid, cate, budgetData.month);

        const budgetValue = Number(budgetData.budgets[budget]) - money;

        const disVal = budgetValue < 0
            ? `Đã hết (${budgetValue} VNĐ)`
            : `${budgetValue} VNĐ`;
        result += `${cate}: ${disVal}\n`;
    }
    //console.log("Kết quả hiển thị:", result);
    return `📌 Menu của bạn\nGiới hạn chi tiêu trong tháng ${budgetData.month}:\n${result}`;
};

module.exports = getBudgetText;
