# Real-time Chat App (DevOps portfolio project)

Socket.IO + Redis pub/sub + PostgreSQL, behind Nginx, with CI/CD, Kubernetes, and monitoring.

## Run locally (3 backend replicas)
    docker compose up --build --scale backend=3
Open http://localhost:8080 in two browser tabs, join the same room, and chat.
Each join message shows which replica served you.

- Prometheus: http://localhost:9090 (query `chat_active_connections`)
- Grafana: http://localhost:3001 (admin/admin, add Prometheus at http://prometheus:9090)

## Kubernetes (minikube or kind)
    kubectl create secret generic chat-secret --from-literal=db-password=CHANGE_ME
    # edit image name in k8s/app.yaml, then:
    kubectl apply -f k8s/app.yaml
    minikube service chat-backend

## CI
GitHub Actions builds, tests, scans, and pushes the image to GHCR on every push to main.

## Next steps
Terraform for AWS, Helm chart, ArgoCD, JWT auth, alert rules.
