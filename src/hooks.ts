import axios, { AxiosInstance } from "axios";
import { GOOGLE_CHAT_WEBHOOK } from "./config";

export class Hooks {
    private static readonly webhookUrl = GOOGLE_CHAT_WEBHOOK;

    private static readonly http: AxiosInstance = axios.create({
        baseURL: this.webhookUrl,
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
        },
    });

    /**
     * Helper to send the card to Google Chat
     */
    private static async postToChat(card: any) {
        try {
            const response = await this.http.post("", {
                "cardsV2": [
                    {
                        "cardId": `notif-${Date.now()}`,
                        "card": card
                    }
                ]
            });
            return response.data;
        } catch (error) {
            console.error("Error sending Google Chat notification:", error);
            throw error;
        }
    }

    /**
     * GitHub Notification (Real Data from Webhook)
     */
    static async sendGitHubNotification(payload: any) {
        const repository = payload.repository || {};
        const pusher = payload.pusher || {};
        const sender = payload.sender || {};
        const head_commit = payload.head_commit || {};
        
        // Extract branch name from ref (e.g., "refs/heads/main" -> "main")
        const branchName = payload.ref ? payload.ref.replace("refs/heads/", "") : "N/A";
        const commitCount = payload.commits ? payload.commits.length : 0;
        const forced = payload.forced ? "true" : "false";
        const deleted = payload.deleted ? "true" : "false";
        const compare = payload.compare || "";

        const card = {
            "header": {
                "title": "GitHub Push Notification",
                "subtitle": `<b>${repository.full_name || 'Unknown Repository'}</b> (<code>${repository.visibility || 'N/A'}</code>)`,
                "imageUrl": "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
                "imageType": "CIRCLE"
            },
            "sections": [
                {
                    "widgets": [
                        {
                            "decoratedText": {
                                "text": `Branch: <b>${branchName}</b> • Commit(s): <b>${commitCount}</b> • Forced: <b>${forced}</b> • Deleted: <b>${deleted}</b>`,
                                "startIcon": { "knownIcon": "DESCRIPTION" }
                            }
                        }
                    ]
                },
                {
                    "header": "Repository Details",
                    "widgets": [
                        { "decoratedText": { "topLabel": "Organization", "text": repository.organization || "N/A" } },
                        { "decoratedText": { "topLabel": "Pusher", "text": `${pusher.name || 'N/A'} (${pusher.email || 'N/A'})` } },
                        { "decoratedText": { "topLabel": "Repository", "text": repository.full_name || 'N/A' } }
                    ]
                },
                {
                    "header": "Head commit details",
                    "widgets": [
                        { "textParagraph": { "text": `<b>${head_commit.message || 'No message'}</b>` } },
                        { "decoratedText": { "topLabel": "Commit", "text": `<code>${(head_commit.id || '').substring(0, 7)}</code>` } },
                        { "decoratedText": { "topLabel": "Time", "text": head_commit.timestamp || 'N/A' } },
                        { "decoratedText": { "topLabel": "Author", "text": `<b>${head_commit.author?.name || 'N/A'}</b> (${head_commit.author?.username || 'N/A'})` } },
                        {
                            "buttonList": {
                                "buttons": [
                                    { "text": "View commit", "onClick": { "openLink": { "url": head_commit.url || "#" } } },
                                    { "text": "View compare", "onClick": { "openLink": { "url": compare || "#" } } }
                                ]
                            }
                        }
                    ]
                },
                {
                    "widgets": [
                        {
                            "buttonList": {
                                "buttons": [
                                    { "text": "Open repository", "onClick": { "openLink": { "url": repository.html_url || "#" } } },
                                    { "text": "Open sender profile", "onClick": { "openLink": { "url": sender.html_url || "#" } } }
                                ]
                            }
                        }
                    ]
                }
            ]
        };

        return this.postToChat(card);
    }

    /**
     * BitBucket Notification (Real Data from Webhook)
     */
    static async sendBitBucketNotification(payload: any) {
        const repository = payload.repository || {};
        const actor = payload.actor || {};
        const push = payload.push || {};
        const changes = push.changes ? push.changes[0] : null;
        
        const branchName = changes?.new?.name || "N/A";
        const commit = changes?.new?.target || {};
        const commitMessage = commit.message || "No message";
        const commitHash = commit.hash || "";
        const commitDate = commit.date || "N/A";
        const commitLink = commit.links?.html?.href || "#";
        const repoLink = repository.links?.html?.href || "#";
        const actorLink = actor.links?.html?.href || "#";

        const card = {
            "header": {
                "title": "BitBucket Push Notification",
                "subtitle": `<b>${repository.full_name || 'Unknown Repository'}</b> (<code>${repository.is_private ? 'private' : 'public'}</code>)`,
                "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpxEQ0uIkbMszowTDvYTnCamahLRDwajS4Kg&s",
                "imageType": "CIRCLE"
            },
            "sections": [
                {
                    "widgets": [
                        {
                            "decoratedText": {
                                "text": `Branch: <b>${branchName}</b> • Action: <b>Push</b>`,
                                "startIcon": { "knownIcon": "BOOKMARK" }
                            }
                        }
                    ]
                },
                {
                    "header": "Repository Info",
                    "widgets": [
                        { "decoratedText": { "topLabel": "Workspace", "text": payload.workspace?.name || "N/A" } },
                        { "decoratedText": { "topLabel": "Actor", "text": actor.display_name || "N/A" } },
                        { "decoratedText": { "topLabel": "Project", "text": repository.name || "N/A" } }
                    ]
                },
                {
                    "header": "Last Commit",
                    "widgets": [
                        { "textParagraph": { "text": `<b>${commitMessage.trim()}</b>` } },
                        { "decoratedText": { "topLabel": "Hash", "text": `<code>${commitHash.substring(0, 7)}</code>` } },
                        { "decoratedText": { "topLabel": "Time", "text": commitDate } },
                        {
                            "buttonList": {
                                "buttons": [
                                    { "text": "View Changes", "onClick": { "openLink": { "url": commitLink } } }
                                ]
                            }
                        }
                    ]
                },
                {
                    "widgets": [
                        {
                            "buttonList": {
                                "buttons": [
                                    { "text": "Open BitBucket", "onClick": { "openLink": { "url": repoLink } } },
                                    { "text": "User Profile", "onClick": { "openLink": { "url": actorLink } } }
                                ]
                            }
                        }
                    ]
                }
            ]
        };

        return this.postToChat(card);
    }
}