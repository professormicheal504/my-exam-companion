"""Reset all error-status jobs back to pending so they are retried."""
import sqlite3
from pathlib import Path

db = Path(__file__).parent / "progress.db"
conn = sqlite3.connect(db)
conn.execute("UPDATE audio_jobs SET status='pending', error_msg=NULL WHERE status='error'")
conn.commit()
print(f"Reset {conn.total_changes} jobs back to pending.")
conn.close()
