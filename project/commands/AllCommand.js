const BaseCommand = require("./BaseCommand");
const AccountManager = require("../services/Account_ManagerCommand");
const ExpenseManager = require("../services/Expenses_ManagerCommand");
const TextHandler = require("../services/Text_handleCommand");
const ReportManager = require("../services/Report_ManagerCommand");

class AllCommand extends BaseCommand {
  constructor(bot, waitingForInput) {
    super(bot, waitingForInput);
    this.account = new AccountManager();
    this.expenseManager = new ExpenseManager();
    this.reportManager = new ReportManager();
    this.waitingForInput = waitingForInput;
    this.handleText = new TextHandler(
      this.expenseManager,
      this.waitingForInput,
      this.reportManager
    );
    this.actions = {};
    const categories = [
      'category_di_lai',
      'category_an_uong',
      'category_giai_tri',
      'category_khac',
      "category_luong"
    ];
    
    this.actions = {
      // Account actions
      register: this.handleRegister.bind(this),
      delete_account: this.createMiddleware(this.handleDeleteAccount.bind(this)),
      yes_delete: this.createMiddleware(this.handleYesDelete.bind(this), { check_user_id: false }),
      no_delete: this.createMiddleware(this.handleNoDelete.bind(this)),

      // Expense actions
      thu_chi: this.createMiddleware(this.handleTransactionMenu.bind(this), { clearState: true }),
      import_exel:this.createMiddleware(this.handleImportExelReport.bind(this)),
      
      // Report actions
      report: this.createMiddleware(this.handleReportMenu.bind(this)),
      get_all_report: this.createMiddleware(this.handleGetAllRP.bind(this), { clearState: true }),
      month_report: this.createMiddleware(this.handleMonthSelection.bind(this)),
      del_report_id: this.createMiddleware(this.handleDelRPSelection.bind(this)),
      export_exel_report:this.createMiddleware(this.handleExportReport.bind(this)),
      report_by_category:this.createMiddleware(this.handleRpByCategoryMenu.bind(this), { clearState: true }),
      //category_di_lai_rp: this.createMiddleware(this.handleCategoryReportSelection.bind(this)),
      
      help:this.createMiddleware(this.handleHelp.bind(this)),
      default: this.handleInvalidChoice.bind(this),
    };
    //category_luong: this.createMiddleware(this.handleCategorySelection.bind(this)),
    categories.forEach(category => {
      this.actions[category] = this.createMiddleware(this.handleCategorySelection.bind(this));
    });
    categories.forEach(category => {
      this.actions[category + '_rp'] = this.createMiddleware(this.handleCategoryReportSelection.bind(this));
    });
  }
  

