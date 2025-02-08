// Global cache for phrasal verbs
let phrasalVerbsCache = null;

// Function to fetch phrasal verbs from the JSON file with caching
function fetchPhrasalVerbs() {
    // If cache exists, return cached promise
    if (phrasalVerbsCache) {
        return Promise.resolve(phrasalVerbsCache);
    }

    return fetch('/static/phrasal_verbs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Cache the phrasal verbs and create an efficient regex
            phrasalVerbsCache = {
                verbs: data.phrasal_verbs,
                regex: new RegExp(`\\b(${data.phrasal_verbs.join('|')})\\b`, 'gi')
            };
            return phrasalVerbsCache;
        })
        .catch(error => {
            console.error('Error fetching phrasal verbs:', error);
            return { verbs: [], regex: null };
        });
}

// Function to highlight phrasal verbs in the output
function highlightPhrasalVerbs(outputText, phrasalVerbData) {
    const phrasalVerbToggle = document.getElementById("Phrasal-verb-toggle");

    // If Phrasal verb toggle is not checked, return the original text without highlighting
    if (!phrasalVerbToggle || !phrasalVerbToggle.checked || !phrasalVerbData.regex) {
        return outputText;
    }

    // First, highlight the directly found phrasal verbs
    let highlightedText = outputText.replace(phrasalVerbData.regex, '<u style="text-decoration-color: black;">$&</u>');

    // Now, check if directly phrasal verb is not found
    phrasalVerbData.verbs.forEach(verb => {
        const parts = verb.split(' '); // Split the phrasal verb into its components
        const partCount = parts.length;

        // Check for two-word phrasal verbs
        if (partCount === 2) {
            const part1 = parts[0];
            const part2 = parts[1];
            const regexPart1 = new RegExp(`\\b${part1}\\w*\\b`, 'gi');
            const regexPart2 = new RegExp(`\\b${part2}\\w*\\b`, 'gi');

            const part1Found = regexPart1.test(outputText);
            const part2Found = regexPart2.test(outputText);

            // (i) Both parts found with intervening words
            if (!part1Found && !part2Found) {
                const interveningRegex = new RegExp(`\\b${part1}\\w*\\b(\\W+\\w+)*\\b${part2}\\w*`, 'gi');
                if (interveningRegex.test(outputText)) {
                    highlightedText = highlightedText.replace(interveningRegex, '<u style="text-decoration-color: black;">$&</u>');
                }
            } else {
                // Highlight both parts only if both are found
                if (part1Found && part2Found) {
                    highlightedText = highlightedText.replace(regexPart1, '<u style="text-decoration-color: black;">$&</u>');
                    highlightedText = highlightedText.replace(regexPart2, '<u style="text-decoration-color: black;">$&</u>');
                }
            }
           

            // (ii) Only part2 found
            if (part2Found && !part1Found) {
                const matchedPart = part2;
                const regexMatched = new RegExp(`\\b${matchedPart}\\w*\\b`, 'gi');
                const matchedIndex = outputText.search(regexMatched);
                const beforeMatched = outputText.slice(0, matchedIndex).trim().split(' ').pop();

                if (beforeMatched.toLowerCase().startsWith(part1[0].toLowerCase())) {
                    highlightedText = highlightedText.replace(regexMatched, '<u style="text-decoration-color: black;">$&</u>');
                    highlightedText = highlightedText.replace(new RegExp(`\\b${beforeMatched}\\w*\\b`, 'gi'), '<u style="text-decoration-color: black;">$&</u>');
                }
            }
        }

        // Check for three-word phrasal verbs
        // Check for three-word phrasal verbs
        else if (partCount === 3) {
            const phrasalVerb = parts.join(' '); // Join the parts to form the complete phrasal verb
            const regexPhrasalVerb = new RegExp(`\\b${phrasalVerb}\\b`, 'gi'); // Create a regex for the entire phrasal verb

            // Test if the entire phrasal verb is found in the output text
            const phrasalVerbFound = regexPhrasalVerb.test(outputText);

            // If the entire phrasal verb is found
            if (phrasalVerbFound) {
                // Highlight the entire phrasal verb in the text
                highlightedText = highlightedText.replace(regexPhrasalVerb, '<u style="text-decoration-color: black;">$&</u>');
            } else {
                // Check for individual parts if the entire phrasal verb is not found
                const foundParts = parts.map(part => new RegExp(`\\b${part}\\b`, 'gi').test(outputText));
                const matchedIndices = foundParts.map((found, index) => found ? index : -1).filter(index => index !== -1);

                // If at least two parts are found
                if (matchedIndices.length >= 2) {
                    const firstMatchedIndex = matchedIndices[0];
                    const secondMatchedIndex = matchedIndices[1];

                    // Ensure the first matched part appears before the second matched part
                    if (firstMatchedIndex < secondMatchedIndex) {
                        // Get the word before the second matched part
                        const beforeMatched = outputText.slice(0, outputText.search(new RegExp(`\\b${parts[secondMatchedIndex]}\\b`, 'gi'))).trim().split(' ').pop();

                        // Check if the word before the second matched part starts with the first matched part's first letter
                        if (beforeMatched.toLowerCase().startsWith(parts[firstMatchedIndex][0].toLowerCase())) {
                            // Highlight the first and second matched parts
                            highlightedText = highlightedText.replace(new RegExp(`\\b${parts[firstMatchedIndex]}\\b`, 'gi'), '<u style="text-decoration-color: black;">$&</u>');
                            highlightedText = highlightedText.replace(new RegExp(`\\b${parts[secondMatchedIndex]}\\b`, 'gi'), '<u style="text-decoration-color: black;">$&</u>');
                            
                            // Highlight the third part as well
                            highlightedText = highlightedText.replace(new RegExp(`\\b${parts[2]}\\b`, 'gi'), '<u style="text-decoration-color: black;">$&</u>');
                            
                        }
                    }
                }
            }
        }

    });

    return highlightedText;
}

