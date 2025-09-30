// WhatsApp-driven Google Drive Assistant
// Main application file: index.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// Configuration
const CONFIG = {
  GOOGLE_CREDENTIALS_PATH: './credentials.json',
  TOKEN_PATH: './token.json',
  SCOPES: ['https://www.googleapis.com/auth/drive'],
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
};

// Initialize WhatsApp client
const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: CONFIG.ANTHROPIC_API_KEY
});

// Google Drive OAuth2 client
let driveClient = null;
let oauth2Client = null;

// ==================== Google Drive Authentication ====================

async function loadCredentials() {
  try {
    const content = await fs.readFile(CONFIG.GOOGLE_CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    // Try to load saved token
    try {
      const token = await fs.readFile(CONFIG.TOKEN_PATH);
      oauth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      await getAccessToken();
    }
    
    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return true;
  } catch (error) {
    console.error('Error loading credentials:', error);
    return false;
  }
}

async function getAccessToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: CONFIG.SCOPES,
  });
  
  console.log('Authorize this app by visiting this url:', authUrl);
  console.log('After authorization, save the token to token.json');
}

// ==================== Google Drive Operations ====================

async function listFiles(folderName) {
  try {
    const folderId = await getFolderId(folderName);
    if (!folderId) return `Folder "${folderName}" not found.`;
    
    const response = await driveClient.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      orderBy: 'name'
    });
    
    const files = response.data.files;
    if (files.length === 0) return `No files found in "${folderName}".`;
    
    let result = `📁 Files in "${folderName}":\n\n`;
    files.forEach((file, index) => {
      const size = file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'N/A';
      result += `${index + 1}. ${file.name}\n   Type: ${file.mimeType}\n   Size: ${size}\n\n`;
    });
    
    return result;
  } catch (error) {
    console.error('Error listing files:', error);
    return `Error listing files: ${error.message}`;
  }
}

async function deleteFile(folderName, fileName) {
  try {
    const fileId = await getFileId(folderName, fileName);
    if (!fileId) return `File "${fileName}" not found in "${folderName}".`;
    
    await driveClient.files.delete({ fileId });
    return `✅ Successfully deleted "${fileName}" from "${folderName}".`;
  } catch (error) {
    console.error('Error deleting file:', error);
    return `Error deleting file: ${error.message}`;
  }
}

async function moveFile(sourcePath, destFolder) {
  try {
    const pathParts = sourcePath.split('/');
    const fileName = pathParts.pop();
    const sourceFolder = pathParts.join('/');
    
    const fileId = await getFileId(sourceFolder, fileName);
    if (!fileId) return `File not found: ${sourcePath}`;
    
    const destFolderId = await getFolderId(destFolder);
    if (!destFolderId) return `Destination folder "${destFolder}" not found.`;
    
    const file = await driveClient.files.get({
      fileId: fileId,
      fields: 'parents'
    });
    
    const previousParents = file.data.parents.join(',');
    
    await driveClient.files.update({
      fileId: fileId,
      addParents: destFolderId,
      removeParents: previousParents,
      fields: 'id, parents'
    });
    
    return `✅ Successfully moved "${fileName}" to "${destFolder}".`;
  } catch (error) {
    console.error('Error moving file:', error);
    return `Error moving file: ${error.message}`;
  }
}

async function renameFile(folderName, oldName, newName) {
  try {
    const fileId = await getFileId(folderName, oldName);
    if (!fileId) return `File "${oldName}" not found in "${folderName}".`;
    
    await driveClient.files.update({
      fileId: fileId,
      resource: { name: newName }
    });
    
    return `✅ Successfully renamed "${oldName}" to "${newName}".`;
  } catch (error) {
    console.error('Error renaming file:', error);
    return `Error renaming file: ${error.message}`;
  }
}

async function uploadFile(filePath, destinationFolder) {
  try {
    const folderId = await getFolderId(destinationFolder);
    if (!folderId) return `Folder "${destinationFolder}" not found.`;
    
    const fileName = path.basename(filePath);
    const fileContent = await fs.readFile(filePath);
    
    const response = await driveClient.files.create({
      resource: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        body: fileContent
      },
      fields: 'id, name, webViewLink'
    });
    
    return `✅ Successfully uploaded "${fileName}" to "${destinationFolder}".\nLink: ${response.data.webViewLink}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    return `Error uploading file: ${error.message}`;
  }
}

async function summarizeFolder(folderName) {
  try {
    const folderId = await getFolderId(folderName);
    if (!folderId) return `Folder "${folderName}" not found.`;
    
    const response = await driveClient.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.document' or mimeType='text/plain')`,
      fields: 'files(id, name, mimeType)'
    });
    
    const files = response.data.files;
    if (files.length === 0) return `No supported files found in "${folderName}".`;
    
    let summaries = `📝 Summaries for "${folderName}":\n\n`;
    
    for (const file of files.slice(0, 5)) { // Limit to 5 files
      const content = await getFileContent(file.id, file.mimeType);
      if (content) {
        const summary = await generateSummary(content, file.name);
        summaries += `📄 ${file.name}\n${summary}\n\n`;
      }
    }
    
    return summaries;
  } catch (error) {
    console.error('Error summarizing folder:', error);
    return `Error summarizing folder: ${error.message}`;
  }
}

async function getFileContent(fileId, mimeType) {
  try {
    let response;
    
    if (mimeType === 'application/vnd.google-apps.document') {
      response = await driveClient.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });
    } else if (mimeType === 'text/plain') {
      response = await driveClient.files.get({
        fileId: fileId,
        alt: 'media'
      });
    } else if (mimeType === 'application/pdf') {
      // For PDF, we'll extract text (simplified - would need pdf-parse library)
      return null; // Skip PDFs for now
    }
    
    return response.data;
  } catch (error) {
    console.error('Error getting file content:', error);
    return null;
  }
}

