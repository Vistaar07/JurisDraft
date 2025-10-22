import requests
import json

API_URL = "http://127.0.0.1:8000/api/v1/analyze"

def ask_question(query):
    """Sends a query to the running API server and prints the response."""
    try:
        payload = {"query": query}
        response = requests.post(API_URL, json=payload, timeout=300) # 300-second timeout for long queries
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        
        data = response.json()
        print("\n--- AI Analyst Response ---")
        print(data.get("analysis", "No analysis found in the response."))
        print("---------------------------\n")

    except requests.exceptions.RequestException as e:
        print(f"\n--- ERROR ---")
        print(f"Could not connect to the API server at {API_URL}.")
        print(f"Please ensure the 'api_server.py' script is running.")
        print(f"Error details: {e}")
        print("-------------\n")

if __name__ == "__main__":
    print("Legal AI Analyst Client (type 'exit' to quit)")
    while True:
        user_query = input("Ask your legal question: ")
        if user_query.lower() == 'exit':
            break
        if user_query:
            ask_question(user_query)