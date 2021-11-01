module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Facemask-Map/'
    : '/',
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = 'Facemask-Map'
        return args
      })
  }
}