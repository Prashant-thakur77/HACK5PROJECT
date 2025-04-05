import TelegramBot from 'node-telegram-bot-api';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'user_data.json');

let phoneChatMap = {};
if (existsSync(DATA_FILE)) {
  try {
    const rawData = readFileSync(DATA_FILE);
    phoneChatMap = JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading data.json:', err);
  }
}

function saveData() {
  writeFileSync(DATA_FILE, JSON.stringify(phoneChatMap, null, 2));
}

// === Start Bot ===
const bot = new TelegramBot(TOKEN, { polling: true });

// === /start Command ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const requestContactKeyboard = {
    reply_markup: {
      keyboard: [[{ text: 'Share Contact 📱', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Please share your mobile number to continue.', requestContactKeyboard);
});

// === Handle Contact ===
bot.on('contact', (msg) => {
  const chatId = msg.chat.id;
  const phoneNumber = msg.contact.phone_number;

  if (!phoneChatMap[phoneNumber]) {
    phoneChatMap[phoneNumber] = chatId;
    saveData();
    bot.sendMessage(chatId, `Thanks! Your number ${phoneNumber} has been registered.`);
  }

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [[{ text: 'View Complaint 📄', callback_data: 'view_complaint' }]],
    }, 
  };

  bot.sendMessage(chatId, 'Choose an option:', inlineKeyboard);
});

// === Handle Inline Button Click ===
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'view_complaint') {
    const phoneNumber = Object.keys(phoneChatMap).find(key => phoneChatMap[key] === chatId);
    if (!phoneNumber) {
      bot.sendMessage(chatId, 'Error: Phone number not found');
      return;
    }

    fetch('http://localhost:5000/getlatestcomplaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        bot.sendMessage(chatId, 'Error: ' + data.error);
      } else if (data.data) {
        const complaints = Array.isArray(data.data) ? data.data : [data.data];
      
        const formattedComplaints = complaints.map(rawComplaint => {
          let complaint;
      
          // Parse the string to an actual object
          try {
            // Replace backticks or incorrect quotes if needed
            const sanitized = rawComplaint
              .replace(/`/g, '')               // Remove backticks
              .replace(/'/g, '"');             // Replace single quotes with double quotes
      
            complaint = JSON.parse(sanitized);
          } catch (err) {
            console.error('Failed to parse complaint:', rawComplaint, err);
            return Object.entries(rawComplaint)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');          }
      
          return Object.entries(complaint)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        }).join('\n\n---\n\n');
      
        bot.sendMessage(chatId, `Your complaints:\n\n${formattedComplaints}`);
      }
      else {
        bot.sendMessage(chatId, 'You currently have no complaints filed.');
      }
    })
    .catch(error => {
      console.error('Error fetching complaint:', error);
      bot.sendMessage(chatId, 'Sorry, there was an error fetching your complaint.');
    });
  }

  bot.answerCallbackQuery(query.id);
});

console.log('✅ Bot is running...');
