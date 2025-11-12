<template>
  <view class="normal-login-container">
    <view class="logo-content align-center justify-center flex">
      <image style="width: 100rpx; height: 100rpx" :src="globalConfig.appInfo.logo" mode="widthFix"></image>
      <text class="title">麻将室预约登记</text>
    </view>
    <view class="login-form-content">
      <view class="input-item flex align-center">
        <view class="iconfont icon-user icon"></view>
        <input v-model="loginForm.username" class="input" type="text" placeholder="请输入账号" maxlength="30" />
      </view>
      <view class="input-item flex align-center">
        <view class="iconfont icon-password icon"></view>
        <input v-model="loginForm.password" type="password" class="input" placeholder="请输入密码" maxlength="20" />
      </view>
      <view class="input-item flex align-center" style="width: 60%; margin: 0px" v-if="captchaEnabled">
        <view class="iconfont icon-code icon"></view>
        <input v-model="loginForm.code" type="number" class="input" placeholder="请输入验证码" maxlength="4" />
        <view class="login-code">
          <image :src="codeUrl" @click="getCodeDebounce" class="login-code-img" v-if="codeUrl"></image>
          <button class="login-code-img" :loading="isLoginLoading" :disabled="isLoginLoading" v-if="!codeUrl"></button>
        </view>
      </view>
      <view class="action-btn">
        <button @click="handleLogin" :loading="isLoginLoading" :disabled="isLoginLoading"
          class="login-btn cu-btn block bg-blue lg round">
          登录
        </button>
      </view>
      <view class="reg text-center" v-if="register">
        <text class="text-grey1">没有账号？</text>
        <text @click="handleUserRegister" class="text-blue">立即注册</text>
      </view>
      <view class="xieyi text-center">
        <text class="text-grey1">如果您忘记密码，请联系管理员重置！</text>
      </view>
    </view>
    <!-- #ifdef H5 -->
    <view class="fx67ll-footer-container">
      <view class="fx67ll-footer">
        Designed & Powered by
        <a href="https://nav.fx67ll.com" target="_blank">fx67ll</a>
        Copyright© 2018- {{ nowYear }}
        <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank">
          皖ICP备18017174号
        </a>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
import { getCodeImg } from "@/api/login";
import _ from "@/node_modules/underscore";
// 日期时间处理
import moment from "@/node_modules/moment";
import "@/node_modules/moment/locale/zh-cn";

