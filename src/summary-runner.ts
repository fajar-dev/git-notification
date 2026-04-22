import { sendWeeklySummary } from "./summary";

sendWeeklySummary().catch(err => {
    console.error("Gagal mengirim weekly summary:", err);
    process.exit(1);
});
