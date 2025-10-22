import os
import subprocess
import sys

# --- Configuration ---
API_TOKEN = "b7eabe08fb3e7e21fb666dca1d3ff378dc5f991b"
OUTPUT_DIR = "CaseLawData"
QUERY_FILE = "queries.txt"
PAGES_PER_QUERY = 20  # WARNING: Set this to a low number (e.g., 2) for testing to manage costs.

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
    Writes queries to a file and executes the ikapi.py script to download data.
    """
    print("--- Starting Data Collection Process ---")

    # 1. Flatten all queries from the dictionary into a single list
    all_queries = []
    for category, subcategories in QUERIES_BY_CATEGORY.items():
        for subcategory, queries in subcategories.items():
            all_queries.extend(queries)

    # 2. Write all queries to the input file
    try:
        with open(QUERY_FILE, 'w', encoding='utf-8') as f:
            for query in all_queries:
                f.write(f"{query}\n")
        print(f"Successfully created '{QUERY_FILE}' with {len(all_queries)} queries.")
    except IOError as e:
        print(f"Error: Could not write to file {QUERY_FILE}. {e}")
        return

    # 3. Construct the command to run ikapi.py
    command = [
        sys.executable,  # Use the same python interpreter that is running this script
        "ikapi.py",
        "-s", API_TOKEN,
        "-D", OUTPUT_DIR,
        "-Q", QUERY_FILE,
        "-p", str(PAGES_PER_QUERY),
        "--pathbysrc"
    ]

    print(f"\nExecuting command: {' '.join(command)}\n")

    # 4. Run the ikapi.py script as a subprocess
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