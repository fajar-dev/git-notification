import axios from "axios";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
    GOOGLE_CHAT_WEBHOOK,
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_ID,
} from "./config";

// Runner dijalankan setiap Minggu pukul 08:00.
// Mengembalikan range minggu sebelumnya: Minggu 00:01 s/d Sabtu 23:59 (WIB).
// Contoh: runner jalan Minggu 3 Mei 2026 → range 26 Apr 00:01 s/d 2 Mei 23:59.
function getJakartaWeekRange(): { start: string; end: string; label: string } {
    const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowJakarta = new Date(Date.now() + JAKARTA_OFFSET_MS);

    // Minggu lalu = hari ini (Minggu) dikurangi 7 hari
    const prevSunday = new Date(nowJakarta.getTime() - 7 * 86400000);
    prevSunday.setUTCHours(0, 1, 0, 0);

    // Sabtu kemarin = hari ini dikurangi 1 hari
    const prevSaturday = new Date(nowJakarta.getTime() - 1 * 86400000);
    prevSaturday.setUTCHours(23, 59, 0, 0);

    const fmt = (d: Date) => d.toISOString().replace("T", " ").substring(0, 16);

    return {
        start: fmt(prevSunday),
        end:   fmt(prevSaturday),
        label: `${fmt(prevSunday)} s/d ${fmt(prevSaturday)} WIB`,
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
            imageUrl: "https://git-scm.com/images/logos/downloads/Git-Icon-1788C.svg",
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
