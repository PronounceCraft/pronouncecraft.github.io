// Highlight text functionality
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.highlight-checkbox');
    const outputText = document.getElementById('output-text');
    let highlights = new Map();

    // Function to highlight selected text
    function highlightSelection(color) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();
        
        if (selectedText === '') return;

        // Create a unique ID for this highlight
        const highlightId = Date.now().toString();
        
        // Store the highlight information
        highlights.set(highlightId, {
            text: selectedText,
            color: color
        });

        // Create the highlight span
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.opacity = '0.3';
        span.dataset.highlightId = highlightId;
        
        range.surroundContents(span);
        selection.removeAllRanges();
    }

    // Add click event listeners to checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                const color = this.dataset.color;
                
                // Add click event listener to output text when checkbox is checked
                outputText.addEventListener('mouseup', function() {
                    highlightSelection(color);
                });
            } else {
                // Remove click event listener when checkbox is unchecked
                outputText.removeEventListener('mouseup', function() {
                    highlightSelection(color);
                });
            }
        });
    });

    // Copy highlighted text
    document.getElementById('copy-highlighted-button').addEventListener('click', function() {
        const highlightedSpans = outputText.querySelectorAll('span[data-highlight-id]');
        let highlightedText = '';
        
        highlightedSpans.forEach(span => {
            highlightedText += span.textContent + '\n';
        });

        if (highlightedText) {
            navigator.clipboard.writeText(highlightedText.trim())
                .then(() => alert('Highlighted text copied to clipboard!'))
                .catch(err => console.error('Failed to copy text: ', err));
        } else {
            alert('No highlighted text to copy');
        }
    });

    // Download highlighted text as PDF
    document.getElementById('download-highlighted-button').addEventListener('click', function() {
        const highlightedSpans = outputText.querySelectorAll('span[data-highlight-id]');
        let highlightedText = '';
        
        highlightedSpans.forEach(span => {
            highlightedText += span.textContent + '\n';
        });

        if (highlightedText) {
            const element = document.createElement('div');
            element.style.padding = '20px';
            element.innerHTML = highlightedText.replace(/\n/g, '<br>');

            const opt = {
                margin: 1,
                filename: 'highlighted-text.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        } else {
            alert('No highlighted text to download');
        }
    });
});