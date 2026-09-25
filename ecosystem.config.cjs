module.exports = {
  apps: [
    {
      name: "ielc-vite",
      script: "npm",
      args: "run dev",
      autorestart: true,
      watch: false,
    },
    {
      name: "ielc-server",
      script: "php",
      args: "artisan serve --port=8000",
      autorestart: true,
      watch: false,
    },
    {
      name: "ielc-reverb",
      script: "php",
      args: "artisan reverb:start",
      autorestart: true,
      watch: false,
    },
    {
      name: "ielc-worker",
      script: "php",
      args: "artisan queue:work --sleep=3 --tries=3",
      autorestart: true,
      watch: false,
    },
    {
      name: "wa-baileys",
      cwd: "../wa-baileys",
      script: "npm",
      args: "start",
      autorestart: true,
      watch: false,
    }
  ]
};
