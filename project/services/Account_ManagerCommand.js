const {pool} = require("../config/connect");
class AccountManager{
  async checkIfAccountExists(telegramId) {
    const query = "SELECT id FROM users WHERE telegram_id = ?";
    const [rows] = await pool.execute(query, [telegramId]);
    return rows.length > 0; 
  }

  async createAccount(name, telegram_id, ctx) {
    try {
      const checkQuery = `SELECT * FROM users WHERE telegram_id = ?`;
      const [rows] = await pool.execute(checkQuery, [telegram_id]);
  
      if (rows.length > 0) {
     
        ctx.reply(`Tài khoản với ID ${telegram_id} đã tồn tại. Bạn đã đăng ký trước đó.`);
      } else {
       
        const insertQuery = `
          INSERT INTO users (name, telegram_id)
          VALUES (?, ?);
        `;
        await pool.execute(insertQuery, [name, telegram_id]);
        ctx.reply(`Chào mừng, ${name}! Bạn đã đăng ký thành công.`);
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký tài khoản:', error);
      ctx.reply('Có lỗi xảy ra khi đăng ký tài khoản. Vui lòng thử lại sau.');
    }
  }
 
  async askForConfirmation(ctx) {
    await ctx.reply("Bạn có chắc chắn muốn xóa tài khoản và tất cả dữ liệu thu chi không? (Yes/No)", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Yes", callback_data: "yes_delete" }],
          [{ text: "No", callback_data: "no_delete" }]
        ]
      }
    });
  }

  async deleteAccount(telegramId, ctx) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      
      const checkUserQuery = `SELECT id FROM users WHERE telegram_id = ?`;
      const [userRows] = await connection.execute(checkUserQuery, [telegramId]);
  
      if (userRows.length === 0) {
        await ctx.reply("Tài khoản không tồn tại.");
        await connection.rollback(); 
        return;
      }
  
      const userId = userRows[0].id;
  
      if (userId === undefined) {
        await ctx.reply("Lỗi: Không thể tìm thấy user_id.");
        await connection.rollback();
        return;
      }
  
      
      const deleteExpensesQuery = `DELETE FROM expenses WHERE user_id = ?`;
      await connection.execute(deleteExpensesQuery, [userId]);
  
      
      const deleteUserQuery = `DELETE FROM users WHERE telegram_id = ?`;
      await connection.execute(deleteUserQuery, [telegramId]);
  
      await connection.commit(); 
      await ctx.reply("Tài khoản và dữ liệu thu chi của bạn đã được xóa thành công.");
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error);
      await connection.rollback(); 
      await ctx.reply("Đã xảy ra lỗi khi xóa tài khoản. Vui lòng thử lại.");
    } finally {
      connection.release(); 
    }
  }
  
}
module.exports = AccountManager