const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = JSON.parse(process.env.GOOGLE_API_CREDS);

class WriteAnswers {
  constructor() {
    this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  }

  async writeUserName(data) {
    await this.doc.useServiceAccountAuth(creds);
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[0];

    sheet.addRows([{ platform_username: "" }, { platform_username: data.platform_username }], {
      insert: true,
    });
  }

  async writeHomework(data) {
    await this.doc.useServiceAccountAuth(creds);
    await this.doc.loadInfo();

    const sheet = this.doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    let isError = false;

    rows.map(async (el) => {
      if (el.platform_username !== undefined && el.platform_username === data.platform_username) {
        const row = data.selected_block + "_" + data.selected_lesson;

        if (!el[row]) {
          // if value in a cell alredy exist
          el[row] = data.homework;
          await el.save();
        } else {
          isError = true;
        }
      }
    });

    return isError;
  }
}

const writeAnswers = new WriteAnswers();
module.exports = writeAnswers;
