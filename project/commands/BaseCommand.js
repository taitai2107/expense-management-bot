class BaseCommand {
    constructor(bot) {
      this.bot = bot;
      //this.methods = methods;
    }
  
    register() {
      throw new Error("overrider");
    }
  }
  
  module.exports = BaseCommand;
  