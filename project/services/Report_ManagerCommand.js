const { pool } = require("../config/connect");
const ExcelJS = require('exceljs');

class ReportManager {
  // static categories = {
  //   category_luong_pr: "Lương",
  //   category_an_uong_rp: "Ăn uống",
  //   category_giai_tri_rp: "Giải trí",
  //   category_di_lai_rp: "Đi lại",
  //   category_khac_rp: "Khác"
  // };
   categories = ["category_luong","category_giai_tri","category_an_uong","category_di_lai","category_khac"]
  async processReportByCategory(ctx) {
    // ctx.session = ctx.session || {};
    // ctx.session.step = "awaiting_transaction";
    await ctx.reply("Vui lòng chọn loại thu/chi:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Lương", callback_data: "category_luong_rp" }],
          [{ text: "Ăn uống", callback_data: "category_an_uong_rp" }],
          [{ text: "Giải trí", callback_data: "category_giai_tri_rp" }],
          [{ text: "Đi lại", callback_data: "category_di_lai_rp" }],
          [{ text: "Khác", callback_data: "category_khac_rp" }]
        ]
      }
    });
  }

  async processTransaction(ctx) {
    ctx.reply("Vui lòng chọn loại báo cáo:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Tất cả thu/chi", callback_data: "get_all_report" }],
          [{ text: "Báo cáo theo tháng", callback_data: "month_report" }],
          [{ text: "Xóa báo cáo theo id", callback_data: "del_report_id" }],
          [{ text: "Xuất file Exel", callback_data: "export_exel_report" }],
          [{ text: "Thống kê chi tiêu theo lọai", callback_data: "report_by_category" }]
          
        ],
      },
    });
  }
  // ConfigWorksheet(worksheet,widthw){
  //   worksheet.getColumn('date').width = widthw;
  //   worksheet.getColumn('description').width = widthw;
  //   worksheet.getColumn('category').width = widthw; //expense_type
  //   worksheet.getColumn('money_thu').width = widthw;
  //   worksheet.getColumn('money_chi').width = widthw;
  //   worksheet.getColumn('expense_type').width = widthw;
  // }

  async ReportByCateGory(ctx,category)
  {
    
    const telegram_id = ctx.from.id;
    try {
      if (!telegram_id) {
        return await ctx.reply("Không tìm thấy Telegram ID. Vui lòng thử lại.");
      }
      
      category = category.replace(/_rp$/, ''); 
     
      const user_id = (await this.getUserId(telegram_id)).userId;
      const query = `SELECT * FROM expenses WHERE user_id = ? AND category = ?`;
      const [rows] = await pool.execute(query,[user_id,category])
      // console.log("checkCate",category,user_id)
      // console.log('check_row',rows)
      if (!Array.isArray(rows) || rows.length === 0) {
        return await ctx.reply("Không có giao dịch nào được tìm thấy.");
      }

      let message = `Danh sách giao dịch theo thể loại ${category} của bạn:\n`;

      rows.forEach((row, index) => {
        message += `STT: ${index + 1}. Mô tả: ${row.description}\n`;
        message += `  - Id Giao Dịch: ${row.id}\n`;
        message += `  - Loại: ${row.category}\n`;
        message += `  - Mô Tả: ${row.description}\n`;
        message += `  - Thu: ${row.money_thu} VND\n`;
        message += `  - Chi: ${row.money_chi} VND\n`;
        message += `  - Ngày: ${new Date(row.date).toLocaleDateString()}\n\n`;
      });

      return await ctx.reply(message);
    } catch (error) {
      console.log("checl eror", error)
      ctx.reply("đâ có lỗi xảy ra khi lấy dữ liệu")
    }
  }

  async Exports(ctx) {
    const telegram_id = ctx.from.id;
    try {
      if (!telegram_id) {
        return await ctx.reply("Không tìm thấy Telegram ID. Vui lòng thử lại.");
      }

      const user_id = (await this.getUserId(telegram_id)).userId;
      const query = 'SELECT * FROM expenses where user_id = ?'
      const [rows] = await pool.execute(query, [user_id]);
     // console.log(rows, user_id)

      if (!rows.length) {
        return await ctx.reply("Không có dữ liệu để xuất.");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');
      worksheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key: key, width: 25 }));
      rows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      await ctx.replyWithDocument({
        source: Buffer.from(buffer),
        filename: `expenses_report_${Date.now()}.xlsx`,
      });
    } catch (error) {
      console.error("Error Exports:", error);
      ctx.reply("Đã có lỗi khi xuất file Excel.");
    }
  }
  async DelReport(ctx, id_trans) {
    try {
      const telegram_id = ctx.from.id;

      const user = await this.getUserId(telegram_id);
      const user_id = user.userId;
      const query = `DELETE FROM expenses WHERE user_id = ? AND id = ?`;

      const [result] = await pool.execute(query, [user_id, id_trans]);

      if (result.affectedRows === 0) {
        return await ctx.reply(`ID giao dịch không hợp lệ hoặc không tồn tại.`);
      }

      return await ctx.reply(`Đã xóa thành công giao dịch có ID: ${id_trans}`);
    } catch (error) {
      console.error("Error in DelReport:", error);
      return await ctx.reply("Có lỗi xảy ra khi xóa giao dịch. Vui lòng thử lại sau.");
    }
  }


  async MonthReport(ctx, month) {
    try {
      const telegramId = ctx.from.id;
      const year = new Date().getFullYear();
      const user_id = (await this.getUserId(telegramId)).userId
      console.log('userid', user_id)
      const querySum = `
        SELECT 
          SUM(CASE WHEN expense_type = 'Thu' THEN money_thu ELSE 0 END) AS total_Thu, 
          SUM(CASE WHEN expense_type = 'Chi' THEN money_chi ELSE 0 END) AS total_Chi
        FROM expenses
        WHERE YEAR(date) = ? AND MONTH(date) = ? AND user_id = ?;
      `;
      const [sumRows] = await pool.execute(querySum, [year, month, user_id]);


      const queryMonth = `
        SELECT id, description, money_thu, money_chi, date 
        FROM expenses 
        WHERE YEAR(date) = ? AND MONTH(date) = ? AND user_id = ?;
      `;
      const [detailsRows] = await pool.execute(queryMonth, [year, month, user_id]);


      if (!sumRows[0] || (sumRows[0].total_Thu === 0 && sumRows[0].total_Chi === 0)) {
        return await ctx.reply(`Không có báo cáo nào cho tháng ${month}.`);
      }
      //let total = sumRows[0].total_Thu - sumRows[0].total_Chi

      let message = `Tổng chi tiêu trong tháng ${month}:\n`;
      message += `- Tổng Thu: ${sumRows[0].total_Thu ? sumRows[0].total_Thu : 0} VND\n`;
      message += `- Tổng Chi: ${sumRows[0].total_Chi ? sumRows[0].total_Chi : 0} VND\n\n`;
      message += `- Tổng Kết: ${(sumRows[0].total_Thu ? sumRows[0].total_Thu : 0) - (sumRows[0].total_Chi ? sumRows[0].total_Chi : 0)} VND\n\n`;

      if (detailsRows.length > 0) {
        message += `Chi tiết các giao dịch:\n`;
        detailsRows.forEach((entry, index) => {
          message += `STT: ${index + 1}. Mô tả: ${entry.description}\n`;
          message += `  - Id Giao Dịch: ${entry.id}\n`;
          message += `  - Thu: ${entry.money_thu} VND\n`;
          message += `  - Chi: ${entry.money_chi} VND\n`;
          message += `  - Ngày: ${new Date(entry.date).toLocaleDateString()}\n\n`;
        });
      }


      await ctx.reply(message);
    } catch (error) {
      console.error("Lỗi khi tạo báo cáo tháng:", error);
      await ctx.reply("Đã xảy ra lỗi khi tạo báo cáo. Vui lòng thử lại sau.");
    }
  }


  async GetAll(ctx, telegram_id) {
    if (!telegram_id) {
      return await ctx.reply("Không tìm thấy Telegram ID. Vui lòng thử lại.");
    }

    try {
      const userResult = await this.getUserId(telegram_id);

      if (!userResult.success) {
        return await ctx.reply(userResult.message);
      }

      const userId = userResult.userId;
     // console.log('check userid', userId)
      const query = `SELECT * FROM expenses WHERE user_id = ?`;
      const [rows] = await pool.execute(query, [userId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return await ctx.reply("Không có giao dịch nào được tìm thấy.");
      }

      let message = "Danh sách giao dịch của bạn:\n";

      rows.forEach((row, index) => {
        // let money = row.money_thu ? row.money_chi : 0
        //message += `STT: ${index + 1}: \n IdTrans: ${row.id}, \n Loại: ${row.expense_type}, \n Danh mục: ${row.category}, \n Mô tả: ${row.description}, \n Số tiền chi: ${row.money_chi} VND\n Số tiền thu: ${row.money_thu} VND\n Date: ${row.date} \n`;
        message += `STT: ${index + 1}. Mô tả: ${row.description}\n`;
        message += `  - Id Giao Dịch: ${row.id}\n`;
        message += `  - Loại: ${row.category}\n`;
        message += `  - Mô Tả: ${row.description}\n`;
        message += `  - Thu: ${row.money_thu} VND\n`;
        message += `  - Chi: ${row.money_chi} VND\n`;
        message += `  - Ngày: ${new Date(row.date).toLocaleDateString()}\n\n`;
      });

      return await ctx.reply(message);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch:", error);
      return ctx.reply("Đã xảy ra lỗi khi lấy danh sách giao dịch. Vui lòng thử lại.");
    }
  }

  async getUserId(telegram_id) {
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
}

module.exports = ReportManager;
