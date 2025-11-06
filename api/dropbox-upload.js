// api/dropbox-upload.js
// Expects JSON: { "path": "/Requests/filename.png", "image_b64": "<BASE64>" }
import { request } from "undici";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { path, image_b64 } = body || {};
    if (!path || !image_b64) return res.status(400).json({ error: "Missing path or image_b64" });

    const token = process.env.DROPBOX_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "No DROPBOX_ACCESS_TOKEN" });

    const bytes = Buffer.from(image_b64, "base64");
    const r = await request("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite" }),
        "Content-Type": "application/octet-stream"
      },
      body: bytes
    });
    const text = await r.body.text();
    return r.statusCode >= 200 && r.statusCode < 300
      ? res.status(200).send(text)
      : res.status(r.statusCode).send(text);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
