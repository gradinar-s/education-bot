const fs = require("fs");
require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const constants = require("./constants");
const writeAnswers = require("./writeAnswers");
const educationStructure = require("./educationStructure");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(new LocalSession({ database: "session.json" }).middleware());

bot.start((ctx) => {
  ctx.session.current_step = constants.steps.NICKNAME;
  ctx.session.userData = { id: ctx.message.from.id };

  return ctx.reply("Введи свой ник на платформе");
});

const renderButtons = (buttons) => {
  return Markup.inlineKeyboard(
    buttons.map((button) => {
      return [Markup.button.callback(button.title, button.id)];
    })
  );
};

bot.command(constants.commands.POST, async (ctx) => {
  if (ctx.session.current_step === constants.steps.PENDING) {
    ctx.session.current_step = constants.steps.BLOCK_SELECTION;
    return ctx.reply("Выбери блок", renderButtons(educationStructure));
  }
});

bot.on("message", async (ctx) => {
  if (ctx.session.current_step === constants.steps.NICKNAME) {
    if (ctx.session.userData?.platform_username === ctx.update.message.text) {
      ctx.session.current_step = constants.steps.BLOCK_SELECTION;
      return ctx.reply(
        "Отлично, ты уже зарегистрирован. Выбери блок",
        renderButtons(educationStructure)
      );
    }

    ctx.session.userData.platform_username = ctx.update.message.text;
    ctx.session.current_step = constants.steps.PENDING;

    writeAnswers.writeUserName(ctx.session.userData);
    return ctx.reply("Ок, когда захочешь сделать задание введи комманду /post");
  }

  if (ctx.session.current_step === constants.steps.SENDING_HOMEWORK) {
    ctx.session.current_step = constants.steps.PENDING;
    ctx.session.userData.homework = ctx.update.message.text;

    const isError = await writeAnswers.writeHomework(ctx.session.userData);

    if (isError) {
      return ctx.reply("По выбранному уроку ДЗ уже отправлено");
    } else {
      return ctx.reply(
        "Записал твой ответ, спасибо. Старые кнопки уже не активны, что-бы отправить дз для другого уровня введи команду /post ещё раз"
      );
    }
  }
});

const onClickButton = (id) => {
  bot.action(id, async (ctx) => {
    await ctx.answerCbQuery();

    try {
      if (ctx.session.current_step === constants.steps.BLOCK_SELECTION) {
        const selected_block = educationStructure.find((block) => block.id === id);

        ctx.session.current_step = constants.steps.LESSON_SELECTION;
        ctx.session.userData.selected_block = id;

        return ctx.reply(
          `Выбери урок из блока "${selected_block.title}"`,
          renderButtons(selected_block.lessons)
        );
      }

      if (ctx.session.current_step === constants.steps.LESSON_SELECTION) {
        ctx.session.current_step = constants.steps.SENDING_HOMEWORK;
        ctx.session.userData.selected_lesson = id;

        return ctx.reply(`Хорошо, введи ссылку на выполненое ДЗ (selected: ${id})`);
      }
    } catch (error) {
      // ...
    }
  });
};

// Handle click of block selection
educationStructure.forEach((block) => onClickButton(block.id));

// Handle click of lesson selection
educationStructure.forEach((block) => block.lessons.forEach((lesson) => onClickButton(lesson.id)));

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
