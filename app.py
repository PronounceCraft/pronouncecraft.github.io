from flask import Flask, render_template, request, jsonify, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    number = data.get('number')
    
    # Input validation
    if not isinstance(number, int) or number < 0:
        return jsonify({'error': 'Please enter a non-negative integer.'}), 400
    
    # Calculate factorial
    factorial = 1
    for i in range(1, number + 1):
        factorial *= i
    
    return jsonify({'result': factorial})

if __name__ == '__main__':
    app.run(debug=True)