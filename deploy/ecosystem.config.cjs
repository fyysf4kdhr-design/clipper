/* PM2 process config — `pm2 start deploy/ecosystem.config.cjs` */
module.exports = {
  apps: [
    {
      name: "klyp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "768M",
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
      out_file: "logs/klyp-out.log",
      error_file: "logs/klyp-err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
