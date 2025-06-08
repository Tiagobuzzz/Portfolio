class MemoryEntry:
    def __init__(self, event, emotion):
        self.event = event
        self.emotion = emotion

class NPC:
    def __init__(self, name):
        self.name = name
        self.memories = []

    def remember(self, event, emotion):
        self.memories.append(MemoryEntry(event, emotion))

    def recall(self):
        print(f"Memories of {self.name}:")
        for m in self.memories:
            print(f"- {m.event} ({m.emotion})")

if __name__ == "__main__":
    npc = NPC("Zara")
    npc.remember("met hero", "joy")
    npc.remember("lost battle", "anger")
    npc.recall()
