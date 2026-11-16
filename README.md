# Node.js Docker application

Node.js HTTP service that checks its PostgreSQL connection at startup and exposes
`/health` for a database-aware health check.

## Run locally

Copy `.env.example` to `.env`, set a strong `POSTGRES_PASSWORD`, then start the
app and database:

```sh
docker compose up --build
```

Check `http://localhost:3000/health` and inspect startup output with
`docker compose logs app`. Stop the services with `docker compose down`; add
`-v` only if you also intend to delete the persisted PostgreSQL data.

## Build a commit-tagged image

```sh
docker build -t <dockerhub-username>/nodeapp:$(git rev-parse --short HEAD) .
```

The standalone image requires PostgreSQL connection settings when run outside
Compose. Compose supplies them and starts PostgreSQL as the `db` service.

## GitHub Actions and EC2 deployment

On pushes to `main`, `.github/workflows/ci.yml` runs the Node build, builds and
pushes Docker Hub images tagged with the branch and short commit SHA, then
deploys the SHA-tagged image to EC2 with Docker Compose.

Configure these GitHub Actions **secrets**:

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub account name |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token with read/write access |
| `EC2_HOST` | EC2 public DNS name or IP |
| `EC2_USERNAME` | SSH user on the instance (for example, `ubuntu`) |
| `EC2_SSH_KEY` | Private SSH key for the instance |
| `EC2_HOST_FINGERPRINT` | SSH host-key fingerprint, for example `SHA256:...` |
| `EC2_DEPLOY_PATH` | Absolute directory for Compose deployment files, for example `/home/ubuntu/nodeapp` |

The deployment directory must already exist and have Docker Engine and the
Docker Compose plugin installed. Before the first deployment, create its `.env`
file from `.env.example` and set a strong `POSTGRES_PASSWORD`; the workflow
copies `docker-compose.yml` there but does not overwrite that file or include
database credentials in the repository. Make the EC2 security group allow
inbound TCP port 3000 (and SSH only from trusted addresses).

Obtain the EC2 SSH host-key fingerprint through a trusted channel and configure
it as `EC2_HOST_FINGERPRINT` so the deployment actions can verify the host.
For an existing deployment that was previously managed with PM2, stop and
remove the PM2 process before exposing port 3000.

To deploy manually on EC2 after configuring `.env`:

```sh
IMAGE_TAG=<dockerhub-username>/nodeapp:<short-commit-sha> docker compose pull app
IMAGE_TAG=<dockerhub-username>/nodeapp:<short-commit-sha> docker compose up -d
docker compose logs -f
```
