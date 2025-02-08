import re
from flask import Flask, request, jsonify, render_template
import pandas as pd

app = Flask(__name__)

# Load the Excel file
def load_excel(file_path):
    df = pd.read_excel(file_path)
    return df

# Function to get word and IPA for a list of words, modified to handle symbols
def get_words_and_ipa(df, line_words):
    """
    Get words and their corresponding IPA symbols
    Print entire original input when not found in Excel sheet
    Handle words with any symbols between them
    """
    word_to_ipa = dict(zip(df['Words'].str.strip().str.lower().str.replace('\xa0', ''), df['British IPA']))
    words_list = []
    ipa_list = []

    # If no words are found, return the entire input as-is
    if not line_words:
        return line_words, line_words

    for word in line_words:
        # Preserve the entire original word
        words_list.append(word)
        
        # Extract all words, ignoring symbols
        extracted_words = re.findall(r'\b[a-zA-Z]+\b', word)
        
        # If no words found, use the original input
        if not extracted_words:
            ipa_list.append(word)
            continue
        
        # Process each extracted word
        ipa_parts = []
        found_ipa = False
        
        for extracted_word in extracted_words:
            lower_word = extracted_word.lower()
            
            if lower_word in word_to_ipa:
                # If a match is found, use the IPA from the Excel sheet
                ipa_parts.append(word_to_ipa[lower_word])
                found_ipa = True
            else:
                # If not found, use the original word
                ipa_parts.append(extracted_word)
        
        # If no IPA was found for any word, use the entire original input
        if found_ipa:
            # Replace the original words with their IPAs in the original word
            ipa_output = word
            for orig_word, ipa_word in zip(extracted_words, ipa_parts):
                ipa_output = ipa_output.replace(orig_word, ipa_word)
            ipa_list.append(ipa_output)
        else:
            ipa_list.append(word)

    return words_list, ipa_list

# Function to pad words and IPA lists to the same length
def pad_words_and_ipa(words_list, ipa_list):
    padded_words = []
    padded_ipa = []

    for word, ipa_word in zip(words_list, ipa_list):
        max_length = max(len(word), len(ipa_word))
        
        # Pad the word and IPA transcription based on their lengths
        if len(word) < len(ipa_word):
            padded_words.append(word.ljust(max_length))
            padded_ipa.append(ipa_word)
        elif len(ipa_word) < len(word):
            padded_ipa.append(ipa_word.ljust(max_length))
            padded_words.append(word)
        else:  # len(word) == len(ipa_word)
            padded_words.append(word)
            padded_ipa.append(ipa_word)

    return padded_words, padded_ipa

def format_output(words_list, ipa_list, max_width=40):
    """
    Format the output so that English words and IPA symbols are displayed in alternating lines.
    Ensure the English sentence line contains as many words as possible within the max_width,
    and the corresponding IPA symbols are directly below it.
    """
    combined_output = []
    current_line_words = []
    current_line_ipa = []
    current_length = 0

    for word, ipa in zip(words_list, ipa_list):
        if word.strip() == "":
            # If a blank line is encountered, finalize the current lines
            if current_line_words:
                combined_output.append(" ".join(current_line_words))
                combined_output.append(" ".join(current_line_ipa))
                combined_output.append("")  # Add a blank line for separation
                current_line_words = []
                current_line_ipa = []
                current_length = 0
        else:
            # Calculate the length of the current line if the word and IPA are added
            word_length = len(word) + (1 if current_line_words else 0)  # +1 for the space
            ipa_length = len(ipa) + (1 if current_line_ipa else 0)  # +1 for the space
            new_length = max(current_length + word_length, len(" ".join(current_line_ipa)) + ipa_length)

            if new_length-51 <= max_width:
                # If adding the word and IPA does not exceed the max width, add them to the current line
                current_line_words.append(word)
                current_line_ipa.append(ipa)
                current_length = new_length
            else:
                # If adding the word and IPA exceeds the max width, finalize the current lines
                if current_line_words:
                    combined_output.append(" ".join(current_line_words))
                    combined_output.append(" ".join(current_line_ipa))
                    combined_output.append("")  # Add a blank line for separation
                # Start a new line with the current word and IPA
                current_line_words = [word]
                current_line_ipa = [ipa]
                current_length = max(len(word), len(ipa))

    # Add any remaining words and IPA symbols
    if current_line_words:
        combined_output.append(" ".join(current_line_words))
        combined_output.append(" ".join(current_line_ipa))

    return "\n".join(combined_output)

# Load the Excel file once when the app starts
df = load_excel(r'C:\Users\Windows\Documents\IPA_TESTING_nonbreakingspace.xlsx')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('howtouse.html')

@app.route('/howtouse')
def howtouse():
    return render_template('howtouse.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/process', methods=['POST'])
def process_input():
    input_data = request.json.get('input')
    input_words = input_data.split("\n")
    words_list = []
    ipa_list = []
    
    for line in input_words:
        line_words = line.split()
        line_words_list, line_ipa_list = get_words_and_ipa(df, line_words)
        words_list.extend(line_words_list)
        ipa_list.extend(line_ipa_list)
        words_list.append("")  # Add a blank line to mark the end of the paragraph
        ipa_list.append("")  # Add a blank line to mark the end of the paragraph

    padded_words, padded_ipa = pad_words_and_ipa(words_list, ipa_list)
    combined_output = format_output(padded_words, padded_ipa, max_width=40)  # Adjust max_width as needed

    return jsonify({'output': combined_output})

if __name__ == '__main__':
    app.run(debug=True, port=5001)