using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// An example of an agent for the UltraWorld simulator. This class
/// demonstrates a simple emotional memory system combined with a state machine.
/// </summary>
public class AgentController : MonoBehaviour
{
    private StateMachine _stateMachine;
    private List<MemoryEntry> _memory = new List<MemoryEntry>();

    void Start()
    {
        _stateMachine = new StateMachine();
        _stateMachine.ChangeState(new IdleState());
    }

    void Update()
    {
        _stateMachine.Update();
    }

    public void Remember(string @event, float emotion)
    {
        _memory.Add(new MemoryEntry(@event, emotion));
    }

    private class MemoryEntry
    {
        public string Event { get; }
        public float Emotion { get; }

        public MemoryEntry(string evt, float emotion)
        {
            Event = evt;
            Emotion = emotion;
        }
    }

    private interface IState
    {
        void Enter();
        void Update();
        void Exit();
    }

    private class IdleState : IState
    {
        public void Enter() { Debug.Log("Idle"); }
        public void Update() { }
        public void Exit() { }
    }

    private class StateMachine
    {
        private IState _current;

        public void ChangeState(IState newState)
        {
            _current?.Exit();
            _current = newState;
            _current.Enter();
        }

        public void Update()
        {
            _current?.Update();
        }
    }
}
