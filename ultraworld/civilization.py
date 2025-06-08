"""Example module from the UltraWorld project demonstrating a simple 
civilization simulation with evolving religions and emotional climate."""

from dataclasses import dataclass, field
from typing import Dict, List
import random

@dataclass
class Religion:
    name: str
    followers: int

@dataclass
class Civilization:
    name: str
    population: int
    emotions: Dict[str, float] = field(default_factory=lambda: {"joy": 0.5, "anger": 0.0})
    religions: List[Religion] = field(default_factory=list)

    def grow_population(self):
        growth = int(self.population * random.uniform(0.01, 0.05))
        self.population += growth
        self.emotions["joy"] = min(1.0, self.emotions["joy"] + 0.01)

    def evolve_religion(self):
        if random.random() < 0.1:
            new_religion = Religion(name=f"Cult_{len(self.religions)+1}", followers=1)
            self.religions.append(new_religion)
        else:
            if self.religions:
                choice = random.choice(self.religions)
                choice.followers += random.randint(1, 5)

if __name__ == "__main__":
    civ = Civilization(name="Auroria", population=100)
    for _ in range(10):
        civ.grow_population()
        civ.evolve_religion()
        print(civ)
