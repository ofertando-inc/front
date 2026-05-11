#!/bin/sh
set -e

rm -f /app/build/client/config.js.br /app/build/client/config.js.gz

cat > /app/build/client/config.js <<EOF
window.APP_CONFIG = { API_URL: "${PUBLIC_API_URL:-}" };
EOF

exec node build
