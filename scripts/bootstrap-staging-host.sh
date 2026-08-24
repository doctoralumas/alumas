#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID:-$(id -u)} -ne 0 ]]; then echo "Bu script sudo/root ile çalıştırılmalı." >&2; exit 2; fi
if ! grep -qiE 'ubuntu|debian' /etc/os-release; then echo "Yalnız Ubuntu/Debian için doğrulandı." >&2; exit 2; fi
apt-get update
apt-get install -y ca-certificates curl gnupg ufw fail2ban jq openssl
install -m 0755 -d /etc/apt/keyrings
if ! command -v docker >/dev/null; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg || true
  chmod a+r /etc/apt/keyrings/docker.gpg || true
  . /etc/os-release
  distro=ubuntu; [[ "${ID:-}" == "debian" ]] && distro=debian
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$distro ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker fail2ban
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
mkdir -p /opt/alumas/staging/releases /opt/alumas/staging/state /opt/alumas/staging/backups /opt/alumas/staging/logs
chmod 750 /opt/alumas /opt/alumas/staging
cat >/etc/docker/daemon.json <<'JSON'
{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}
JSON
systemctl restart docker
echo "HOST BOOTSTRAP COMPLETE. Uygulama kullanıcısını docker grubuna yalnız gerektiğinde ekleyin."
