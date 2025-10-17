// =============================
// PC Protection Dashboard Script (Universal Version)
// =============================

// Detect if running on Netlify or Localhost
const IS_NETLIFY = window.location.hostname.includes("netlify");
const API_URL = IS_NETLIFY ? null : "http://127.0.0.1:5000/api/analytics";

let chart = null;

// 🌐 Demo fallback dataset for Netlify
const DEMO_DATA = {
    latestHealth: "Healthy",
    metrics: [
        { Timestamp: new Date(Date.now() - 90000), CpuPercent: 12.8, MemoryMB: 56.1, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 80000), CpuPercent: 15.2, MemoryMB: 56.2, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 70000), CpuPercent: 20.1, MemoryMB: 56.3, SecurityEvent: "AV alert (quarantined)", HealthStatus: "Warning" },
        { Timestamp: new Date(Date.now() - 60000), CpuPercent: 9.3, MemoryMB: 56.1, SecurityEvent: "System check clean", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 50000), CpuPercent: 18.7, MemoryMB: 56.0, SecurityEvent: "Suspicious login event", HealthStatus: "Warning" },
        { Timestamp: new Date(Date.now() - 40000), CpuPercent: 13.5, MemoryMB: 56.2, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 30000), CpuPercent: 10.2, MemoryMB: 56.4, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 20000), CpuPercent: 7.6, MemoryMB: 56.2, SecurityEvent: "AV alert (quarantined)", HealthStatus: "Warning" },
        { Timestamp: new Date(Date.now() - 10000), CpuPercent: 11.4, MemoryMB: 56.3, SecurityEvent: "System check clean", HealthStatus: "Healthy" },
        { Timestamp: new Date(), CpuPercent: 8.9, MemoryMB: 56.1, SecurityEvent: "No issues", HealthStatus: "Healthy" },
    ],
};

// ============================================
// Fetch metrics (API or fallback demo data)
// ============================================
async function fetchMetrics() {
    try {
        if (!IS_NETLIFY) {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Bad API response");
            const data = await res.json();
            updateDashboard(data);
        } else {
            console.warn("🌐 Netlify mode — using demo data");
            updateDashboard(DEMO_DATA);
            showDemoBanner();
        }
    } catch (err) {
        console.warn("⚠️ API unreachable, switching to demo data:", err);
        updateDashboard(DEMO_DATA);
        showDemoBanner();
    }
}

// ============================================
// Update dashboard UI
// ============================================
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

    updateChart(metrics);
}

// ============================================
// Chart Rendering with Theme Awareness
// ============================================
function updateChart(metrics) {
    const labels = metrics.map((m) => new Date(m.Timestamp).toLocaleTimeString());
    const cpuData = metrics.map((m) => m.CpuPercent);
    const memData = metrics.map((m) => m.MemoryMB);
    const ctx = document.getElementById("metricsChart").getContext("2d");

    const isDark = document.body.classList.contains("dark");
    const cpuColor = isDark ? "#ffa726" : "#f39c12";
    const memColor = isDark ? "#42a5f5" : "#3498db";
    const cpuFill = isDark ? "rgba(255,167,38,0.08)" : "rgba(243,156,18,0.1)";
    const memFill = isDark ? "rgba(66,165,245,0.08)" : "rgba(52,152,219,0.1)";

    // Gradients for modern style
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
                        labels: { color: isDark ? "#fff" : "#000", font: { size: 12 } },
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
        // Update existing chart dynamically
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

// ============================================
// 🌙 Dark Mode Support
// ============================================
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    fetchMetrics();
});

// Load saved theme on startup
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// ============================================
// 🧩 Demo Banner (for Netlify mode)
// ============================================
function showDemoBanner() {
    if (document.getElementById("demo-banner")) return;
    const banner = document.createElement("div");
    banner.id = "demo-banner";
    banner.textContent = "⚙️ Running in Demo Mode (Netlify)";
    banner.style.position = "fixed";
    banner.style.bottom = "10px";
    banner.style.right = "10px";
    banner.style.padding = "8px 14px";
    banner.style.background = "#3498db";
    banner.style.color = "white";
    banner.style.borderRadius = "6px";
    banner.style.fontSize = "14px";
    banner.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    document.body.appendChild(banner);
}

// ============================================
// ⏱ Auto Refresh
// ============================================
fetchMetrics();
setInterval(fetchMetrics, 15000);