const fs = require("fs");
const { Telegraf } = require("telegraf");
const LocalSession = require("telegraf-session-local");
require("dotenv").config();
const writeAnswers = require("./writeAnswers");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(new LocalSession({ database: "session.json" }).middleware());

bot.start((ctx) => {
  ctx.reply("Введи свой ник на платформе");
});

bot.on("message", (ctx) => {
  ctx.session.userData = {
    name_in_platform: ctx.update.message.text,
  };

  writeAnswers.googleSheets(ctx.session.userData);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
