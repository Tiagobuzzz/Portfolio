using System;
using System.Collections.Generic;

class WordCount
{
    static void Main()
    {
        string text = "hello world hello agent";
        var counts = new Dictionary<string, int>();
        foreach (var word in text.Split(' '))
        {
            if (!counts.ContainsKey(word))
                counts[word] = 0;
            counts[word]++;
        }

        foreach (var pair in counts)
            Console.WriteLine($"{pair.Key}: {pair.Value}");
    }
}
