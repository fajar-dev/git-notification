import { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } from "./config";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from 'google-spreadsheet'

const HEADERS = [
    'Commit ID',
    'Timestamp',
    'Message',
    'Author',
    'Branch',
    'URL',
]

export interface CommitLog {
    commitId: string
    timestamp: string
    message: string
    author: string
    branch: string
    url: string
}

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

    private static sanitizeSheetName(name: string): string {
        // Google Sheets tab name cannot contain: \ / ? * [ ]
        return name.replace(/[\\?*[\]]/g, '').replace(/\//g, '.').substring(0, 100)
    }

    private static async getOrCreateSheet(repoName: string) {
        await this.doc.loadInfo()
        const sheetName = this.sanitizeSheetName(repoName)

        let sheet = this.doc.sheetsByTitle[sheetName]
        if (!sheet) {
            sheet = await this.doc.addSheet({ title: sheetName, headerValues: HEADERS })
        }
        return sheet
    }

    static async logCommits(repoName: string, commits: CommitLog[]): Promise<void> {
        try {
            if (commits.length === 0) return

            const sheet = await this.getOrCreateSheet(repoName)
            const rows = await sheet.getRows()
            const existingIds = new Set(rows.map(row => row.get('Commit ID')))

            const requiredFields: (keyof CommitLog)[] = ['commitId', 'timestamp', 'message', 'author', 'branch', 'url']

            const newRows = commits
                .filter(c => requiredFields.every(f => c[f]?.trim()))
                .filter(c => !existingIds.has(c.commitId))
                .map(c => ({
                    'Commit ID': c.commitId,
                    'Timestamp': c.timestamp,
                    'Message':   c.message,
                    'Author':    c.author,
                    'Branch':    c.branch,
                    'URL':       c.url,
                }))

            if (newRows.length > 0) {
                await sheet.addRows(newRows)
                console.log(`Logged ${newRows.length} commit(s) to sheet "${repoName}"`)
            } else {
                console.log(`All commits already exist in sheet "${repoName}", skipped`)
            }
        } catch (error: any) {
            console.error("Error logging commits to sheet:", error?.response?.data || error)
        }
    }

    static async write(rows: Record<string, any>[]): Promise<boolean> {
        try {
            await this.doc.loadInfo()
            const sheet = this.doc.sheetsByIndex[0]
            await sheet.addRows(rows)
            return true
        } catch (error: any) {
            console.error("Error writing to sheet:", error?.response?.data || error)
            return false
        }
    }
}
