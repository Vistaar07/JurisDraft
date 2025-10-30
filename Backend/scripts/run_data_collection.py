import os
import subprocess
import sys
import json

# --- Configuration ---
API_KEY_FILE = "api_keys.json"
OUTPUT_DIR = "CaseLawData"
QUERY_FILE_MASTER = "queries.txt" # The file with ALL queries
PAGES_PER_QUERY = 20  # Set this to your new, higher target (e.g., 20 or 30)

# A comprehensive dictionary of all queries organized by category
# This will be used to create 'queries.txt' if it doesn't exist
QUERIES_BY_CATEGORY = {
    "Employment_and_HR": {
        "Offer_Letter": [
            '"offer letter" ANDD "employment contract" ANDD validity',
            'interpretation of "appointment letter" versus "contract of service"',
            '"offer letter" withdrawn after acceptance remedy'
        ],
        "Non_Disclosure_Agreement_NDA": [
            '"non-disclosure agreement" ANDD breach ANDD damages',
            'scope of "confidential information" IT Act 2000',
            'NDA unenforceable "restraint of trade" section 27'
        ],
        "Non_Compete_Agreement": [
            '"non-compete clause" during employment validity',
            'interpretation "restraint of trade" section 27 indian contract act',
            'post-employment "non-compete agreement" injunction denied'
        ]
    },
    "Business_and_Corporate": {
        "Partnership_Deed": [
            '"partnership deed" rights ANDD duties of partners',
            'interpretation of "dissolution of firm" partnership act 1932',
            'oral partnership agreement validity dispute'
        ],
        "Memorandum_of_Understanding_MoU": [
            '"memorandum of understanding" ANDD "enforceability"',
            'distinction between MoU ANDD "binding contract"',
            'MoU "not a concluded contract" specific performance denied'
        ],
        "Shareholder_Agreement": [
            '"shareholder agreement" ANDD "minority shareholder rights"',
            'interpretation of "oppression and mismanagement" companies act 2013',
            '"right of first refusal" clause dispute shareholder agreement'
        ],
        "Vendor_Agreement": [
            '"vendor agreement" ANDD "breach of contract"',
            'scope of "limitation of liability" clause service agreement',
            '"termination for convenience" clause challenged vendor agreement'
        ],
        "Terms_and_Conditions": [
            '"terms and conditions" ANDD "online contract" validity',
            'interpretation of "intermediary liability" IT Rules 2021',
            '"unfair trade practice" consumer protection act website terms'
        ]
    },
    "Finance_and_Transactions": {
        "Loan_Repayment_Agreement": [
            '"loan agreement" ANDD default ANDD consequences',
            'calculation of interest "usurious lending practices"',
            'loan agreement unenforceable penalty clause'
        ],
        "Sale_Deed": [
            '"sale deed" ANDD "transfer of title" immovable property',
            'interpretation of "encumbrance" transfer of property act',
            'cancellation of "sale deed" fraud misrepresentation'
        ]
    },
    "General_Legal_and_Civil": {
        "Legal_Notice": [
            '"legal notice" ANDD defamation requirements',
            'sufficiency of notice under "section 80 code of civil procedure"',
            'failure to send "legal notice" suit dismissed'
        ],
        "Indemnity_Bond": [
            '"indemnity bond" ANDD invocation',
            'scope of "indemnity clause" section 124 contract act',
            'unenforceable "indemnity bond" ambiguous terms'
        ],
        "Cease_and_Desist": [
            '"cease and desist" trademark infringement',
            'requirements for "copyright infringement" notice',
            '"cease and desist" notice malicious prosecution'
        ]
    }
}

def load_api_keys():
    """Loads a list of API keys from the JSON file."""
    try:
        with open(API_KEY_FILE, 'r') as f:
            data = json.load(f)
            keys = data.get("api_keys", [])
            if not keys:
                print(f"Error: No keys found in {API_KEY_FILE}.")
                return None
            return keys
    except FileNotFoundError:
        print(f"Error: {API_KEY_FILE} not found. Please create it with your keys.")
        return None
    except json.JSONDecodeError:
        print(f"Error: {API_KEY_FILE} is not a valid JSON file.")
        return None

def write_master_query_file():
    """Creates queries.txt from the dictionary if it doesn't exist."""
    if os.path.exists(QUERY_FILE_MASTER):
        print(f"'{QUERY_FILE_MASTER}' already exists. Using it.")
        return

    print(f"'{QUERY_FILE_MASTER}' not found. Generating from script...")
    all_queries = []
    for category, subcategories in QUERIES_BY_CATEGORY.items():
        for subcategory, queries in subcategories.items():
            all_queries.extend(queries)

    try:
        with open(QUERY_FILE_MASTER, 'w', encoding='utf-8') as f:
            for query in all_queries:
                f.write(f"{query}\n")
        print(f"Successfully created '{QUERY_FILE_MASTER}' with {len(all_queries)} queries.")
    except IOError as e:
        print(f"Error: Could not write to file {QUERY_FILE_MASTER}. {e}")

def run_collection():
    """
    Loops through API keys and runs the collection script.
    It will re-run all queries to find new pages, but ikapi.py will not
    re-download existing files, thus saving credits.
    """
    print("--- Starting Data Collection Process ---")

    # 1. Load API Keys
    api_keys = load_api_keys()
    if not api_keys:
        return

    # 2. Make sure the master query file exists
    write_master_query_file()

    # 3. Loop through each API key
    for i, api_key in enumerate(api_keys):
        print(f"\n--- Attempting to run with API Key #{i + 1} ---")

        # 4. Construct the command
        command = [
            sys.executable,  # Use the current Python interpreter
            "ikapi.py",
            "-s", api_key,
            "-D", OUTPUT_DIR,
            "-Q", QUERY_FILE_MASTER, # Always use the master list of all queries
            "-p", str(PAGES_PER_QUERY),
            "--pathbysrc"
        ]

        print(f"Executing command for {PAGES_PER_QUERY} pages per query...")

        # 5. Run the ikapi.py script
        try:
            # We use subprocess.run, which waits for the command to complete
            result = subprocess.run(command, check=True, capture_output=True, text=True)

            # If the script finishes without error, it means all queries
            # were completed to the target page count. We are done.
            print("\n--- Data Collection Process Completed Successfully ---")
            print(result.stdout)
            break # Exit the loop

        except subprocess.CalledProcessError as e:
            # This block will catch the 403 error we raised in ikapi.py
            print(f"--- API Key #{i + 1} Failed or Expired ---")
            print("Error log from ikapi.py:")
            print(e.stderr)
            print("Trying next key in the list...")
            continue # Move to the next key in the loop

        except FileNotFoundError:
            print("Error: 'ikapi.py' not found. Make sure it's in the same directory.")
            return # A fatal error, so stop
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return # A fatal error, so stop

    print("All API keys have been tried.")

if __name__ == '__main__':
    run_collection()