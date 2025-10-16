// analytics_server/dashboard/app.js
// Robust app.js with API fallback (demo mode), dark-mode aware Chart.js,
// auto-refresh, demo banner, and safe update handling.

const API_URL = "/api/analytics"; // relative path; will be real API when served by Flask locally
let chart = null;

// demo fallback (used by Netlify-hosted site when API isn't reachable)
const demoData = {
    latestHealth: "Healthy",
    metrics: [
        { Timestamp: new Date().toISOString(), CpuPercent: 12.01, MemoryMB: 1.79, SecurityEvent: "System check clean", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 15000).toISOString(), CpuPercent: 9.6, MemoryMB: 1.81, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 30000).toISOString(), CpuPercent: 12.63, MemoryMB: 1.82, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 45000).toISOString(), CpuPercent: 12.18, MemoryMB: 1.84, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 60000).toISOString(), CpuPercent: 8.59, MemoryMB: 1.85, SecurityEvent: "Suspicious login event", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 75000).toISOString(), CpuPercent: 9.22, MemoryMB: 1.88, SecurityEvent: "AV alert (quarantined)", HealthStatus: "Warning" },
        { Timestamp: new Date(Date.now() - 90000).toISOString(), CpuPercent: 8.23, MemoryMB: 1.89, SecurityEvent: "System check clean", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 105000).toISOString(), CpuPercent: 5.88, MemoryMB: 1.91, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 120000).toISOString(), CpuPercent: 9.02, MemoryMB: 1.90, SecurityEvent: "No issues", HealthStatus: "Healthy" },
        { Timestamp: new Date(Date.now() - 135000).toISOString(), CpuPercent: 11.04, MemoryMB: 1.92, SecurityEvent: "No issues", HealthStatus: "Healthy" }
    ]
};

// show a small inline demo banner when using fallback data
function showDemoBanner() {
    if (document.getElementById("demo-banner")) return;
    const banner = document.createElement("div");
    banner.id = "demo-banner";
    banner.style.position = "fixed";
    banner.style.top = "80px";
    banner.style.right = "20px";
    banner.style.background = "#fff8e1";
    banner.style.border = "1px solid #ffecb3";
    banner.style.color = "#333";
    banner.style.padding = "10px 14px";
    banner.style.borderRadius = "6px";
    banner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
    banner.style.zIndex = 9999;
    banner.innerHTML = "<strong>Demo mode:</strong> live API not available on this host. Showing demo data.";
    document.body.appendChild(banner);
}

// remove demo banner if present (when API becomes available)
function removeDemoBanner() {
    const b = document.getElementById("demo-banner");
    if (b) b.remove();
}

// fetch metrics with a safe fallback to demoData
async function fetchMetrics() {
    try {
        const res = await fetch(API_URL, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !Array.isArray(data.metrics)) throw new Error("Invalid API response");
        removeDemoBanner();
        updateDashboard(data);
    } catch (err) {
        // fallback
        console.warn("API fetch failed, using demo data:", err.message);
        showDemoBanner();
        updateDashboard(demoData);
    }
}

