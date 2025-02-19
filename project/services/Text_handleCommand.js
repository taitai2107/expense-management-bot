const { getUserId } = require('../utils/Utils');
class TextHandler {
  constructor(expenseManager,waitingForInput , reportManager,stateBudget) {
    this.expenseManager = expenseManager;
    this.waitingForInput = waitingForInput
    this.reportManager = reportManager;


  }
 // columnMappingBudget = {
 //   budget_an_uong:"Ăn uống",
 //   budget_giai_tri:"Giải trí",
 //   budget_di_lai:"Đi Lại",
 //   budget_khac:"Khác",
 //   budget_total:"Tổng"
 //  }

  async handleTextBudget(ctx) {
    const userId = String(ctx.from.id);

    const { success, userId: uid } = await getUserId(userId);
    if (!success) {
      return ctx.reply("Tài khoản không tồn tại.");
    }

    const userState = await this.waitingForInput.get(userId);
    if (!userState || userState.action !== "set_budget") {
      return ctx.reply("Vui lòng chọn một hành động từ menu trước khi nhập thông tin.");
    }

    const value = Number(ctx.message.text.trim());
    if (isNaN(value) || value <= 0) {
      return ctx.reply("Input không hợp lệ, vui lòng nhập số lớn hơn 0");
    }

    let now = new Date();
    let month = now.getMonth() + 1;
    let nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    let ttl = Math.floor((nextMonth - now) / 1000);

    let rawData = await this.waitingForInput.get(`bg_${userId}`);
    let budgetObj;
    if (rawData) {
      try {
        budgetObj = JSON.parse(rawData);
      } catch (err) {
        console.error("Lỗi parse JSON:", err);
        budgetObj = null;
      }
    }

    if (!budgetObj || budgetObj.month !== month) {
      budgetObj = { uid: uid, month: month, budgets: {} };
    }

    const category = userState.category;

    budgetObj.budgets[category] = (budgetObj.budgets[category] || 0) + value;


    await this.waitingForInput.set(`bg_${userId}`, JSON.stringify(budgetObj), ttl);
    await this.waitingForInput.delete(userId);
    ctx.reply(`✅ Set thành công ngân sách cho ${category}: ${value}`);
  }
  async handleTextReport(ctx) {
    const  userId = String(ctx.from.id);
    const userState = await  this.waitingForInput.get(userId);

    if (!userState || userState.action !== "enter_report_month") {
      return ctx.reply("Vui lòng chọn một hành động từ menu trước khi nhập thông tin.");
    }

    const month = Number(ctx.message.text.trim());
    if (isNaN(month) || month < 1 || month > 12) {
      return ctx.reply("Tháng không hợp lệ. Vui lòng nhập một số từ 1 đến 12.");
    }

    await this.reportManager.MonthReport(ctx, month);
    await  this.waitingForInput.delete(userId)

  }

  async handleTextDReport(ctx) {
    const  userId = String(ctx.from.id);
    const userState = await  this.waitingForInput.get(userId);

    if (!userState || userState.action !== "del_report") {
      return ctx.reply("Vui lòng chọn một hành động từ menu trước khi nhập thông tin.");
    }

    const id = Number(ctx.message.text.trim());
    if (isNaN(id)) {
      return ctx.reply("input không phải là số, không hợp lệ");
    }

    await this.reportManager.DelReport(ctx, id);
    await  this.waitingForInput.delete(userId)
  }

  async handleTextExpense(ctx) {
    console.log('code chạy vào đây')
    const  userId = String(ctx.from.id);
    const userState = await  this.waitingForInput.get(userId);

    if (!userState || userState.action !== "enter_description") {
      return ctx.reply("Vui lòng chọn một hành động từ menu trước khi nhập thông tin.");
    }

    const match = ctx.message.text.trim().match(/^([+-]\d+)\s+(.+)$/);
    if (!match) {
      return ctx.reply("Vui lòng nhập đúng định dạng: số tiền (bắt đầu bằng + hoặc -) và mô tả.");
    }

    const [_, money, description] = match;
    if (description.length < 3) {
      return ctx.reply("Mô tả phải có ít nhất 3 ký tự. Vui lòng nhập lại.");
    }

    await this.expenseManager.handleCategorySelection(ctx, description, parseInt(money), userState.category);
  await  this.waitingForInput.delete(userId)
  }
}

module.exports = TextHandler;
