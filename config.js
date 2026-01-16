// 应用全局配置
module.exports = {
  baseUrl: 'https://vip.fx67ll.com/vip-api-chaoshen',
  // baseUrl: 'http://localhost:9897/vip-api-chaoshen',
  // 不校验登录信息的api
  white_api: ['/captchaImage', '/login', '/register', '/registerChaoshen', '/secret/key/getSecretKeyConfigForApp'],
  // 应用信息
  appInfo: {
    // 应用名称
    name: 'csmba-app',
    // 应用版本
    version: '0.1.8',
    // 应用logo
    // logo: 'https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg',
    logo: '/static/images/mahjong-app.jpg',
    // 个人主页
    site_url: 'https://fx67ll.com',
    // 技术博客
    blog_url: 'https://fx67ll.xyz',
    // 自我介绍
    author_info: [
      {
        title: '个人主页',
        url: 'https://fx67ll.com',
        icon: 'star',
      },
      {
        title: '个人简历',
        url: 'https://fx67ll.xyz/s/resume',
        icon: 'medal',
      },
      {
        title: '个人作品',
        url: 'https://fx67ll.xyz/links',
        icon: 'fire',
      },
      {
        title: '联系作者',
        url: 'https://fx67ll.xyz/s/messageboard',
      },
      {
        title: '打赏作者',
        url: 'https://fx67ll.xyz/s/donate',
        icon: 'hand-up',
      },
      {
        title: '关于作者',
        url: 'https://fx67ll.xyz/s/about',
      },
    ],
  },
};