// Debounce function to limit the rate of function calls
function debounce(func, delay) {
    let timeoutId;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Global variable to store the last successful server response
let lastServerResponse = null;

// Function to update the output text and highlight if necessary
const updateOutput = debounce(function () {
    var inputText = document.getElementById("input-text").value;
    var outputTextElement = document.getElementById("output-text");

    if (inputText.trim() !== "") {
        // Send the input text to the Flask backend
        fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: inputText })
        })
            .then(response => response.json())
            .then(data => {
                // Store the server response
                lastServerResponse = data.output;

                // Fetch phrasal verbs first
                return fetchPhrasalVerbs().then(phrasalVerbData => {
                    // Highlight phrasal verbs in the server's output
                    const highlightedOutput = highlightPhrasalVerbs(data.output, phrasalVerbData);

                    // Ensure HTML output is rendered
                    outputTextElement.innerHTML = highlightedOutput.replace(/\n/g, "<br>");

                    // Show feedback form after output is generated
                    setTimeout(function () {
                        document.getElementById("surveyModal").style.display = "block";
                        document.getElementById("overlay").style.display = "block";
                    }, 10000);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                // Use last successful response if available
                if (lastServerResponse) {
                    fetchPhrasalVerbs().then(phrasalVerbData => {
                        const highlightedOutput = highlightPhrasalVerbs(lastServerResponse, phrasalVerbData);
                        outputTextElement.innerHTML = highlightedOutput.replace(/\n/g, "<br>");
                    });
                } else {
                    outputTextElement.innerHTML = "An error occurred while processing your request.";
                }
            });
    } else {
        outputTextElement.innerHTML = "Please enter some text.";
    }
}, 100); // Reduced debounce delay to 100ms

// Function to handle immediate highlighting on Phrasal verb toggle
function handlePhrasalVerbToggle() {
    const outputTextElement = document.getElementById("output-text");

    // If we have a last server response, immediately re-highlight
    if (lastServerResponse) {
        fetchPhrasalVerbs().then(phrasalVerbData => {
            const highlightedOutput = highlightPhrasalVerbs(lastServerResponse, phrasalVerbData);
            outputTextElement.innerHTML = highlightedOutput.replace(/\n/g, "<br>");
        });
    }
}

// Function to handle attributes toggle
function handleAttributesToggle() {
    const attributesToggle = document.getElementById('attributes-toggle');
    const highlightCheckboxes = document.querySelectorAll('.highlight-checkbox');

    if (!attributesToggle.checked) {
        // If attributes toggle is off, uncheck all highlight checkboxes
        highlightCheckboxes.forEach(checkbox => {
            checkbox.checked = false;

            // Trigger change event to update highlighting
            checkbox.dispatchEvent(new Event('change'));
        });
    }
}

// Event listener for the search button
document.getElementById("search-button").addEventListener("click", updateOutput);

// Event listener for the Phrasal verb toggle
document.getElementById("Phrasal-verb-toggle").addEventListener("change", handlePhrasalVerbToggle);

// Add event listener to attributes toggle
document.getElementById('attributes-toggle').addEventListener('change', handleAttributesToggle);

// Reset scroll position to top of the page on load
window.addEventListener('load', function () {
    window.scrollTo(0, 0);
});