  createMiddleware(action, options = { clearState: false, check_user_id: true }) {
    return async (ctx) => {
      const userId = ctx.from.id;

      try {
        if (options.check_user_id) {
          const accountExists = await this.account.checkIfAccountExists(userId);

          if (!accountExists) {
            return ctx.reply("Tài khoản không tồn tại. Vui lòng đăng ký trước.");
          }
        }
        await action(ctx);
        if (options.clearState) {
          delete this.waitingForInput[userId];
        }
      } catch (error) {
        console.error(`Error in middleware for user ${userId}:`, error);
        ctx.reply("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    };
  }

  async handleCallback(ctx) {
    if (!ctx.callbackQuery?.data) {
      console.error("CallbackQuery hoặc dữ liệu không tồn tại");
      return await ctx.reply("Không thể xử lý yêu cầu. Vui lòng thử lại.");
    }

    const action = this.actions[ctx.callbackQuery.data] || this.actions.default;
    await action(ctx);
    await ctx.answerCbQuery();
  }

  handleHelp(ctx) {
    const message =
        "🌟 *Bot Telegram - Quản Lý Chi Tiêu* 🌟\n\n" +
        "Chào mừng bạn đến với bot giúp bạn quản lý chi tiêu hiệu quả.\n\n" +
        "💡 *Hướng dẫn sử dụng:*\n" +
        "- Gõ lệnh `/account` để đăng ký tài khoản.\n" +
        "- *Lưu ý:* Khi bạn bấm xóa tài khoản và xác nhận, *tất cả dữ liệu thu/chi* của bạn sẽ bị xóa vĩnh viễn.\n\n" +
        "⚙️ *Tính năng chính:*\n" +
        "Hiện tại, bot hỗ trợ các chức năng quản lý chi tiêu cơ bản và đang trong quá trình phát triển thêm nhiều tính năng hữu ích.\n\n" +
        "📩 *Liên hệ góp ý:*\n" +
        "Mọi ý kiến đóng góp xin vui lòng gửi về email: *tainguyencongkhanh@gmail.com*.\n\n" +
        " Xin chân thành cảm ơn!";
    ctx.reply(message)
  }
  handleImportExelReport(ctx) {
    const userId = ctx.from.id;
    this.waitingForInput[userId] = 'waiting_for_excel';
    ctx.reply('Hãy gửi file Excel (.xlsx) để import dữ liệu.');
  }
  async handleRegister(ctx) {
    const full_name = `${ctx.from.first_name || "null"} ${ctx.from.last_name || "null"}`;
    const user_id = ctx.from.id;
    console.log("Người dùng đã gõ /đăng ký:", ctx.from);
    await this.account.createAccount(full_name, user_id, ctx);
  }

  async handleDeleteAccount(ctx) {
    await this.account.askForConfirmation(ctx);
  }

  async handleYesDelete(ctx) {
    const user_id = ctx.from.id;
    await this.account.deleteAccount(user_id, ctx);
  }

  async handleNoDelete(ctx) {
    await ctx.reply("Bạn đã hủy bỏ yêu cầu xóa tài khoản.");
  }

  async handleCategorySelection(ctx) {
    const userId = ctx.from.id;
    this.waitingForInput[userId] = { action: "enter_description", category: ctx.callbackQuery.data };
    await ctx.reply("Hãy nhập mô tả thu chi:");
  }

  async handleCategoryReportSelection(ctx) {
    //const userId = ctx.from.id;
    this.reportManager.ReportByCateGory(ctx,ctx.callbackQuery.data)
 
  }

  async handleExportReport(ctx){
    await this.reportManager.Exports(ctx)
  }
  async handleMonthSelection(ctx) {
    const userId = ctx.from.id;
    //   console.log('userid',userId)
    // console.log('log',Object.keys(this.waitingForInput[userId]),this.waitingForInput[userId] = { action: "enter_report_month" })
    this.waitingForInput[userId] = { action: "enter_report_month" };
    await ctx.reply("Hãy nhập tháng cần xem chi tiêu (1-12):");
  }

  async handleDelRPSelection(ctx) {
    const userId = ctx.from.id;
    //   console.log('userid',userId)
    // console.log('log',Object.keys(this.waitingForInput[userId]),this.waitingForInput[userId] = { action: "enter_report_month" })
    this.waitingForInput[userId] = { action: "del_report" };
    await ctx.reply("Hãy nhập id giao dịch cần xóa:");
  }

  async handleInvalidChoice(ctx) {
    await ctx.reply("Lựa chọn không hợp lệ.");
  }

  async handleGetAllRP(ctx) {
    const telegramId = ctx.from.id;
    await this.reportManager.GetAll(ctx, telegramId);
  }

  async handleReportMenu(ctx) {
    await this.reportManager.processTransaction(ctx);
  }

  async handleTransactionMenu(ctx) {
    await this.expenseManager.processTransaction(ctx);
  }
  async handleRpByCategoryMenu(ctx) {
    await this.reportManager.processReportByCategory(ctx);
  }

  register() {
    this.bot.on("callback_query", async (ctx) => {
      await this.handleCallback(ctx);
    });

    this.bot.on("text", async (ctx) => {
      const userId = ctx.from.id;
      const userState = this.waitingForInput[userId];

      if (userState) {
        if (userState.action === "enter_report_month") {
          await this.handleText.handleTextReport(ctx);
        } else if (userState.action === "enter_description") {
          await this.handleText.handleTextExpense(ctx);
        }
        else if (userState.action === "del_report") {
          await this.handleText.handleTextDReport(ctx);
        }
      } else {
        await ctx.reply("Lỗi cú pháp.Chọn một hành động từ menu trước khi nhập thông tin.");
      }
    });
    this.bot.on("document", async (ctx) => {
      const fileId = ctx.message.document.file_id;
      const fileName = ctx.message.document.file_name;
      if (this.waitingForInput[ctx.from.id] !== 'waiting_for_excel') {
        return ctx.reply('Bạn cần click nút import trước khi gửi file Excel.');
      }
      if (!fileName.endsWith('.xlsx')) {
        return ctx.reply('Vui lòng gửi file Excel (.xlsx).');
      }


    })
  }
}

module.exports = AllCommand;
