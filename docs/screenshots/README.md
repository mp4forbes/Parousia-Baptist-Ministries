# Admin Guide Screenshots

Canonical screenshot files for `Parousia-Admin-Guide.md`.

| File | Description |
|------|-------------|
| `01-public-nav-gear.png` | Public site nav with admin gear icon (logged in) |
| `02-admin-login-step1.png` | Admin login email/password screen |
| `03-admin-login-otp-en.png` | OTP verification screen (English) |
| `03-admin-login-otp-ht.png` | OTP verification screen (Kreyòl) — place your Kreyòl screenshot here |
| `04-admin-dashboard-sidebar.png` | Admin dashboard sidebar |
| `05-logo-upload.png` | Logo upload panel |
| `06-color-adjuster.png` | Color adjuster panel |
| `07-home-tabs-config.png` | Configure Home Tabs screen |
| `08-ministries-config.png` | Ministries configuration screen |
| `09-devotional-theme.png` | Daily devotional theme settings |
| `10-blog-editor.png` | Pastor blog editor |
| `11-security-admins.png` | Security & Admins screen |
| `12-auto-translate-panel.png` | Auto-translation controls |

## Capture workflow

```bash
# 1) One-time: save an authenticated browser session
npm run admin-guide:auth

# 2) Capture screenshots into this folder
npm run admin-guide:capture

# 3) Copy screenshots to website assets
npm run admin-guide:sync

# 4) Build Word doc with embedded images
npm run admin-guide:docx
```

After sync, images are also available on the website at:

`https://ParousiaBaptistChurch.org/admin-guide/screenshots/<filename>`

## Playwright MCP (Cursor)

Project MCP config: `.cursor/mcp.json`

After adding it, restart Cursor and enable the **playwright** MCP server. Then you can ask the agent to navigate the site and capture missing shots (especially `03-admin-login-otp.png`).
