const { Telegraf } = require("telegraf");
//const ShutdownCommand = require("./project/commands/AllCommand");
const AllCommand = require("./project/commands/AllCommand");
const checkSpam = require("./project/midleware/CheckSpam")


//const CommandExecutor = require("./project/services/CommandExcutor");


class Bot {
  constructor(apiKey) {
    this.bot = new Telegraf(apiKey);
    this.waitingForInput = {
      // action: "action_name",
      // category: "category_name", 
    };
   // this.methods = new CommandExecutor();
  }
  registerMiddlewares() {
    this.bot.use(checkSpam);
  }
  commandMenu(){
    
    this.bot.command("account", (ctx) => {
      //  console.log("Người dùng đã gõ /đăng ký:", ctx.from);
      delete this.waitingForInput[ctx.from.id];
        ctx.reply("Menu:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Đăng ký", callback_data: "register" }],
              [{ text: "Xóa tài khoản", callback_data: "delete_account" }],
            ],
          },
        });
      });
      this.bot.command("start", (ctx) => {
        //console.log("Người dùng đã gõ /start:", ctx.from);
        delete this.waitingForInput[ctx.from.id];
        ctx.reply("Menu:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "thu/chi", callback_data: "thu_chi" }],
              [{ text: "báo cáo", callback_data: "report" }],
            ],
          },
        });
      });
  
  }
  registerCommands() {

      const allCommand = new AllCommand(this.bot, this.waitingForInput = {
       
      });
      this.commandMenu()
      allCommand.register();
    
    // commands.forEach((command) => command.register());


   
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
