const { Telegraf } = require("telegraf");

const AllCommand = require("./project/commands/AllCommand");
const checkSpam = require("./project/midleware/CheckSpam")
const redisClient = require('./project/config/core/redisClient')


class Bot {
  constructor(apiKey) {
    this.bot = new Telegraf(apiKey);
    this.waitingForInput = new redisClient()
    this.stateBudget = new redisClient()
   // this.methods = new CommandExecutor();
  }
  registerMiddlewares() {
    this.bot.use(checkSpam);
  }
   commandMenu(){

      this.bot.command("account", async (ctx) => {
        let userId = String(ctx.from.id)
        await  this.stateBudget.delete(`bg_${userId}`)
       await this.waitingForInput.delete(userId)
        ctx.reply("Menu:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Đăng ký", callback_data: "register" }],
              [{ text: "Xóa tài khoản", callback_data: "delete_account" }],
            ],
          },
        });
      });
      this.bot.command("start", async (ctx) => {
        let userId = String(ctx.from.id)
        await  this.stateBudget.delete(`bg_${userId}`)
        await this.waitingForInput.delete(userId)
        ctx.reply("Menu:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "thu/chi", callback_data: "thu_chi" }],
              [{ text: "báo cáo", callback_data: "report" }],
              [{ text: "help", callback_data: "help" }],
            ],
          },
        });
      });
  
  }
  registerCommands() {

      const allCommand = new AllCommand(this.bot, this.waitingForInput,this.stateBudget );
      this.commandMenu()
      allCommand.register();

  }
  registerErrorHandler() {
    this.bot.catch((err, ctx) => {
      console.error(`Lỗi xảy ra trong quá trình xử lý:`, err);
      try {
        ctx.reply("Có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.");
      } catch (replyErr) {
        console.error("Không thể trả lời người dùng:", replyErr);
      }
    });
  }
  start() {
    this.registerMiddlewares()
    this.registerCommands();
    this.registerErrorHandler();
    this.bot.launch();
    
    console.log("Bot đã khởi chạy!");
  }
}

module.exports = Bot;