// update DOM: table, badge, last-updated, chart
function updateDashboard(data) {
    const tableBody = document.querySelector("#metrics-table tbody");
    const healthBadge = document.getElementById("current-health");
    const timestampLabel = document.getElementById("last-updated");

    // defensive: ensure metrics exists and is an array
    const metrics = Array.isArray(data.metrics) ? data.metrics.slice().reverse() : [];

    // update table
    if (tableBody) {
        tableBody.innerHTML = "";
        metrics.forEach((m) => {
            const tr = document.createElement("tr");
            const timeStr = new Date(m.Timestamp).toLocaleTimeString();
            const cpu = (typeof m.CpuPercent === "number") ? `${m.CpuPercent.toFixed(2)}%` : String(m.CpuPercent || "");
            const mem = (typeof m.MemoryMB === "number") ? `${m.MemoryMB.toFixed(2)}` : String(m.MemoryMB || "");
            const event = m.SecurityEvent || "";
            const health = m.HealthStatus || "";
            tr.innerHTML = `<td>${timeStr}</td><td>${cpu}</td><td>${mem}</td><td>${event}</td><td class="${health.toLowerCase()}">${health}</td>`;
            tableBody.appendChild(tr);
        });
    }

    // update health badge
    if (healthBadge) {
        const latest = data.latestHealth || (metrics.length ? metrics[metrics.length - 1].HealthStatus : "Unknown");
        healthBadge.textContent = latest;
        healthBadge.className = `badge ${String(latest || "unknown").toLowerCase()}`;
    }

    // update last-updated label
    if (timestampLabel) {
        timestampLabel.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    // update chart
    updateChart(metrics);
}

// update or create the chart
function updateChart(metrics) {
    const labels = metrics.map(m => new Date(m.Timestamp).toLocaleTimeString());
    const cpuData = metrics.map(m => Number(m.CpuPercent) || 0);
    const memData = metrics.map(m => Number(m.MemoryMB) || 0);

    const canvas = document.getElementById("metricsChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const isDark = document.body.classList.contains("dark");
    const cpuColor = isDark ? "#ffa726" : "#f39c12";
    const memColor = isDark ? "#42a5f5" : "#3498db";

    // create gradients (safe even if repeatedly created)
    const cpuGradient = ctx.createLinearGradient(0, 0, 0, 400);
    cpuGradient.addColorStop(0, cpuColor);
    cpuGradient.addColorStop(1, "rgba(255,255,255,0)");

    const memGradient = ctx.createLinearGradient(0, 0, 0, 400);
    memGradient.addColorStop(0, memColor);
    memGradient.addColorStop(1, "rgba(255,255,255,0)");

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
                        borderWidth: 2
                    },
                    {
                        label: "Memory (MB)",
                        data: memData,
                        borderColor: memColor,
                        backgroundColor: memGradient,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 700, easing: "easeInOutCubic" },
                scales: {
                    x: { ticks: { color: isDark ? "#ddd" : "#333" }, grid: { color: isDark ? "#222" : "#eee" } },
                    y: { beginAtZero: true, ticks: { color: isDark ? "#ddd" : "#333" }, grid: { color: isDark ? "#222" : "#eee" } }
                },
                plugins: {
                    legend: { labels: { color: isDark ? "#fff" : "#000" } },
                    tooltip: {
                        backgroundColor: isDark ? "#222" : "#fff",
                        titleColor: isDark ? "#fff" : "#000",
                        bodyColor: isDark ? "#ccc" : "#333"
                    }
                }
            }
        });
    } else {
        // update data + theme colors
        chart.data.labels = labels;
        chart.data.datasets[0].data = cpuData;
        chart.data.datasets[1].data = memData;

        chart.data.datasets[0].borderColor = cpuColor;
        chart.data.datasets[1].borderColor = memColor;
        chart.data.datasets[0].backgroundColor = cpuGradient;
        chart.data.datasets[1].backgroundColor = memGradient;

        // update axes & legend colors
        if (chart.options && chart.options.scales) {
            chart.options.scales.x.ticks.color = isDark ? "#ddd" : "#333";
            chart.options.scales.y.ticks.color = isDark ? "#ddd" : "#333";
        }
        if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = isDark ? "#fff" : "#000";
        }

        chart.update("active");
    }
}

// Dark mode toggle setup with persistence
function setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
        const isDarkNow = document.body.classList.toggle("dark");
        localStorage.setItem("theme", isDarkNow ? "dark" : "light");
        // Update chart to react to theme change
        if (chart) chart.update();
    });
}

// initialize: start polling
(function init() {
    setupThemeToggle();
    fetchMetrics();
    setInterval(fetchMetrics, 15000);
})();