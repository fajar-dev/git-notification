import axios from "axios";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
    GOOGLE_CHAT_WEBHOOK,
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_ID,
} from "./config";

// Returns week range as WIB strings (YYYY-MM-DD HH:MM) for string comparison
// against timestamps already stored in WIB format
function getJakartaWeekRange(): { start: string; end: string; label: string } {
    const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowJakarta = new Date(Date.now() + JAKARTA_OFFSET_MS);

    const day = nowJakarta.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysFromMonday = day === 0 ? 6 : day - 1;

    const monday = new Date(nowJakarta.getTime() - daysFromMonday * 86400000);
    monday.setUTCHours(0, 1, 0, 0);

    const saturday = new Date(monday.getTime() + 5 * 86400000);
    saturday.setUTCHours(23, 59, 0, 0);

    const fmt = (d: Date) => d.toISOString().replace("T", " ").substring(0, 16);

    return {
        start: fmt(monday),
        end:   fmt(saturday),
        label: `${fmt(monday)} s/d ${fmt(saturday)} WIB`,
    };
}

async function postCard(card: object): Promise<void> {
    const url = GOOGLE_CHAT_WEBHOOK || "";
    if (!url) {
        console.warn("GOOGLE_CHAT_WEBHOOK tidak dikonfigurasi, skip kirim summary.");
        return;
    }
    await axios.post(
        url,
        { cardsV2: [{ cardId: `summary-${Date.now()}`, card }] },
        { headers: { "Content-Type": "application/json; charset=UTF-8" } }
    );
}

async function sendSheetSummaryCard(
    repoName: string,
    rows: any[],
    period: { start: string; end: string; label: string }
): Promise<void> {
    const total    = rows.length;
    const authorCount: Record<string, number> = {};
    for (const r of rows) {
        const author = r.get("Author") || "";
        if (author) authorCount[author] = (authorCount[author] || 0) + 1;
    }
    const leaderboard = Object.entries(authorCount)
        .sort((a, b) => b[1] - a[1]);

    const previewRows = rows.slice(0, 10);
    const hasMore     = total > 10;

    const commitWidgets = previewRows.map(r => {
        const id        = (r.get("Commit ID") || "").substring(0, 7);
        const msg       = (r.get("Message") || "").split("\n")[0].substring(0, 70);
        const author    = r.get("Author") || "";
        const branch    = r.get("Branch") || "";
        const url       = r.get("URL") || "";
        const timestamp = r.get("Timestamp") || "";
        return {
            decoratedText: {
                text:        `<code>${id}</code>  <b>[${branch}]</b> ${msg}`,
                bottomLabel: `${author}  •  ${timestamp}`,
                ...(url && {
                    button: {
                        text:    "View Commit",
                        onClick: { openLink: { url } },
                    },
                }),
            },
        };
    });

    const card = {
        header: {
            title:    `Weekly Summary: ${repoName}`,
            subtitle: period.label,
            imageUrl: "https://fonts.gstatic.com/s/i/googlematerialicons/summarize/v7/24px.svg",
            imageType: "SQUARE",
        },
        sections: [
            {
                header: "Statistik",
                widgets: [
                    {
                        decoratedText: {
                            topLabel: "Total Commit",
                            text:     `<b>${total}</b>`,
                            startIcon: { knownIcon: "DESCRIPTION" },
                        },
                    },
                    ...leaderboard.map(([author, count], i) => ({
                        decoratedText: {
                            topLabel:  i === 0 ? "Leaderboard Author" : "",
                            text:      `${i + 1}. <b>${author}</b>`,
                            bottomLabel: `${count} commit`,
                            startIcon: { knownIcon: "PERSON" },
                        },
                    })),
                ],
            },
            {
                header:                  hasMore ? `Commit (10 dari ${total})` : `Commit (${total})`,
                collapsible:             true,
                uncollapsibleWidgetsCount: 2,
                widgets:                 commitWidgets,
            },
        ],
    };

    await postCard(card);
}

export async function sendWeeklySummary(): Promise<void> {
    const period = getJakartaWeekRange();
    console.log(`Menjalankan weekly summary untuk periode: ${period.label}`);

    const auth = new JWT({
        email: GOOGLE_CLIENT_EMAIL,
        key:   GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    const sheets = doc.sheetsByIndex;

    for (const sheet of sheets) {
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        const filtered = rows.filter(row => {
            const ts = row.get("Timestamp") || "";
            return ts >= period.start && ts <= period.end;
        });

        if (filtered.length === 0) {
            console.log(`Sheet "${sheet.title}": tidak ada commit pada periode ini, skip.`);
            continue;
        }

        console.log(`Sheet "${sheet.title}": ${filtered.length} commit(s), mengirim summary ke Google Chat...`);
        await sendSheetSummaryCard(sheet.title, filtered, period);
    }

    console.log("Weekly summary selesai.");
}
