from tinydb import TinyDB, Query
import requests

db = TinyDB('db.json')
query_db = Query()

def store_in_db(json):
    try:
        db.insert(json)
        print(db.all())
        return True
    except:
        return False

def fetch_from_db(cid):
    return db.search(query_db.cid == cid)

def fetch_all():
    return db.all()


def fetch_all_comp():
    data = [item for item in db.all() if True]
    contents = []

    for item in data:
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{item['ipfsHash']}"
        try:
            response = requests.get(ipfs_url)
            contents.append(response.json())
        except Exception as e:
            contents.append({"error": str(e), "hash": item['ipfsHash']})
    
    return contents


def fetch_from_phone(phone):
    data = [item for item in db.all() if item.get("ph") == phone]
    contents = []

    for item in data:
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{item['ipfsHash']}"
        try:
            response = requests.get(ipfs_url)
            contents.append(response.json())
        except Exception as e:
            contents.append({"error": str(e), "hash": item['ipfsHash']})
    
    return contents


def fetch_from_id(phone):
    print(db.all())
    data = [item for item in db.all() if item.get("trackingId") == phone]
    contents = []

    for item in data:
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{item['ipfsHash']}"
        try:
            response = requests.get(ipfs_url)
            contents.append(response.json())
        except Exception as e:
            contents.append({"error": str(e), "hash": item['ipfsHash']})
    print(contents)
    return contents
