#!/bin/bash
# 1) initialize — capture Mcp-Session-Id from response headers
export GH_PAT=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
curl -i -D headers.txt https://api.githubcopilot.com/mcp/ \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "id":"1",
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-06-18",
      "capabilities":{},
      "clientInfo":{"name":"curl-test","version":"1.0.0"}
    }
  }'

# Grab the session id:
SESSION=$(grep -i '^Mcp-Session-Id:' headers.txt | awk -F': ' '{print $2}' | tr -d '\r')

# 2) now tools/list WITH the session id
curl -i https://api.githubcopilot.com/mcp/ \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Mcp-Session-Id: $SESSION" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":"2","method":"tools/list"}'
