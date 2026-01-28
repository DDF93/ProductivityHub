# PM2 Commands Cheat Sheet

## View Status
- `pm2 status` - See all apps
- `pm2 show productivity-hub-api` - Detailed info

## View Logs
- `pm2 logs` - Live logs (all apps)
- `pm2 logs productivity-hub-api` - Live logs (one app)
- `pm2 logs --lines 100` - Last 100 lines
- `pm2 logs --err` - Errors only

## Control Apps
- `pm2 restart productivity-hub-api` - Restart
- `pm2 stop productivity-hub-api` - Stop
- `pm2 start productivity-hub-api` - Start

## After Code Changes
```
cd ~/ProductivityHub/productivity-hub-backend
git pull origin main
npm install
npm run build
pm2 restart productivity-hub-api --update-env
```

## Emergency
- `pm2 flush` - Clear all logs
- `pm2 resurrect` - Restore saved processes
- `pm2 save` - Save current process list

## Log Locations
- Output: `~/.pm2/logs/productivity-hub-api-out.log`
- Errors: `~/.pm2/logs/productivity-hub-api-error.log`