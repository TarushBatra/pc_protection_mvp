using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading;
using Microsoft.Data.Sqlite;

class Config
{
    public int sampling_interval_seconds { get; set; } = 15;
}

class Program
{
    static string dbPath = "metrics.db";
    static Config config = new Config();

    static void Main()
    {
        Console.WriteLine("PC Protection service starting with SQLite persistence...");

        LoadConfig();

        if (!File.Exists(dbPath))
        {
            CreateDatabase();
            Console.WriteLine($"Created new SQLite database: {dbPath}");
        }

        using var conn = new SqliteConnection($"Data Source={dbPath}");
        conn.Open();

        var cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
        var rnd = new Random();

        while (true)
        {
            double cpuUsage = Math.Round(cpuCounter.NextValue(), 2);
            long memUsage = GC.GetTotalMemory(false);
            string eventMsg = GetRandomEvent(rnd);

            string timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"INSERT INTO Metrics (Timestamp, CpuPercent, MemoryBytes, SecurityEvent)
                                    VALUES ($t, $c, $m, $e)";
                cmd.Parameters.AddWithValue("$t", timestamp);
                cmd.Parameters.AddWithValue("$c", cpuUsage);
                cmd.Parameters.AddWithValue("$m", memUsage);
                cmd.Parameters.AddWithValue("$e", eventMsg);
                cmd.ExecuteNonQuery();
            }

            Console.WriteLine($"{timestamp} | CPU {cpuUsage}% | Mem {memUsage / (1024 * 1024)} MB | Event: {eventMsg}");

            Thread.Sleep(config.sampling_interval_seconds * 1000);
        }
    }

    static void LoadConfig()
    {
        try
        {
            string configPath = "config.json";
            if (File.Exists(configPath))
            {
                string json = File.ReadAllText(configPath);
                config = JsonSerializer.Deserialize<Config>(json) ?? new Config();
                Console.WriteLine($"Loaded config: Sampling every {config.sampling_interval_seconds}s");
            }
            else
            {
                Console.WriteLine("Config file not found, using default (15s).");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading config.json: {ex.Message}");
        }
    }

    static void CreateDatabase()
    {
        using var conn = new SqliteConnection($"Data Source={dbPath}");
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            CREATE TABLE IF NOT EXISTS Metrics (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Timestamp TEXT NOT NULL,
                CpuPercent REAL NOT NULL,
                MemoryBytes INTEGER NOT NULL,
                SecurityEvent TEXT NOT NULL
            );
        ";
        cmd.ExecuteNonQuery();
    }

    static string GetRandomEvent(Random rnd)
    {
        string[] events = { "No issues", "AV alert (quarantined)", "Suspicious login event", "System check clean" };
        return events[rnd.Next(events.Length)];
    }
}
