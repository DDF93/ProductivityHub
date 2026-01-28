# ProductivityHub Production Docs

**Server:** 13.42.57.60 (AWS EC2 Ubuntu)
**Domain:** api.productivityhub.app

## Quick Commands

**Health check:** `cd ~ && ./check-health.sh`
**View logs:** `pm2 logs productivity-hub-api`
**Deploy:** `cd ~/ProductivityHub/productivity-hub-backend && git pull && npm install && npm run build && pm2 restart productivity-hub-api`

## Documentation Files

- `environment-variables.md` - All .env variables
- `pm2-commands.md` - Process management
- `deployment-workflow.md` - How to deploy
- `../monitoring-reference.md` - Health checks
- `../troubleshooting.md` - Problem solving

## Architecture
```
[Mobile App] → [Nginx:443] → [Node.js:3000] → [PostgreSQL]
                   ↓
          [Let's Encrypt SSL]
                   ↓
           [PM2 + Monitoring]
```

## Key Locations

**Code:** `~/ProductivityHub/productivity-hub-backend/`
**Config:** `~/ProductivityHub/productivity-hub-backend/.env`
**Logs:** `~/.pm2/logs/`
**Scripts:** `~/check-health.sh`, `~/send-alert.sh`

## Emergency

**API down:**
1. `./check-health.sh`
2. `pm2 logs productivity-hub-api --err --lines 50`
3. `pm2 restart productivity-hub-api`

**Server unresponsive:**
1. Try SSH
2. If SSH works: run health check
3. If SSH fails: reboot from AWS Console
4. After reboot: `pm2 resurrect`