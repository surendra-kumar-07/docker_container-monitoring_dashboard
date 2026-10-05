const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");

const app = express();
const PORT = 5000;

const docker = new Docker({
  socketPath: "/var/run/docker.sock"
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", async (req, res) => {
  try {
    await docker.ping();
    res.json({ status: "healthy", docker: "connected" });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

app.get("/api/info", async (req, res) => {
  try {
    const info = await docker.info();
    res.json({
      containers: info.Containers,
      running: info.ContainersRunning,
      stopped: info.ContainersStopped,
      paused: info.ContainersPaused,
      images: info.Images,
      version: info.ServerVersion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/containers", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });

    res.json(containers.map(c => ({
      id: c.Id.substring(0, 12),
      name: c.Names?.[0]?.replace("/", "") || "Unknown",
      image: c.Image,
      state: c.State,
      status: c.Status
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/containers/:id/start", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).start();
    res.json({ success: true, message: "Container started" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/containers/:id/stop", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).stop();
    res.json({ success: true, message: "Container stopped" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/containers/:id/restart", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).restart();
    res.json({ success: true, message: "Container restarted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/containers/:id", async (req, res) => {
  try {
    await docker.getContainer(req.params.id).remove({ force: true });
    res.json({ success: true, message: "Container deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/containers/:id/logs", async (req, res) => {
  try {
    const logs = await docker.getContainer(req.params.id).logs({
      stdout: true,
      stderr: true,
      tail: 100,
      timestamps: true
    });

    res.type("text/plain").send(logs.toString());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/containers/:id/stats", async (req, res) => {
  try {
    const stats = await docker.getContainer(req.params.id).stats({
      stream: false
    });

    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;

    const systemDelta =
      stats.cpu_stats.system_cpu_usage -
      stats.precpu_stats.system_cpu_usage;

    const onlineCPUs =
      stats.cpu_stats.online_cpus ||
      stats.cpu_stats.cpu_usage.percpu_usage?.length ||
      1;

    const cpu =
      systemDelta > 0 && cpuDelta > 0
        ? (cpuDelta / systemDelta) * onlineCPUs * 100
        : 0;

    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 1;
    const memory = (memoryUsage / memoryLimit) * 100;

    res.json({
      cpu: cpu.toFixed(2),
      memory: memory.toFixed(2),
      memoryUsage,
      memoryLimit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/images", async (req, res) => {
  try {
    const images = await docker.listImages();

    res.json(images.map(image => ({
      id: image.Id.replace("sha256:", "").substring(0, 12),
      tags: image.RepoTags || [],
      size: (image.Size / 1024 / 1024).toFixed(2) + " MB"
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Docker Dashboard running on port ${PORT}`);
});