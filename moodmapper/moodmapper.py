"""Simple mood mapping tool."""

from dataclasses import dataclass
from datetime import datetime
from typing import List

@dataclass
class MoodEntry:
    mood: str
    timestamp: datetime = datetime.now()

class MoodTracker:
    def __init__(self):
        self.entries: List[MoodEntry] = []

    def log_mood(self, mood: str):
        self.entries.append(MoodEntry(mood=mood, timestamp=datetime.now()))

    def summary(self):
        counts = {}
        for entry in self.entries:
            counts[entry.mood] = counts.get(entry.mood, 0) + 1
        return counts

if __name__ == "__main__":
    tracker = MoodTracker()
    tracker.log_mood("happy")
    tracker.log_mood("sad")
    tracker.log_mood("happy")
    print("Mood counts:", tracker.summary())
