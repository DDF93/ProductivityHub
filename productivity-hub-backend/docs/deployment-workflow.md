# Deployment Workflow

## Standard Deployment

### On Windows (local):
1. Make code changes
2. Test locally
3. `git add .`
4. `git commit -m "Description"`
5. `git push origin main`

### On EC2 (production):
```
cd ~/ProductivityHub/productivity-hub-backend
git pull origin main
npm install
npm run build
pm2 restart productivity-hub-api --update-env
pm2 status
curl https://api.productivityhub.app/health
```

### If Database Changed:
```
cd ~/ProductivityHub/productivity-hub-backend
npm run migrate
```

### Verify:
```
cd ~
./check-health.sh
pm2 logs productivity-hub-api --lines 50
```

## Emergency Rollback
```
cd ~/ProductivityHub/productivity-hub-backend
git log --oneline -n 5
git reset --hard HEAD~1
npm install
npm run build
pm2 restart productivity-hub-api
```

## Deployment Checklist

Before:
- [ ] Code tested locally
- [ ] Committed and pushed to GitHub
- [ ] Migrations ready (if needed)

After:
- [ ] Health check passes
- [ ] No errors in PM2 logs
- [ ] Mobile app still works