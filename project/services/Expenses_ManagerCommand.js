const {pool} = require("../config/connect");
const { getUserId } = require('../utils/Utils');
//const Validate_Expense = require("../validate/InputExpense");

class ExpenseManager {
    static categories = {
        category_luong: "Lương",
        category_an_uong: "Ăn uống",
        category_giai_tri: "Giải trí",
        category_di_lai: "Đi lại",
        category_khac: "Khác"
    };

    async processTransaction(ctx) {
        ctx.session = ctx.session || {};
        ctx.session.step = "awaiting_transaction_input";
        await ctx.reply("Vui lòng chọn loại thu/chi:", {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Lương", callback_data: "category_luong"}],
                    [{text: "Ăn uống", callback_data: "category_an_uong"}],
                    [{text: "Giải trí", callback_data: "category_giai_tri"}],
                    [{text: "Đi lại", callback_data: "category_di_lai"}],
                    [{text: "Khác", callback_data: "category_khac"}],
                    [{text: "Import dữ liệu từ exel", callback_data: "import_exel"}],
                    [{text: "đặt ngân sách cho từng loại chi tiêu", callback_data: "set_budget"}],
                ]
            }
        });
    }
    async processSetBudgetTransaction(ctx) {
        await ctx.reply("Chọn loại chi tiêu muốn giới hạn", {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Ăn uống", callback_data: "budget_an_uong"}],
                    [{text: "Giải trí", callback_data: "budget_giai_tri"}],
                    [{text: "Đi lại", callback_data: "budget_di_lai"}],
                    [{text: "Khác", callback_data: "budget_khac"}],
                    [{text: "Tổng chi tiêu", callback_data: "budget_total"}],
                ]
            }
        });
    }

    async handleImportExel(ctx,money_chi,money_thu,category,description ){
        if (!ctx.from.id) {
            return await ctx.reply("Không tìm thấy Telegram ID. Vui lòng thử lại.");}
            try {
                let userid = (await getUserId(ctx.from.id)).userId
                const query = `  INSERT INTO expenses (user_id, money_chi, money_thu, expense_type, category,
                                                       description)
                                 VALUES (?, ?, ?, ?, ?, ?)`

                const expenseType = money_chi > 0 ? "Chi" : (money_thu >= 0 ? "Thu" : null);
                await pool.execute(query, [
                    userid,
                    money_chi,
                    money_thu,
                    expenseType,
                    category,
                    description,
                ]);
              //  ctx.reply("giao dịch đã được import thành công")
            } catch (err) {
                console.error(err)
                ctx.reply("đã có lỗi xảy ra khi import dữ liệu")
            }
        }




async handleCategorySelection(ctx, description, money, category)
{
    // const validate = new Validate_Expense();
    // validate.validateAmount(money);
    // validate.validateDescription(description);

    //  const callbackData = ctx.callbackQuery.data;
    //const category = ExpenseManager.categories[callbackData] || "Khác";

    const type = money < 0 ? "Chi" : "Thu";
    const amount = Math.abs(money);

    const telegram_id = ctx.from.id;
    const trans = await this.saveTransaction(ctx, telegram_id, amount, type, category, description);
    if (trans) {
        await ctx.reply(`Bạn đã ghi nhận ${type} ${amount} cho thể loại: ${category}. Mô tả: ${description}`);
    }
}

async saveTransaction(ctx, telegramId, money, type, category, description)
{
    try {
        console.log("Thông tin người dùng:", telegramId);


        const checkUserQuery = `SELECT id FROM users WHERE telegram_id = ?`;
        const [userRows] = await pool.execute(checkUserQuery, [telegramId]);

        if (userRows.length === 0) {
            console.error("Tài khoản không tồn tại trong bảng users.");
            return ctx.reply("Tài khoản không tồn tại. Vui lòng đăng ký trước.");
        }

        const userId = userRows[0].id;

        if (!userId) {
            console.error("Không thể tìm thấy user_id.");
            return ctx.reply("Không thể tìm thấy user_id.");
        }

        console.log("Thông tin giao dịch:", {money, type, category, description});


        const moneyChi = type === "Chi" ? money : 0;
        const moneyThu = type === "Thu" ? money : 0;


        // console.log("Truy vấn chuẩn bị thực thi:", [
        //   userId,
        //   moneyChi,
        //   moneyThu,
        //   type,
        //   category,
        //   description
        // ]);

        const query = `
            INSERT INTO expenses (user_id, money_chi, money_thu, expense_type, category, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await pool.execute(query, [
            userId,
            moneyChi,
            moneyThu,
            type,
            ExpenseManager.categories[category],
            description
        ]);

        console.log("Giao dịch đã được lưu thành công.");
        return true;
    } catch (error) {
        console.error("Lỗi khi lưu giao dịch:", error);
        return ctx.reply("Đã xảy ra lỗi khi lưu giao dịch. Vui lòng thử lại.");
    }
}

}

module.exports = ExpenseManager;
