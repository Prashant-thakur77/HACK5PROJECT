import { config } from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const userStates = {};

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: "ASK_WALLET" };

  bot.sendMessage(chatId, "Welcome! Please enter your wallet address:");
});

// Handle all messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates[chatId];

  // Skip messages if no active session
  if (!state) return;

  switch (state.step) {
    case "ASK_WALLET":
      if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
        state.wallet = text;
        state.step = "MAIN_MENU";

        bot.sendMessage(chatId, `✅ Wallet confirmed: ${text}`, {
          reply_markup: {
            keyboard: [["Show All Complaints", "Track Complaint"]],
            resize_keyboard: true,
          },
        });
      } else {
        bot.sendMessage(chatId, "❌ Invalid wallet. Try again.");
      }
      break;

    case "MAIN_MENU":
      if (text === "Show All Complaints") {
        try {
          console.log('in')

          const response = await fetch('http://localhost:5000/getcomplaints', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify()
          });
          console.log('in')
          const data = await response.json();
          let complaints = [];

          if (data.error) {
            throw new Error(data.error);
          } else if (data.data) {
            complaints = Array.isArray(data.data) ? data.data : [data.data];
            
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
                       return '';
                     }
                 
                     return Object.entries(complaint)
                       .map(([key, value]) => `${key}: ${value}`)
                       .join('\n');
                   }).join('\n\n---');
                 
                   bot.sendMessage(chatId, `Your complaints:\n\n${formattedComplaints}`);
          }

          // if (!complaints.length) {
          //   bot.sendMessage(chatId, "You have no complaints.");
          // } else {
          //   const formatted = complaints
          //     .map((c, i) => `🔹 ID: ${c.id} - ${c.title || "No Title"}`)
          //     .join("\n");
          //   bot.sendMessage(chatId, `📄 Complaints:\n\n${formatted}`);
          // }
        } catch (err) {
          bot.sendMessage(chatId, "⚠️ Failed to fetch complaints.");
        }
      } else if (text === "Track Complaint") {
        state.step = "AWAITING_ID";
        bot.sendMessage(chatId, "📨 Enter the complaint ID to track:");
      }
      break;

    case "AWAITING_ID":
      try {
        const response = await fetch('http://localhost:5000/getcomplaint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(text)
        });
        const data = await response.json();
        const complaints = Array.isArray(data) ? data : [data];
        const complaintStatus = data.data.map(complaint => {
          return `
        Complaint ID: ${complaint.trackingId}
        Status:
        - Police Assigned: ${complaint.PoliceAssigned ? '✅' : '❌'}
        - Police Dispatched: ${complaint.PoliceDispatched ? '✅' : '❌'}
        - Police Arrived: ${complaint.PoliceArrived ? '✅' : '❌'}
        - Resolved: ${complaint.Resolved ? '✅' : '❌'}

        Location: ${complaint.locationAddress}
        Description: ${complaint.description}
        Contact: ${complaint.contactName} (${complaint.contactEmail})
        Created: ${new Date(complaint.createdAt).toLocaleString()}
          `;
        }).join('\n\n');

        // let complaints = [];

        // if (data.error) {
        //   throw new Error(data.error);
        // } else if (data.data) {
        //   complaints = Array.isArray(data.data) ? data.data : [data.data];
          
        //    const formattedComplaints = complaints.map(rawComplaint => {
        //            let complaint;
               
        //            // Parse the string to an actual object
        //            try {
        //              // Replace backticks or incorrect quotes if needed
        //              const sanitized = rawComplaint
        //                .replace(/`/g, '')               // Remove backticks
        //                .replace(/'/g, '"');             // Replace single quotes with double quotes
               
        //              complaint = JSON.parse(sanitized);
        //            } catch (err) {
        //              console.error('Failed to parse complaint:', rawComplaint, err);
        //              return 'Error parsing complaint.';
        //            }
               
        //            return Object.entries(complaint)
        //              .map(([key, value]) => `${key}: ${value}`)
        //              .join('\n');
        //          }).join('\n\n---\n\n');
               
        //          bot.sendMessage(chatId, `Your complaints:\n\n${formattedComplaints}`);
        // }

        // if (!complaints.length) {
        //   bot.sendMessage(chatId, "You have no complaints.");
        // } else {
        //   const formatted = complaints
        //     .map((c, i) => `🔹 ID: ${c.id} - ${c.title || "No Title"}`)
        //     .join("\n");
        //   bot.sendMessage(chatId, `📄 Complaints:\n\n${formatted}`);
        // }
      } catch (err) {
        bot.sendMessage(chatId, "⚠️ Error tracking complaint."+err);
      }

      // Go back to main menu
      state.step = "MAIN_MENU";
      break;

    default:
      bot.sendMessage(chatId, "❓ Unexpected input. Try again.");
      break;
  }
});
