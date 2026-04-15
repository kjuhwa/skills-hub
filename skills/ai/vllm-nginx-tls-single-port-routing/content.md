# vllm-nginx-tls-single-port-routing

Place an Nginx TLS proxy in front of two or more vLLM containers so that only port 443 is exposed. Route by path prefix (`/llm/*` → LLM backend, `/embed/*` → embedding backend). vLLM ports stay internal (`expose:`, not `ports:`).

## When to use
- One GPU host serves >1 vLLM model (generation + embedding is typical).
- Clients must speak HTTPS; vLLM itself serves plain HTTP.
- Corporate network allows only 443 outbound from the GPU host.

## Compose shape (key parts)

```yaml
vllm-nginx:
  image: nginx:1.25-alpine
  ports: ["443:443"]
  volumes:
    - ./vllm-nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ../secrets/ssl_server.crt:/etc/nginx/ssl/ssl_server.crt:ro
    - ../secrets/ssl_server.key:/etc/nginx/ssl/ssl_server.key:ro
  depends_on:
    vllm-llm:       { condition: service_healthy }
    vllm-embedding: { condition: service_healthy }
  healthcheck:
    test: ["CMD-SHELL",
      "wget --no-check-certificate -q --spider https://127.0.0.1:443/llm/health && \
       wget --no-check-certificate -q --spider https://127.0.0.1:443/embed/health"]

vllm-llm:
  image: vllm/vllm-openai:${VER_VLLM}
  expose: ["11444"]          # NOT `ports:` — internal only
  # ... --host 0.0.0.0 --port 11444
  deploy:
    resources:
      reservations:
        devices: [{ driver: nvidia, count: all, capabilities: [gpu] }]
```

Nginx conf routes `location /llm/ { proxy_pass http://vllm-llm:11444/; }` and `location /embed/ { ... }`.

## Why
- One firewall hole, not N.
- vLLM upgrades don't change the external port contract.
- Nginx healthcheck composes both backends into one readiness signal.

## Gotchas
- `ipc: host` and `shm_size` are required on the vLLM containers for multi-GPU tensor parallelism.
- `HF_HUB_OFFLINE=1` + `TRANSFORMERS_OFFLINE=1` prevents startup stalls when the host has no internet.
- `start_period: 600s` on vLLM healthcheck — large models take minutes to load weights.
