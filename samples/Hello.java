import java.util.ArrayList;
import java.util.List;

class Task {
    String description;
    boolean done;
    Task(String description) { this.description = description; }
    void complete() { this.done = true; }
}

public class Hello {
    public static void main(String[] args) {
        List<Task> tasks = new ArrayList<>();
        tasks.add(new Task("Write code"));
        tasks.add(new Task("Test program"));
        tasks.get(0).complete();
        for (Task t : tasks) {
            System.out.println(t.description + " - " + (t.done ? "done" : "pending"));
        }
    }
}
