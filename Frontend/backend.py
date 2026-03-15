from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/generate", methods=["POST"])
def generate():

    data = request.get_json()

    keywords = data.get("keywords")
    theme = data.get("theme")
    duration = data.get("duration")
    num_reels = data.get("num_reels")

    # Write parameters to a separate file
    with open("received_data.txt", "a") as file:
        file.write("Received Parameters from Frontend:\n")
        file.write(f"Keywords: {keywords}\n")
        file.write(f"Theme: {theme}\n")
        file.write(f"Duration: {duration}\n")
        file.write(f"Number of Reels: {num_reels}\n")
        file.write("-" * 40 + "\n")

    response = {
        "status": "success",
        "returned_parameters": {
            "keywords": keywords,
            "theme": theme,
            "duration": duration,
            "num_reels": num_reels
        }
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True, port=8000)