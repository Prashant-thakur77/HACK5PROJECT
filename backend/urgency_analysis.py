import re
import requests
import json

OLLAMA_CHAT_URL = "http://localhost:11434/api/generate"

def get_urgency_analysis(transcription, emotion):
    try:
        system_prompt = """You are an AI assistant that analyzes transcriptions and emotions to extract specific information and assess urgency.
        Don't use previous context or external information.
        Please analyze the given transcription and emotion, and return a JSON with the following structure:
        {
            "name": "extracted name of the speaker or 'not present'",
            "address": "extracted address or 'not present'",
            "urgency": "high/moderate/low based on content and emotion",
            "corrected_transcription": "grammar-corrected version of transcription"
        }

        Base the urgency level on:
        - High: emergencies, safety issues, time-critical matters
        - Moderate: important but not immediate concerns
        - Low: general inquiries or minor issues
        Use double quotes to surround all key-value pairs. Don't use single quotes.
        Only respond with the JSON object, no additional text.
        """

        user_prompt = f"Transcription: {transcription}\nEmotion: {emotion}"
        payload = {
            "model": "deepseek-r1:8b",
            "prompt": system_prompt + "\n" + user_prompt,  # Change to "prompt" for DeepSeek
            "stream": False
        }

        print("Sending request to DeepSeek model...")  # Debug print
        response = requests.post(OLLAMA_CHAT_URL, json=payload)

        if response.status_code == 200:
            response_text = response.json().get("response", "")
            print("Raw response from DeepSeek:", response_text)  # Debug print

            response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL)
            response_text = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if response_text:
                response_text = response_text.group(0)
                return json.loads(response_text)
            else:
                print("No valid JSON found in response.")  # Debug print
                return None
        else:
            print("Error:", response.status_code, response.text)  # Debug print
            return None
    except Exception as e:
        print("Exception occurred:", str(e))  # Debug print
        return None

# Test the function
print(get_urgency_analysis("I need urgent help", "Fear"))
