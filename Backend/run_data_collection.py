import os
import subprocess
import sys

# --- Configuration ---
API_TOKEN = "b7eabe08fb3e7e21fb666dca1d3ff378dc5f991b"
OUTPUT_DIR = "CaseLawData"
# This file will be generated with only the queries that need to be run.
QUERY_FILE_TO_RUN = "queries_to_run.txt"
PAGES_PER_QUERY = 10  # Set this to a low number (e.g., 2) for testing.

# A comprehensive dictionary of all queries organized by category
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

def run_collection():
    """
    Checks for already downloaded data and runs ikapi.py only for missing queries.
    """
    print("--- Starting Data Collection Process ---")

    # 1. Get list of all desired queries from the dictionary
    all_queries = []
    for category, subcategories in QUERIES_BY_CATEGORY.items():
        for subcategory, queries in subcategories.items():
            all_queries.extend(queries)
    print(f"Total queries defined in script: {len(all_queries)}")

    # 2. Get list of queries *already downloaded* by checking folder names
    downloaded_queries = set()
    if os.path.isdir(OUTPUT_DIR):
        try:
            # os.listdir gives a list of all folder names in CaseLawData
            downloaded_queries = set(os.listdir(OUTPUT_DIR))
            print(f"Found {len(downloaded_queries)} already downloaded query folders.")
        except OSError as e:
            print(f"Warning: Could not list directory {OUTPUT_DIR}. {e}")
    else:
        print(f"'{OUTPUT_DIR}' directory not found. Will run all queries.")
        os.makedirs(OUTPUT_DIR) # Create it if it doesn't exist

    # 3. Filter to find only the queries that are NOT downloaded
    queries_to_run = []
    for query in all_queries:
        if query not in downloaded_queries:
            queries_to_run.append(query)
        else:
            print(f"Skipping already downloaded query: {query}")

    print(f"\nFound {len(queries_to_run)} new queries to run.")

    # 4. If no new queries, we are done.
    if not queries_to_run:
        print("No new queries to run. All data is up to date.")
        print("--- Data Collection Process Completed ---")
        return

    # 5. Write the *remaining* queries to the input file
    try:
        with open(QUERY_FILE_TO_RUN, 'w', encoding='utf-8') as f:
            for query in queries_to_run:
                f.write(f"{query}\n")
        print(f"Successfully created '{QUERY_FILE_TO_RUN}' with {len(queries_to_run)} queries.")
    except IOError as e:
        print(f"Error: Could not write to file {QUERY_FILE_TO_RUN}. {e}")
        return

    # 6. Construct the command to run ikapi.py with the *new* query file
    command = [
        sys.executable,  # Use the current Python interpreter
        "ikapi.py",
        "-s", API_TOKEN,
        "-D", OUTPUT_DIR,
        "-Q", QUERY_FILE_TO_RUN, # Use the new, filtered query file
        "-p", str(PAGES_PER_QUERY),
        "--pathbysrc"
    ]

    print(f"\nExecuting command: {' '.join(command)}\n")

    # 7. Run the ikapi.py script
    try:
        # The process will run in the current terminal window, showing all output
        subprocess.run(command, check=True)
        print("\n--- Data Collection Process Completed Successfully ---")
    except FileNotFoundError:
        print("Error: 'ikapi.py' not found. Make sure it's in the same directory.")
    except subprocess.CalledProcessError as e:
        print(f"Error: The data collection script failed with exit code {e.returncode}.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == '__main__':
    run_collection()