async function generateSummary(content, fileName) {
  try {
    const truncatedContent = content.substring(0, 10000); // Limit content size
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Please provide a concise summary of the following document "${fileName}":\n\n${truncatedContent}`
      }]
    });
    
    return message.content[0].text;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Unable to generate summary.';
  }
}

// ==================== Helper Functions ====================

async function getFolderId(folderPath) {
  try {
    const folders = folderPath.split('/').filter(f => f);
    let parentId = 'root';
    
    for (const folder of folders) {
      const response = await driveClient.files.list({
        q: `name='${folder}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });
      
      if (response.data.files.length === 0) return null;
      parentId = response.data.files[0].id;
    }
    
    return parentId;
  } catch (error) {
    console.error('Error getting folder ID:', error);
    return null;
  }
}

async function getFileId(folderName, fileName) {
  try {
    const folderId = await getFolderId(folderName);
    if (!folderId) return null;
    
    const response = await driveClient.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });
    
    return response.data.files.length > 0 ? response.data.files[0].id : null;
  } catch (error) {
    console.error('Error getting file ID:', error);
    return null;
  }
}

// ==================== WhatsApp Message Handler ====================

async function handleMessage(msg) {
  const text = msg.body.trim();
  
  // Command parsing
  if (text.startsWith('LIST ')) {
    const folder = text.substring(5).trim();
    const result = await listFiles(folder);
    await msg.reply(result);
  }
  else if (text.startsWith('DELETE ')) {
    const parts = text.substring(7).split('/');
    const fileName = parts.pop();
    const folder = parts.join('/');
    const result = await deleteFile(folder, fileName);
    await msg.reply(result);
  }
  else if (text.startsWith('MOVE ')) {
    const parts = text.substring(5).split(' ');
    const archiveIndex = parts.findIndex(p => p.toLowerCase() === 'archive');
    if (archiveIndex === -1) {
      await msg.reply('Invalid MOVE command. Use: MOVE /Folder/file.pdf /Archive');
      return;
    }
    const sourcePath = parts.slice(0, archiveIndex).join(' ');
    const destFolder = parts.slice(archiveIndex + 1).join(' ');
    const result = await moveFile(sourcePath, destFolder);
    await msg.reply(result);
  }
  else if (text.startsWith('RENAME ')) {
    const match = text.match(/RENAME (.+?) (.+?) (.+)/);
    if (match) {
      const [, folder, oldName, newName] = match;
      const result = await renameFile(folder, oldName, newName);
      await msg.reply(result);
    } else {
      await msg.reply('Invalid RENAME command. Use: RENAME /Folder oldfile.pdf newfile.pdf');
    }
  }
  else if (text.startsWith('SUMMARY ')) {
    const folder = text.substring(8).trim();
    await msg.reply('⏳ Generating summaries... This may take a moment.');
    const result = await summarizeFolder(folder);
    await msg.reply(result);
  }
  else if (text.startsWith('UPLOAD ')) {
    const parts = text.substring(7).split(' to ');
    if (parts.length === 2) {
      // Check if message has media
      if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        const tempPath = `./temp_${Date.now()}_${parts[0]}`;
        await fs.writeFile(tempPath, media.data, 'base64');
        const result = await uploadFile(tempPath, parts[1]);
        await fs.unlink(tempPath); // Clean up
        await msg.reply(result);
      } else {
        await msg.reply('Please attach a file with the UPLOAD command.');
      }
    } else {
      await msg.reply('Invalid UPLOAD command. Send file with message: UPLOAD filename.pdf to /Folder');
    }
  }
  else if (text.toLowerCase() === 'help') {
    const helpText = `
🤖 *WhatsApp Google Drive Assistant*

Available commands:

📋 *LIST /FolderName*
   Lists all files in the specified folder

🗑️ *DELETE /Folder/file.pdf*
   Deletes the specified file

📦 *MOVE /Folder/file.pdf /Archive*
   Moves file to another folder

✏️ *RENAME /Folder oldfile.pdf newfile.pdf*
   Renames a file

📤 *UPLOAD filename.pdf to /Folder*
   Upload attached file (send with file attachment)

📝 *SUMMARY /FolderName*
   Generates AI summaries of documents in folder

❓ *HELP*
   Shows this help message
    `;
    await msg.reply(helpText);
  }
}

// ==================== WhatsApp Client Events ====================

whatsappClient.on('qr', (qr) => {
  console.log('QR Code received. Scan with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', async () => {
  console.log('✅ WhatsApp client is ready!');
  await loadCredentials();
  console.log('✅ Google Drive authenticated!');
});

whatsappClient.on('message', async (msg) => {
  try {
    await handleMessage(msg);
  } catch (error) {
    console.error('Error handling message:', error);
    await msg.reply('❌ An error occurred while processing your request.');
  }
});

whatsappClient.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated!');
});

whatsappClient.on('auth_failure', (error) => {
  console.error('❌ WhatsApp authentication failed:', error);
});

// ==================== Start Application ====================

async function start() {
  console.log('🚀 Starting WhatsApp Google Drive Assistant...');
  
  // Verify API key
  if (!CONFIG.ANTHROPIC_API_KEY) {
    console.error('⚠️  ANTHROPIC_API_KEY not set in environment variables');
  }
  
  whatsappClient.initialize();
}

start();

module.exports = { whatsappClient, driveClient };