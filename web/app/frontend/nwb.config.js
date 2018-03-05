var publicPath = "/static/";
var fontPath = "[name].[ext]";

if (process.env.NODE_ENV == "dev"){
  publicPath = "/";
  fontPath = "static/[name].[ext]";
}

var config = {
  type: 'preact-app',
  webpack: {
    publicPath: publicPath,
    extractText: {
      allChunks: true,
      filename: "app.css"
    },
    rules: {
      fonts: {
        options: {
          name: fontPath
        }
      }
    }
  }
}

module.exports = config;

