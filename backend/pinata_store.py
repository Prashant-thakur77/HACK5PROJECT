import requests

def upload_to_pinata(call_data):
    try:
        response = requests.post('http://localhost:3000/api/upload', json=call_data)
        return response.json().get('ipfsHash')
    except requests.exceptions.RequestException as e:
        print(f"Error sending data to Next.js server: {e}")
        return None
    
# result = upload_to_pinata("{test:Test}")
# print(result)