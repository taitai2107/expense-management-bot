const axios = require("axios");
const ExcelJS = require('exceljs');
const {isValidDate} = require("../utils/Utils");

class Document_Handle {
    constructor(expenseManager) {
       // this.waitingForInput = this.waitingForInput,
            this.expenseManager = expenseManager;
    }

    async handleDocumentExelImport(ctx) {
        const userId = ctx.from.id;
       // const userState = this.waitingForInput[userId];
        const fileId = ctx.message.document.file_id;
        const fileName = ctx.message.document.file_name;
        try {
            if (!fileName.endsWith('.xlsx')) {
                return ctx.reply('Vui lòng gửi file Excel (.xlsx).');
            }
            const fileUrl = await ctx.telegram.getFileLink(fileId);
            const response = await axios.get(fileUrl.href, {responseType: "arraybuffer"});

            await  ctx.reply("File đã được tải lên thành công! Đang xử lý dữ liệu...");
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(response.data);

            const worksheet = workbook.getWorksheet(1);
            const requiredHeaders = ["id", "user_id", "money_chi", "money_thu", "expense_type", "category", "description", "date"];
            const headers = worksheet.getRow(1).values.slice(1);

            if (!requiredHeaders.every((header, index) => header === headers[index])) {
                return ctx.reply("Các trường trong file Excel không hợp lệ. Hãy lấy file mẫu từ hệ thống.");
            }
            const errors = [];
            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex === 1) return;

                const [id, userId, moneyChi, moneyThu, expenseType, category, description] = row.values.slice(1);

                if (!id || !userId || !expenseType || !category) {
                    errors.push(`Dòng ${rowIndex}: Dữ liệu thiếu.`);
                    return;
                }


                if (!["Lương", "Ăn uống", "Giải trí", "Đi lại", "Khác"].includes(category)) {
                    errors.push(`Dòng ${rowIndex}: Giá trị 'category' không hợp lệ.`);
                    return;
                }

                if ((Number(moneyChi) && Number(moneyThu)) || (!Number(moneyChi) && !Number(moneyThu))) {
                    errors.push(`Dòng ${rowIndex}: money_chi và money_thu phải có một giá trị hợp lệ.`);
                    return;
                }

                this.expenseManager.handleImportExel(ctx,moneyChi, moneyThu, category, description)
              //  console.log({id, userId, moneyChi, moneyThu, expenseType, category, description, date});
            });

            if (errors.length > 0) {
                return ctx.reply(`Có lỗi xảy ra trong file:\n${errors.join("\n")}`);
            }
             ctx.reply("Dữ liệu trong file đã được xử lý thành công!");
            //console.log((this.waitingForInput))
           // delete this.waitingForInput[userId];
        } catch (err) {
            console.error(err);
            ctx.reply("lỗi khi xử lý import dữ liệu")
        }
    }

}

module.exports = Document_Handle;