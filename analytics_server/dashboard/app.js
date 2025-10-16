// =============================
// PC Protection Dashboard Script
// =============================

const API_URL = "/api/analytics";
let chart = null;

// Fetch metrics from API
async function fetchMetrics() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        updateDashboard(data);
    } catch (err) {
        console.error("❌ Error fetching metrics:", err);
    }
}

// Update dashboard UI
function updateDashboard(data) {
    const tableBody = document.querySelector("#metrics-table tbody");
    const healthBadge = document.getElementById("current-health");
    const timestampLabel = document.getElementById("last-updated");

    const metrics = data.metrics.reverse();
    tableBody.innerHTML = "";

    // Update health badge and timestamp
    healthBadge.textContent = data.latestHealth;
    healthBadge.className = `badge ${data.latestHealth.toLowerCase()}`;
    timestampLabel.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

    metrics.forEach((m) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${new Date(m.Timestamp).toLocaleTimeString()}</td>
      <td>${m.CpuPercent.toFixed(2)}%</td>
      <td>${m.MemoryMB.toFixed(2)}</td>
      <td>${m.SecurityEvent}</td>
      <td class="${m.HealthStatus.toLowerCase()}">${m.HealthStatus}</td>
    `;
        tableBody.appendChild(row);
    });

    // Update Chart
    updateChart(metrics);
}

// Chart rendering
function updateChart(metrics) {
    const labels = metrics.map((m) => new Date(m.Timestamp).toLocaleTimeString());
    const cpuData = metrics.map((m) => m.CpuPercent);
    const memData = metrics.map((m) => m.MemoryMB);

    const ctx = document.getElementById("metricsChart").getContext("2d");

    // Get theme-aware colors
    const isDark = document.body.classList.contains("dark");
    const cpuColor = isDark ? "#ffa726" : "#f39c12";
    const memColor = isDark ? "#42a5f5" : "#3498db";
    const cpuFill = isDark ? "rgba(255,167,38,0.08)" : "rgba(243,156,18,0.1)";
    const memFill = isDark ? "rgba(66,165,245,0.08)" : "rgba(52,152,219,0.1)";

    // Create gradient fills
    const cpuGradient = ctx.createLinearGradient(0, 0, 0, 400);
    cpuGradient.addColorStop(0, cpuColor);
    cpuGradient.addColorStop(1, "transparent");

    const memGradient = ctx.createLinearGradient(0, 0, 0, 400);
    memGradient.addColorStop(0, memColor);
    memGradient.addColorStop(1, "transparent");

    if (!chart) {
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                        label: "CPU (%)",
                        data: cpuData,
                        borderColor: cpuColor,
                        backgroundColor: cpuGradient,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        borderWidth: 2,
                    },
                    {
                        label: "Memory (MB)",
                        data: memData,
                        borderColor: memColor,
                        backgroundColor: memGradient,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 900,
                    easing: "easeInOutQuart",
                },
                scales: {
                    x: {
                        title: { display: true, text: "Time", color: isDark ? "#fff" : "#333" },
                        ticks: { color: isDark ? "#ccc" : "#333" },
                        grid: { color: isDark ? "#2a2a2a" : "#eaeaea" },
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Usage", color: isDark ? "#fff" : "#333" },
                        ticks: { color: isDark ? "#ccc" : "#333" },
                        grid: { color: isDark ? "#2a2a2a" : "#eaeaea" },
                    },
                },
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: isDark ? "#fff" : "#000",
                            font: { size: 12 },
                        },
                    },
                    tooltip: {
                        backgroundColor: isDark ? "#222" : "#fff",
                        titleColor: isDark ? "#fff" : "#000",
                        bodyColor: isDark ? "#ccc" : "#333",
                        borderColor: isDark ? "#555" : "#ddd",
                        borderWidth: 1,
                    },
                },
            },
        });
    } else {
        // Update existing chart
        chart.data.labels = labels;
        chart.data.datasets[0].data = cpuData;
        chart.data.datasets[1].data = memData;

        chart.data.datasets[0].borderColor = cpuColor;
        chart.data.datasets[0].backgroundColor = cpuGradient;
        chart.data.datasets[1].borderColor = memColor;
        chart.data.datasets[1].backgroundColor = memGradient;

        chart.options.scales.x.ticks.color = isDark ? "#ccc" : "#333";
        chart.options.scales.y.ticks.color = isDark ? "#ccc" : "#333";
        chart.options.plugins.legend.labels.color = isDark ? "#fff" : "#000";
        chart.update("active");
    }
}

// 🌙 Dark Mode Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    updateChartTheme();
});

// Apply stored theme
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// Update chart on theme change
function updateChartTheme() {
    if (chart) {
        const data = chart.data.datasets[0].data.length ? chart.data.datasets[0].data : [];
        if (data.length) updateChart(
            chart.data.labels.map((label, i) => ({
                Timestamp: new Date(),
                CpuPercent: chart.data.datasets[0].data[i],
                MemoryMB: chart.data.datasets[1].data[i],
            }))
        );
    }
}

// Start fetching data every 15 seconds
fetchMetrics();
setInterval(fetchMetrics, 15000);