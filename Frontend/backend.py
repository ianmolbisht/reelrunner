from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()

    print("🔥 Received JSON from frontend:")
    print(data)

    return jsonify({
        "message": "Backend received your JSON successfully",
        "received_data": data
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
