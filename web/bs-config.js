const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  port: 3000,
  server: {
    baseDir: [
      "./public",
      "./dist"
    ],
    // login.html é a entrada padrão para a raiz "/"
    index: "login.html",
    middleware: [
      // Rewrite amigável para /admin e /admin/ -> /admin.html
      function (req, res, next) {
        if (req.url === '/admin' || req.url === '/admin/') {
          req.url = '/admin.html';
        }
        next();
      },
      // Proxy de requisições da API para o backend FastAPI
      {
        route: "/api",
        handle: createProxyMiddleware({
          target: "http://localhost:8000",
          changeOrigin: true,
          pathRewrite: {
            "^/api": ""
          }
        })
      }
    ]
  },
  files: [
    "./public/**/*.html",
    "./public/**/*.css",
    "./dist/**/*.js"
  ],
  ghostMode: {
    clicks: false,
    forms: false,
    scroll: false
  }
};