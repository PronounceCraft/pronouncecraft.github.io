import React, { useState, useEffect, useRef } from 'react';
import { Mic, Book, Settings, Menu, Copy, Download, X, CheckSquare } from 'lucide-react';
import html2pdf from 'html2pdf.js';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [outputText, setOutputText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [showAttributes, setShowAttributes] = useState(false);
  const [highlights, setHighlights] = useState({
    mispronounced: false,
    mostlySpoken: false,
    phrasalVerb: false,
    syllables: false,
    correctionSpoken: false
  });

  const outputRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated placeholder effect
  useEffect(() => {
    const placeholderText = "Paste your text or paragraph here";
    let index = 0;
    let interval: NodeJS.Timeout;

    const type = () => {
      if (index < placeholderText.length) {
        setPlaceholder(prev => placeholderText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    };

    interval = setInterval(type, 50);
    return () => clearInterval(interval);
  }, []);

  const handleGetIPA = async () => {
    if (inputText.trim() === '') {
      setShowOutput(false);
      return;
    }

    try {
      const response = await fetch('/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: inputText })
      });
      const data = await response.json();
      setOutputText(data.output);
      setShowOutput(true);
    } catch (error) {
      console.error('Error:', error);
      setOutputText('An error occurred while processing your request.');
      setShowOutput(true);
    }
  };

  const handleCopy = () => {
    if (outputRef.current) {
      const range = document.createRange();
      range.selectNodeContents(outputRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand('copy');
          alert('Text copied to clipboard!');
        } catch (err) {
          console.error('Error copying text:', err);
          alert('Failed to copy text.');
        }
        selection.removeAllRanges();
      }
    }
  };

  const handleDownloadPDF = () => {
    if (outputRef.current) {
      const element = outputRef.current.cloneNode(true) as HTMLElement;
      element.style.backgroundColor = 'transparent';
      element.style.width = '100%';

      const opt = {
        margin: 0.5,
        filename: 'output.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-8 h-8 text-pink-500" />
              <span className="text-2xl font-bold text-white">PronounceCraft</span>
            </div>
            
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-full left-0 w-full md:w-auto bg-black/90 md:bg-transparent mt-2 md:mt-0`}>
              <ul className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0">
                <li><a href="#" className="text-white hover:text-pink-400 transition">Home</a></li>
                <li><a href="#about" className="text-white hover:text-pink-400 transition">About</a></li>
                <li><a href="#features" className="text-white hover:text-pink-400 transition">Features</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Master Your Pronunciation
          </h1>
          <p className="text-xl text-gray-300">
            Transform text into precise phonetic transcriptions instantly
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 p-4 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/20 focus:border-pink-500 focus:ring-2 focus:ring-pink-500 transition"
              placeholder={placeholder}
              onFocus={() => textareaRef.current && textareaRef.current.value === '' && setPlaceholder('')}
              onBlur={() => textareaRef.current && textareaRef.current.value === '' && setPlaceholder("Paste your text or paragraph here")}
            />
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => {
                  setInputText('');
                  setShowOutput(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
              <button
                onClick={handleGetIPA}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition"
              >
                Get IPA
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        {showOutput && (
          <div className="max-w-4xl mx-auto mt-12 bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Phonetic Transcription</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={showAttributes}
                      onChange={(e) => setShowAttributes(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-pink-500 rounded focus:ring-pink-500"
                    />
                    <span>Attributes</span>
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {showAttributes && (
              <div className="flex flex-wrap gap-4 mb-4">
                {Object.entries(highlights).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setHighlights(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="form-checkbox h-4 w-4 text-pink-500 rounded focus:ring-pink-500"
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="bg-black/30 rounded-lg p-4">
              <pre ref={outputRef} className="text-gray-300 font-mono whitespace-pre-wrap">
                {outputText}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">About</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Help</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition">How to Use</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Updates</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition">What's New</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Upcoming</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:contact@pronouncecraft.com" className="text-gray-300 hover:text-white transition">Email Us</a></li>
                <li><span className="text-gray-300">Phone: +1 234 567 890</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 PronounceCraft. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;