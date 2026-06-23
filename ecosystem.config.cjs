module.exports = {
  apps: [
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
    }
  ]
};
