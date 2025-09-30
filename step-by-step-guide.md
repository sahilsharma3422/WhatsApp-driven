# 🤖 WhatsApp Google Drive Assistant

> Control your Google Drive through WhatsApp messages with AI-powered document summarization

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A powerful Node.js bot that lets you manage your Google Drive files directly from WhatsApp. Upload, delete, move, rename files, and get AI-powered summaries of your documents - all through simple WhatsApp commands.

## ✨ Features

- 📋 **List Files** - Browse files in any Drive folder
- 🗑️ **Delete Files** - Remove files with a message
- 📦 **Move Files** - Organize files between folders
- ✏️ **Rename Files** - Update file names instantly
- 📤 **Upload Files** - Send files via WhatsApp to Drive
- 🤖 **AI Summaries** - Get Claude-powered document summaries
- 🔐 **Secure** - OAuth2 authentication with Google
- 💬 **Simple** - Natural WhatsApp commands

## 🎬 Demo

```
You: LIST /Documents
Bot: 📁 Files in "Documents":
     1. Report.pdf
        Type: application/pdf
        Size: 245.32 KB
     2. Meeting_Notes.docx
        Type: application/vnd.openxmlformats...
        Size: 18.47 KB

You: SUMMARY /Documents
Bot: ⏳ Generating summaries... This may take a moment.
     📝 Summaries for "Documents":
     
     📄 Report.pdf
     This quarterly report shows a 15% increase in revenue...
```

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Google Account** - For Drive API access
- **Anthropic API Key** - [Get one here](https://console.anthropic.com/)
- **WhatsApp Account** - On your smartphone

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/whatsapp-drive-assistant.git
cd whatsapp-drive-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Drive API**
4. Create **OAuth 2.0 credentials** (Desktop app)
5. Download credentials as `credentials.json`
6. Place it in the project root

**Detailed instructions:** [Google Drive API Setup Guide](#google-drive-api-setup)

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

### 5. Run the Application

```bash
npm start
```

### 6. Authenticate

**Google Drive Authentication:**
- A URL will appear in the terminal
- Open it in your browser and grant permissions
- The token will be saved automatically

**WhatsApp Authentication:**
- A QR code will appear in the terminal
- Open WhatsApp on your phone
- Go to: **Settings → Linked Devices → Link a Device**
- Scan the QR code

### 7. Start Using!

Send a message to yourself on WhatsApp:

```
HELP
```

You should receive a response with all available commands! 🎉

## 📖 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `LIST /folder` | List all files in a folder | `LIST /Documents` |
| `DELETE /folder/file` | Delete a specific file | `DELETE /Archive/old.pdf` |
| `MOVE /source /dest` | Move file to another folder | `MOVE /Docs/file.pdf /Archive` |
| `RENAME /folder old new` | Rename a file | `RENAME /Docs old.pdf new.pdf` |
| `UPLOAD file to /folder` | Upload attached file | Attach file + `UPLOAD report.pdf to /Reports` |
| `SUMMARY /folder` | AI summary of documents | `SUMMARY /MeetingNotes` |
| `HELP` | Show help message | `HELP` |

## 🗂️ Project Structure

```
whatsapp-drive-assistant/
├── index.js              # Main application file
├── package.json          # Dependencies and scripts
├── credentials.json      # Google OAuth credentials (you provide)
├── token.json           # Google OAuth token (auto-generated)
├── .env                 # Environment variables (you create)
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── .wwebjs_auth/       # WhatsApp session data (auto-generated)
```

## 🔧 Detailed Setup Guides

### Google Drive API Setup

<details>
<summary>Click to expand detailed instructions</summary>

#### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `WhatsApp Drive Bot`
4. Click **"Create"**

#### Step 2: Enable Google Drive API

1. In your project dashboard, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and press **"Enable"**

#### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** user type
3. Fill in required fields:
   - App name: `WhatsApp Drive Assistant`
   - User support email: Your email
   - Developer contact: Your email
4. Click **"Save and Continue"** through all steps
5. Add your email as a test user

#### Step 4: Create Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Desktop app"** as application type
4. Name it: `WhatsApp Drive Bot`
5. Click **"Create"**
6. Download the JSON file
7. Rename it to `credentials.json`
8. Place it in your project root directory

</details>

### Getting Anthropic API Key

<details>
<summary>Click to expand</summary>

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **"API Keys"**
4. Click **"Create Key"**
5. Give it a name (e.g., "WhatsApp Bot")
6. Copy the API key
7. Add it to your `.env` file:
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   ```

**Note:** Keep this key secure and never commit it to version control!

</details>

## 💻 Usage Examples

### Example 1: Organize Files

```
# List files in Downloads folder
LIST /Downloads

# Move important file to Documents
MOVE /Downloads/report.pdf /Documents

# Delete unnecessary files
DELETE /Downloads/temp.txt
```

### Example 2: Document Management

```
# Rename a file
RENAME /Projects proposal_v1.pdf proposal_final.pdf

# Get AI summary of all documents in folder
SUMMARY /Projects

# Upload new document
(Attach file in WhatsApp)
UPLOAD new_proposal.pdf to /Projects
```

### Example 3: Quick Backup

```
# List files to backup
LIST /Important

# Move to Archive
MOVE /Important/2024_data.xlsx /Archive/2024
```

## 🛠️ Advanced Configuration

### Running as a Background Service

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start index.js --name whatsapp-drive-bot

# Make it run on startup
pm2 startup
pm2 save

# Monitor logs
pm2 logs whatsapp-drive-bot

# Stop the bot
pm2 stop whatsapp-drive-bot
```

#### Using systemd (Linux)

Create `/etc/systemd/system/whatsapp-bot.service`:

```ini
[Unit]
Description=WhatsApp Drive Assistant
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/whatsapp-drive-assistant
ExecStart=/usr/bin/node index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable whatsapp-bot
sudo systemctl start whatsapp-bot
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude | Yes |

## 🐛 Troubleshooting

### QR Code Not Appearing

```bash
# Delete WhatsApp session data
rm -rf .wwebjs_auth .wwebjs_cache
npm start
```

### Google Authentication Failed

```bash
# Remove existing token and re-authenticate
rm token.json
npm start
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Bot Not Responding

1. Check if the process is still running
2. Verify internet connection
3. Check WhatsApp connection status
4. Review console logs for errors
5. Restart the bot

### Rate Limiting Issues

- **Google Drive API:** 1000 requests per 100 seconds per user
- **Anthropic API:** Depends on your plan tier
- **WhatsApp:** No official rate limits, but use responsibly

## 🔒 Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit sensitive files:**
   - `credentials.json`
   - `token.json`
   - `.env`

2. **Keep API keys secure:**
   - Don't share your `.env` file
   - Rotate keys regularly
   - Monitor API usage

3. **Access Control:**
   - Only link trusted WhatsApp devices
   - Don't share the bot's WhatsApp number publicly
   - Consider implementing user whitelisting

4. **Regular Monitoring:**
   - Check [Google Cloud Console](https://console.cloud.google.com/) for API usage
   - Monitor [Anthropic Console](https://console.anthropic.com/) for costs
   - Review WhatsApp linked devices regularly

## 🚧 Known Limitations

- PDF text extraction is basic (consider adding `pdf-parse` library)
- Summary feature processes max 5 files per request
- Large files may timeout during upload
- WhatsApp Web session requires periodic re-authentication
- No support for Google Drive shared drives (yet)

## 🗺️ Roadmap

- [ ] Add support for Google Docs creation
- [ ] Implement user authentication/whitelist
- [ ] Add scheduled backups
- [ ] Support for shared drives
- [ ] Multi-language support
- [ ] Docker containerization
- [ ] Web dashboard for monitoring
- [ ] Support for more file types in summarization

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Please ensure:**
- Code follows existing style
- All tests pass
- Documentation is updated
- Commit messages are clear

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp API
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) - Google Drive integration
- [Anthropic Claude](https://www.anthropic.com/) - AI summarization
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) - QR code generation

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/whatsapp-drive-assistant/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/whatsapp-drive-assistant/discussions)

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

**Made with ❤️ by developers, for developers**

[Report Bug](https://github.com/yourusername/whatsapp-drive-assistant/issues) · [Request Feature](https://github.com/yourusername/whatsapp-drive-assistant/issues) · [Documentation](https://github.com/yourusername/whatsapp-drive-assistant/wiki)

</div>