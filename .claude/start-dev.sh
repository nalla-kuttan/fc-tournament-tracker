#!/bin/bash
export PATH="/Users/ruban/.nvm/versions/node/v22.20.0/bin:$PATH"
cd /Users/Shared/claudecode/inner-celestial
exec npx next dev "$@"
