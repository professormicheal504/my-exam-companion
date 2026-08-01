# My Exam Companion - Backend Architecture (Zero-Cost Setup)

This document outlines the zero-cost (Always Free) backend architecture for **My Exam Companion**. By combining Oracle Cloud's generous free tier with Cloudflare's ecosystem and open-source Docker solutions, the platform can scale to thousands of users without incurring monthly server costs.

## 🏗️ Architecture Overview

The backend is split into three main layers:
1. **Compute & Database Layer (Oracle Cloud + Docker)**
2. **Storage Layer (Cloudflare R2)**
3. **CDN & Security Layer (Cloudflare)**

---

## 1. Compute & Database Layer (Oracle Cloud Infrastructure)
Oracle Cloud Infrastructure (OCI) offers the most generous "Always Free" tier in the industry.

* **Server:** OCI ARM Ampere A1 Compute instance. 
  * *Free limits:* Up to 4 ARM cores and 24GB of RAM.
  * *OS:* Ubuntu Server (ARM64).
* **Bandwidth:** OCI provides a massive **10TB per month** of free outbound data transfer, which is more than enough for API traffic.
* **Backend Stack (Docker):** We use Docker on the Oracle instance to host the database and authentication system.
  * **Recommendation: [PocketBase](https://pocketbase.io/) or [Appwrite](https://appwrite.io/)**
    * *Why?* Since you want authentication and database hosted in Docker, **PocketBase** is highly recommended. It is a single-file backend (SQLite + Auth API) that runs flawlessly in a Docker container on ARM architecture. It handles user registration, login, JWT tokens, and your CBT questions/scores database out of the box with zero configuration.

## 2. Storage & Media Layer (Cloudflare R2)
Because education apps serve large files (Topic Videos, Past Question images, Brochure PDFs), serving them from the Oracle server directly would waste compute resources.

* **Service:** Cloudflare R2 Object Storage.
* *Free limits:* 
  * 10 GB storage per month.
  * 1 million write operations / 10 million read operations per month.
  * **Zero Egress Fees:** You are not charged for bandwidth when users stream videos or download PDFs.
* **Usage:** Your Oracle server (via Docker) generates pre-signed URLs or directly uploads files to R2 via the S3-compatible API. The frontend web application fetches videos and PDFs directly from the Cloudflare R2 public bucket.

## 3. CDN & Security (Cloudflare)
To protect your Oracle server and speed up the web application, all traffic goes through Cloudflare.

* **Service:** Cloudflare Free Tier.
* **DNS:** Point your domain to Cloudflare.
* **Proxy (Orange Cloud):** Proxy the traffic to your Oracle IP address. This hides your server's true IP and provides free SSL/TLS certificates.
* **Caching:** Cloudflare will cache your static HTML, CSS, and JS files (like the `jamb_cbt_board.html`), reducing the load on your Oracle server to near zero for frontend assets.

---

## 🛠️ Step-by-Step Implementation Guide

### Phase 1: Set up the Oracle Server
1. Create an Oracle Cloud account and launch an **Always Free ARM Ampere A1** instance.
2. Open port `80` and `443` in the Oracle Virtual Cloud Network (VCN) Ingress rules.
3. SSH into the server and install Docker and Docker Compose.

### Phase 2: Deploy Auth & Database (Docker)
1. Create a `docker-compose.yml` on the server for your backend (e.g., PocketBase).
```yaml
version: "3.7"
services:
  pocketbase:
    image: ghcr.io/pocketbase/pocketbase:latest
    container_name: auth-backend
    restart: unless-stopped
    command: serve --http=0.0.0.0:8090
    volumes:
      - ./pb_data:/pb/pb_data
    ports:
      - "8090:8090"
```
2. Run `docker-compose up -d`. Your authentication and database API is now live.

### Phase 3: Configure Cloudflare R2
1. Go to the Cloudflare Dashboard and enable R2.
2. Create a bucket named `exam-companion-media`.
3. Go to Bucket Settings and connect a Custom Domain (e.g., `cdn.myexamcompanion.com`) to make the files publicly accessible without authentication.
4. Generate R2 API Tokens (S3 compatible) and add them to your Oracle Docker environment variables so your backend can upload files.

### Phase 4: Secure the Connection
1. In Cloudflare DNS, create an `A` record pointing `api.myexamcompanion.com` to your Oracle public IP and turn ON the proxy (Orange Cloud).
2. Set up a reverse proxy (like Nginx or Caddy) in Docker on your Oracle server to forward traffic from port 80/443 to your PocketBase container on port 8090.

## 🚀 Summary of the Free Tier Limits
| Service | Role | Monthly Free Limit |
|---------|------|--------------------|
| **Oracle OCI** | Backend API & Database | 4 ARM Cores, 24GB RAM, 10TB Bandwidth |
| **PocketBase** | Auth & DB Software | 100% Free / Open Source |
| **Cloudflare R2** | Video & PDF Storage | 10GB Storage, $0 Egress Fees |
| **Cloudflare CDN** | Security, Caching, SSL | Unlimited bandwidth for cached assets |

*This architecture ensures that My Exam Companion remains completely free to operate while being robust enough to handle high traffic from students.*
