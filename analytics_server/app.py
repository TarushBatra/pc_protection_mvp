import os
import sqlite3
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="dashboard", static_url_path="")
CORS(app)

# ✅ Absolute path to metrics.db
DB_PATH = r"C:\Users\Tarushlol\OneDrive\Desktop\pc_protection_mvp\pc_protection\PcProtection\metrics.db"


# -------------------------------
# Utility: Compute System Health
# -------------------------------
def compute_health(cpu, mem_mb, event):
    if "Critical" in event or "unauthorized" in event.lower():
        return "Critical"
    if cpu > 85 or mem_mb > 6000:
        return "Critical"
    if cpu > 60 or mem_mb > 4000 or "alert" in event.lower():
        return "Warning"
    return "Healthy"


# -------------------------------
# API Endpoint for Analytics Data
# -------------------------------
@app.route("/api/analytics", methods=["GET"])
def api_analytics():
    if not os.path.exists(DB_PATH):
        return jsonify({"error": "metrics.db not found"}), 404

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute(
            "SELECT Timestamp, CpuPercent, MemoryBytes, SecurityEvent FROM Metrics ORDER BY Id DESC LIMIT 10"
        )
        rows = cur.fetchall()
        conn.close()

        metrics = []
        for r in rows:
            mem_mb = round(r["MemoryBytes"] / (1024 * 1024), 2)
            health = compute_health(r["CpuPercent"], mem_mb, r["SecurityEvent"])
            metrics.append(
                {
                    "Timestamp": r["Timestamp"],
                    "CpuPercent": r["CpuPercent"],
                    "MemoryMB": mem_mb,
                    "SecurityEvent": r["SecurityEvent"],
                    "HealthStatus": health,
                }
            )

        latest_health = metrics[0]["HealthStatus"] if metrics else "Unknown"
        return jsonify({"latestHealth": latest_health, "metrics": metrics})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------
# Serve the Dashboard Frontend
# -------------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_dashboard(path):
    dashboard_path = os.path.join(os.getcwd(), "dashboard")

    if path != "" and os.path.exists(os.path.join(dashboard_path, path)):
        return send_from_directory(dashboard_path, path)
    else:
        # Default to index.html if path not found
        return send_from_directory(dashboard_path, "index.html")


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    print("=============================================")
    print("🚀 PC Protection Analytics Server Starting")
    print(f"📁 Serving Dashboard from: {os.path.join(os.getcwd(), 'dashboard')}")
    print(f"🗄️ Database Path: {DB_PATH}")
    print("=============================================")

    if not os.path.exists(DB_PATH):
        print(f"[WARNING] Database not found: {DB_PATH}")
    else:
        print(f"[INFO] Connected to database: {DB_PATH}")

    app.run(host="0.0.0.0", port=5000)
