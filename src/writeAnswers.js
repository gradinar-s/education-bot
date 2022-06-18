const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = JSON.parse(process.env.GOOGLE_API_CREDS);

class WriteAnswers {
  async googleSheets(data) {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    sheet.addRows(
      [
        {
          test: 123,
        },
      ],
      { insert: true }
    );
  }
}

const writeAnswers = new WriteAnswers();
module.exports = writeAnswers;
