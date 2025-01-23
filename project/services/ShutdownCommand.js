
class ShutdownService {
    // constructor(methods) {
    //   this.methods = methods;
    // }
    method(command){
      const { exec } = require("child_process");
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) return reject(error);
          resolve(stdout || stderr);
        });
      });
    }
    async execute(ctx) {
      try {
        
        await this.method("shutdown /s /f /t 5");
        await ctx.reply("Tắt nguồn thành công.");
      } catch (error) {
        await ctx.reply(`Lỗi khi tắt nguồn: ${error.message}`);
      }
    }
  }
  
  module.exports = ShutdownService;
  