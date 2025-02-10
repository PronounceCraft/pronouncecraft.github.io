// Search button functionality
document.getElementById("search-button").addEventListener("click", function() {
    var inputText = document.getElementById("input-text").value;
    var outputContainer = document.getElementById("output-container");
    var outputText = document.getElementById("output-text");
    var transcriptionHeader = document.getElementById("phonetic-transcription");
  
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
        // Ensure HTML output is rendered
        outputText.innerHTML = data.output.replace(/\n/g, "<br>"); // Display the output from the server with HTML formatting
        showOutput(data.output); // Show the box with the output
        
        // Show feedback form after output is generated
        setTimeout(function() {
          document.getElementById("surveyModal").style.display = "block"; // Show modal
          document.getElementById("overlay").style.display = "block"; // Show overlay
        }, 10000); // 10 seconds after output
      })
      .catch(error => {
        console.error('Error:', error);
        showOutput("An error occurred while processing your request."); // Show the box with the error message
      });
    } else {
      clearOutput(); // Hide the box if no input is given
    }
  });
  
  // Clear button functionality
  document.getElementById("clear-button").addEventListener("click", function() {
    document.getElementById("input-text").value = "";
    clearOutput(); // Hide the output container
  });
  
  // Copy button functionality
  document.getElementById("copy-button").addEventListener("click", function() {
    var outputTextElement = document.getElementById("output-text");
  
    // Create a range and select the contents of the output-text element
    var range = document.createRange();
    range.selectNodeContents(outputTextElement);
  
    // Clear any previous selections
    var selection = window.getSelection();
    selection.removeAllRanges();
  
    // Add the range to the selection (mimicking manual selection)
    selection.addRange(range);
  
    try {
      // Execute the copy command to copy the selected content
      var successful = document.execCommand('copy');
      if (successful) {
        alert('Text copied to clipboard!');
      } else {
        alert('Failed to copy text.');
      }
    } catch (err) {
      console.error('Error copying text: ', err);
    }
  
    // Clear the selection after copying
    selection.removeAllRanges();
  });
  
  // PDF Button functionality
  document.getElementById("pdf-button").addEventListener("click", function() {
    var outputTextElement = document.getElementById("output-text");
  
    // Clone the element to prevent modifying the original
    var clonedOutput = outputTextElement.cloneNode(true);
  
    // Remove any background color from the cloned content (if present)
    clonedOutput.style.backgroundColor = "transparent";
    clonedOutput.style.width = '100%'; // Ensures it uses the full width available
  
    // Configure the PDF options (margins, filename, etc.)
    var pdfOptions = {
      margin: 0.5, // Adjust margins to fit content better
      filename: 'output.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 }, // Adjust scale for better quality
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
  
    // Generate the PDF
    html2pdf().from(clonedOutput).set(pdfOptions).save();
  });
  
  // Checkbox functionality
  const checkboxes = document.querySelectorAll('.highlight-checkbox');
  checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
          const color = this.dataset.color;
          const checkmark = this.nextElementSibling;
          
          if (this.checked) {
              checkmark.style.borderColor = color;
              checkmark.style.color = color;
          } else {
              checkmark.style.borderColor = color;
              checkmark.style.backgroundColor = 'transparent';
          }
      });
  });

  // Attributes toggle functionality
  const attributesToggle = document.getElementById('attributes-toggle');
  const checkboxContainers = document.querySelectorAll('.checkbox-container');

  attributesToggle.addEventListener('change', function() {
      checkboxContainers.forEach(container => {
          container.style.display = this.checked ? 'inline-flex' : 'none';
      });
  });

  // Initialize checkboxes as hidden
  checkboxContainers.forEach(container => {
      container.style.display = 'none';
  });

  // Show/hide output container and title
  function showOutput(text) {
    const outputContainer = document.getElementById('output-container');
    const transcriptionTitle = document.querySelector('.transcription-title');
    outputContainer.style.display = 'block';
    transcriptionTitle.style.display = 'block';
    document.getElementById('output-text').textContent = text;
  }

  // Clear output and hide container
  function clearOutput() {
    const outputContainer = document.getElementById('output-container');
    const transcriptionTitle = document.querySelector('.transcription-title');
    outputContainer.style.display = 'none';
    transcriptionTitle.style.display = 'none';
    document.getElementById('output-text').textContent = '';
  }

  // Mobile Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navLinks.classList.remove('active');
      });
  });

  