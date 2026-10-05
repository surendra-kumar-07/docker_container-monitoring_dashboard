# Docker Container Monitoring & Management Dashboard

A web-based DevOps dashboard for monitoring and managing Docker containers.

## Features

- Container status
- Running/stopped counts
- Start, stop and restart containers
- Delete containers
- Container logs
- CPU and memory monitoring
- Docker image list
- Docker version
- Docker health check
- Automatic refresh
- Docker Compose deployment

## Architecture

Browser -> HTML/CSS/JavaScript -> Node.js/Express -> Dockerode -> Docker Engine

## Run on EC2

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Open:

```text
http://YOUR-EC2-PUBLIC-IP:5000
```

Allow TCP port 5000 in the EC2 Security Group, preferably only from your own IP.

## Logs

```bash
docker compose logs -f
```

## Stop

```bash
docker compose down
```

## Security

The application mounts `/var/run/docker.sock`. This provides powerful access to the Docker host. Do not expose this dashboard publicly without authentication, authorization and a safer Docker API access design.

## Suggested GitHub repository

docker-container-monitoring-dashboard
