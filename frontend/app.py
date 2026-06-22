from flask import Flask, render_template, request, redirect
import psycopg2
import os

app = Flask(__name__)

def get_db():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"),
        database=os.environ.get("DB_NAME", "votes"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "password")
    )

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/vote", methods=["POST"])
def vote():
    choice = request.form.get("vote")
    if choice not in ["cats", "dogs"]:
        return redirect("/")
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO votes (choice) VALUES (%s)", (choice,)
    )
    conn.commit()
    cur.close()
    conn.close()
    return redirect("/results")

@app.route("/results")
def results():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT choice, COUNT(*) FROM votes GROUP BY choice")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    counts = {"cats": 0, "dogs": 0}
    for row in rows:
        counts[row[0]] = row[1]
    return render_template("results.html", counts=counts)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)