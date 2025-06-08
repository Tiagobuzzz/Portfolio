import random
"""Pequena demonstração de Q-Learning em um GridWorld sem dependências.

Este script implementa um agente que aprende a navegar em uma grade 5x5 até
alcançar o objetivo. O algoritmo é inteiramente escrito em Python puro para
facilitar a execução em ambientes simples."""

class GridWorld:
    """Ambiente simples de grade para demonstrar Q-Learning."""

    ACTIONS = [(0, -1), (0, 1), (-1, 0), (1, 0)]  # cima, baixo, esquerda, direita

    def __init__(self, width=5, height=5, start=(0, 0), goal=(4, 4)):
        self.width = width
        self.height = height
        self.start = start
        self.goal = goal
        self.state = start

    def reset(self):
        self.state = self.start
        return self.state

    def step(self, action):
        dx, dy = self.ACTIONS[action]
        x, y = self.state
        nx = min(max(x + dx, 0), self.width - 1)
        ny = min(max(y + dy, 0), self.height - 1)
        self.state = (nx, ny)
        reward = 1.0 if self.state == self.goal else -0.04
        done = self.state == self.goal
        return self.state, reward, done

class QLearningAgent:
    def __init__(self, env, alpha=0.1, gamma=0.95, epsilon=0.1):
        self.env = env
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        # Tabela Q armazenada em um dicionário: {(x, y, acao): valor}
        self.q = {}

    def choose_action(self, state):
        if random.random() < self.epsilon:
            return random.randint(0, 3)
        x, y = state
        # Seleciona a ação com maior valor Q conhecido para o estado
        values = [self.q.get((x, y, a), 0.0) for a in range(4)]
        max_value = max(values)
        # Em caso de empate, escolhe aleatoriamente uma das melhores ações
        best_actions = [a for a, v in enumerate(values) if v == max_value]
        return random.choice(best_actions)

    def update(self, state, action, reward, next_state):
        x, y = state
        nx, ny = next_state
        best_next = max(self.q.get((nx, ny, a), 0.0) for a in range(4))
        td_target = reward + self.gamma * best_next
        old_value = self.q.get((x, y, action), 0.0)
        self.q[(x, y, action)] = old_value + self.alpha * (td_target - old_value)

    def train(self, episodes=500):
        for _ in range(episodes):
            state = self.env.reset()
            done = False
            while not done:
                action = self.choose_action(state)
                next_state, reward, done = self.env.step(action)
                self.update(state, action, reward, next_state)
                state = next_state

    def greedy_path(self):
        state = self.env.reset()
        path = [state]
        steps = 0
        while state != self.env.goal and steps < 50:
            action = self.choose_action(state)
            state, _, _ = self.env.step(action)
            path.append(state)
            steps += 1
        return path

if __name__ == "__main__":
    env = GridWorld()
    agent = QLearningAgent(env)
    agent.train(episodes=1000)
    print("Caminho aprendido:", agent.greedy_path())
