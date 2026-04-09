module.exports = {
  apps: [
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
