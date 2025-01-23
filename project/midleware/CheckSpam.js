const userActivity = new Map();
let spam_mess = process.env.time_reset || 10;
let time_re = process.env.total_mess || 7000;
const checkSpam = async (ctx, next) => {

  const user_id = ctx.from.id;
  //console.log(spam_mess, time_re,user_id);
  const date_now = Date.now();

  if (!userActivity.has(user_id)) {

    userActivity.set(user_id, { mesCount: 1, lastMessTime: date_now });
  } else {
    let user_data = userActivity.get(user_id);
    let time_dif = date_now - user_data.lastMessTime;

    // console.log(user_data);
    //
    if (time_dif > time_re) {

      userActivity.set(user_id, { mesCount: 1, lastMessTime: date_now });
    } else {

      user_data.mesCount += 1;
      user_data.lastMessTime = date_now;

      console.log('checkusserr', user_data);

      if (user_data.mesCount > spam_mess) {
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery("Bạn đang thao tác quá nhanh!.", { show_alert: true });
        } else {
          await ctx.reply("Bạn đang spam quá nhiều!.");
        }
        return;
      }

      userActivity.set(user_id, user_data);
    }
  }

  await next();
};

module.exports = checkSpam;
