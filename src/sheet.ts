import { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } from "./config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from 'google-spreadsheet'

export class Spreadsheet {
    private static readonly sheetId     = GOOGLE_SHEET_ID
    private static readonly clientEmail = GOOGLE_CLIENT_EMAIL
    private static readonly privateKey  = GOOGLE_PRIVATE_KEY

    private static readonly auth: JWT = new JWT({
        email: Spreadsheet.clientEmail,
        key: Spreadsheet.privateKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    private static readonly doc: GoogleSpreadsheet = new GoogleSpreadsheet(
        Spreadsheet.sheetId,
        Spreadsheet.auth
    )
}