const BaseCommand = require("./BaseCommand");
const AccountManager = require("../services/Account_ManagerCommand");
const ExpenseManager = require("../services/Expenses_ManagerCommand");
const TextHandler = require("../services/Text_handleCommand");
const ReportManager = require("../services/Report_ManagerCommand");
const Document_Handle = require("../services/Document_Handle");
const {CALLBACK_KEYS, categories, typeBudget} = require("../utils/Const");

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
            this.reportManager,
        );

        this.documentHandle = new Document_Handle(this.expenseManager);
        this.actions = {};


        this.actions = {
            // Account actions
            [CALLBACK_KEYS.ACCOUNT_REGISTER]: this.handleRegister.bind(this),
            [CALLBACK_KEYS.ACCOUNT_DELETE]: this.createMiddleware(this.handleDeleteAccount.bind(this)),
            [CALLBACK_KEYS.YES_DELETE]: this.createMiddleware(this.handleYesDelete.bind(this), {check_user_id: false}),
            [CALLBACK_KEYS.NO_DELETE]: this.createMiddleware(this.handleNoDelete.bind(this)),

            // Expense actions
            [CALLBACK_KEYS.TRANSACTION_MENU]: this.createMiddleware(this.handleTransactionMenu.bind(this), {clearState: true}),
            [CALLBACK_KEYS.IMPORT_EXCEL]: this.createMiddleware(this.handleImportExelReport.bind(this)),
            [CALLBACK_KEYS.SET_BUDGET]: this.createMiddleware(this.handleBudgetMenu.bind(this), {clearState: true}),

            // Report actions
            [CALLBACK_KEYS.REPORT_MENU]: this.createMiddleware(this.handleReportMenu.bind(this)),
            [CALLBACK_KEYS.GET_ALL_REPORT]: this.createMiddleware(this.handleGetAllRP.bind(this), {clearState: true}),
            [CALLBACK_KEYS.MONTH_REPORT]: this.createMiddleware(this.handleMonthSelection.bind(this)),
            [CALLBACK_KEYS.DEL_RP_BY_ID]: this.createMiddleware(this.handleDelRPSelection.bind(this)),
            [CALLBACK_KEYS.EXPORT_EXCEL]: this.createMiddleware(this.handleExportReport.bind(this)),
            [CALLBACK_KEYS.REPORT_BY_CATEGORY]: this.createMiddleware(this.handleRpByCategoryMenu.bind(this), {clearState: true}),
            //category_di_lai_rp: this.createMiddleware(this.handleCategoryReportSelection.bind(this)),

            [CALLBACK_KEYS.HELP]: this.createMiddleware(this.handleHelp.bind(this)),
            [CALLBACK_KEYS.DEFAULT]: this.handleInvalidChoice.bind(this),
        };
        //category_luong: this.createMiddleware(this.handleCategorySelection.bind(this)),
        categories.forEach(category => {
            this.actions[category] = this.createMiddleware(this.handleCategorySelection.bind(this));
        });
        categories.forEach(category => {
            this.actions[category + '_rp'] = this.createMiddleware(this.handleCategoryReportSelection.bind(this));
        });
        typeBudget.forEach(type => {
            this.actions[type] = this.createMiddleware(this.handleSetBudgetSelection.bind(this));
        })
    }


    createMiddleware(action, options = {clearState: false, check_user_id: true}) {
        return async (ctx) => {
            const userId = String(ctx.from.id);
            try {
                if (options.check_user_id) {
                    const accountExists = await this.account.checkIfAccountExists(userId);
                    if (!accountExists) {
                        return ctx.reply("Tài khoản không tồn tại. Vui lòng đăng ký trước.");
                    }
                }
                await action(ctx);
                if (options.clearState) {
                    await this.waitingForInput.delete(userId)

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

    async handleImportExelReport(ctx) {
        const userId = String(ctx.from.id);
        await this.waitingForInput.set(userId, 'waiting_for_excel', 999)
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
        const userId = String(ctx.from.id);
        await this.waitingForInput.set(userId, {action: "enter_description", category: ctx.callbackQuery.data}, 999)
        await ctx.reply("Hãy nhập mô tả thu chi:");
    }

    async handleSetBudgetSelection(ctx) {
        const userId = String(ctx.from.id);
        const category = ctx.callbackQuery.data;
        await this.waitingForInput.set(userId, {action: "set_budget", category: category, budget: null},999)
        ctx.reply(`nhập số tiền muốn giới hạn chi tiêu ${category}: `)

    }

    async handleCategoryReportSelection(ctx) {
        this.reportManager.ReportByCateGory(ctx, ctx.callbackQuery.data)

    }

    async handleExportReport(ctx) {
        await this.reportManager.Exports(ctx)
    }

    async handleMonthSelection(ctx) {
        const userId = String(ctx.from.id);
        await this.waitingForInput.set(userId, {action: "enter_report_month"}, 60 * 24 * 365)
        await ctx.reply("Hãy nhập tháng cần xem chi tiêu (1-12):");
    }

    async handleDelRPSelection(ctx) {
        const userId = String(ctx.from.id);

        await this.waitingForInput.set(userId, {action: "del_report"}, 999)
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

    async handleBudgetMenu(ctx) {
        await this.expenseManager.processSetBudgetTransaction(ctx);
    }

    async handleRpByCategoryMenu(ctx) {
        await this.reportManager.processReportByCategory(ctx);
    }

    register() {
        this.bot.on("callback_query", async (ctx) => {
            await this.handleCallback(ctx);
        });

        this.bot.on("text", async (ctx) => {
            const userId = String(ctx.from.id);
            const userState = await this.waitingForInput.get(userId)
            if (userState) {
                if (userState.action === "set_budget") {
                    console.log('têttetet')
                    await this.handleText.handleTextBudget(ctx);
                }
                 if (userState.action === "enter_report_month") {
                    await this.handleText.handleTextReport(ctx);
                } else if (userState.action === "enter_description") {
                    await this.handleText.handleTextExpense(ctx);
                } else if (userState.action === "del_report") {
                    await this.handleText.handleTextDReport(ctx);
                }

            } else {
                await ctx.reply("Lỗi cú pháp.Chọn một hành động từ menu trước khi nhập thông tin.");
            }
        });
        this.bot.on("document", async (ctx) => {
            const userId = String(ctx.from.id);
            const state = await this.waitingForInput.get(userId);
            if (state === 'waiting_for_excel') {
                await this.documentHandle.handleDocumentExelImport(ctx);
                await this.waitingForInput.delete(userId);
            } else {
                return ctx.reply('Bạn cần chọn một hành động từ menu trước khi gửi file.');
            }
        });
    }
}

// có hạn chế khi tắt sv bị xóa hết state(refactor lại lưu state trên services redis)
module.exports = AllCommand;