export default {
  data() {
    return {
      codeUrl: "",
      captchaEnabled: true,
      // 用户注册开关
      register: true,
      globalConfig: getApp().globalData.config,
      loginForm: {
        username: "",
        password: "",
        code: "",
        uuid: "",
      },
      // 是否正在登陆标识
      isLoginLoading: false,
      // 今年
      nowYear: moment().format("YYYY"),
    };
  },
  onLoad() {
    // 页面加载时检查是否有有效的登录信息
    this.checkAutoLogin();
  },
  created() {
    this.getCode();
  },
  methods: {
    // 检查是否可以自动登录
    checkAutoLogin() {
      const loginInfo = uni.getStorageSync('loginInfo');

      // 如果存在登录信息且未过期
      if (loginInfo && loginInfo.expireTime && new Date().getTime() < loginInfo.expireTime) {
        // 使用缓存的用户信息自动登录
        this.$store.dispatch('SetUserInfo', loginInfo.userInfo).then(() => {
          this.$tab.reLaunch("/pages/mahjong/reservation/index");
        });
      }
    },
    // 用户注册
    handleUserRegister() {
      this.$tab.redirectTo(`/pages/register`);
    },
    // 获取更多信息
    handleGetAuthorMoreInfo(index) {
      let site = this.globalConfig.appInfo.author_info[index];
      this.$tab.navigateTo(
        `/pages/common/webview/index?title=${site.title}&url=${site.url}`
      );
    },
    getCodeDebounce: _.debounce(function () {
      this.getCode();
    }, 233),
    // 获取图形验证码
    getCode() {
      const self = this;
      this.isLoginLoading = true;
      getCodeImg().then((res) => {
        self.captchaEnabled =
          res.captchaEnabled === undefined ? true : res.captchaEnabled;
        if (self.captchaEnabled) {
          self.codeUrl = "data:image/gif;base64," + res.img;
          self.loginForm.uuid = res.uuid;
        }
        self.isLoginLoading = false;
      });
    },
    // 登录方法
    async handleLogin() {
      if (this.loginForm.username === "") {
        this.$modal.msgError("请输入您的账号");
      } else if (this.loginForm.password === "") {
        this.$modal.msgError("请输入您的密码");
      } else if (this.loginForm.code === "" && this.captchaEnabled) {
        this.$modal.msgError("请输入验证码");
      } else {
        this.$modal.loading("登录中，请耐心等待...");
        this.pwdLogin();
      }
    },
    // 密码登录
    async pwdLogin() {
      const self = this;
      this.isLoginLoading = true;
      this.$store
        .dispatch("Login", this.loginForm)
        .then((res) => {
          if (!res) {
            self.loginSuccess();
          } else {
            uni.showToast({
              title: res?.msg || "登录失败，请联系管理员！",
              icon: "none",
              duration: 1998,
            });
          }
        })
        .catch((res) => {
          uni.showToast({
            title: res?.msg || "登录失败，请联系管理员！",
            icon: "none",
            duration: 1998,
          });
        })
        .finally(() => {
          if (this.captchaEnabled) {
            this.getCode();
          }
        });
    },
    // 登录成功后，处理函数
    loginSuccess() {
      const self = this;
      // 设置用户信息
      this.$store.dispatch("GetInfo").then((userInfo) => {
        // 登录成功后保存登录信息到本地存储，有效期7天
        const sevenDaysLater = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数
        const loginInfo = {
          userInfo: userInfo,          // 用户信息
          loginForm: this.loginForm,   // 登录表单信息（账号密码）
          expireTime: sevenDaysLater   // 过期时间
        };

        // 存储到本地缓存
        uni.setStorageSync('loginInfo', loginInfo);

        self.isLoginLoading = false;
        self.$modal.closeLoading();
        self.$tab.reLaunch("/pages/mahjong/reservation/index");
      });
    },
  },
};
</script>

<style lang="scss">
page {
  background-color: #ffffff;
}

.normal-login-container {
  width: 100%;

  .logo-content {
    width: 100%;
    font-size: 21px;
    text-align: center;
    padding-top: 15%;

    image {
      border-radius: 4px;
    }

    .title {
      margin-left: 10px;
    }
  }

  .login-form-content {
    text-align: center;
    margin: 20px auto;
    margin-top: 15%;
    width: 80%;

    .input-item {
      margin: 20px auto;
      background-color: #f5f6f7;
      height: 45px;
      border-radius: 20px;

      .icon {
        font-size: 38rpx;
        margin-left: 10px;
        color: #999;
      }

      .input {
        width: 100%;
        font-size: 14px;
        line-height: 20px;
        text-align: left;
        padding-left: 15px;
      }
    }

    .login-btn {
      margin-top: 40px;
      height: 45px;
    }

    .reg {
      margin-top: 15px;
    }

    .xieyi {
      color: #333;
      margin-top: 20px;
    }

    .login-code {
      height: 38px;
      float: right;

      .login-code-img {
        height: 38px;
        position: absolute;
        margin-left: 10px;
        width: 220rpx;
        border-radius: 8px;
      }
    }
  }
}

uni-button[loading]:before {
  vertical-align: initial;
}

.fx67ll-footer-container {
  width: 100%;
  margin-top: 23%;
  background-color: #ffffff;

  .fx67ll-footer {
    padding: 20px 30px;
    margin: 0 auto;
    text-align: center;
    user-select: text;
    z-index: 99999;
    color: #bababa;
    cursor: pointer;

    a {
      color: #bababa;
      padding: 0 10px;
    }

    a:hover {
      color: #42b983;
    }
  }
}
</style>
