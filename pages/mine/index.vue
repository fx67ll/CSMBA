<template>
  <view class="mine-container" :style="{ height: `${windowHeight}px` }">
    <!--顶部账户信息栏-->
    <view class="header-section">
      <view class="flex padding justify-between">
        <view class="flex align-center">
          <view v-if="!avatar" class="cu-avatar xl round bg-white">
            <view class="iconfont icon-people text-gray icon"></view>
          </view>
          <image v-if="avatar" @click="handleToAvatar" :src="avatar" class="cu-avatar xl round" mode="widthFix">
          </image>
          <view v-if="!userName" @click="handleToLogin" class="login-tip">
            点击登录
          </view>
          <view v-if="userName" @click="handleToInfo" class="user-info">
            <view class="u_title"> {{ userName }} </view>
          </view>
        </view>
        <view @click="handleToInfo" class="flex align-center">
          <text>账户信息</text>
          <view class="iconfont icon-right"></view>
        </view>
      </view>
    </view>

    <view class="content-section">
      <view class="mine-actions grid col-4 text-center">
        <view class="action-item" @click="goFx67ll(0)">
          <view><uni-icons color="#2ecc71" type="star" size="32"></uni-icons></view>
          <text class="text">{{ globalConfig.appInfo.author_info[0].title }}</text>
        </view>
        <view class="action-item" @click="goFx67ll(1)">
          <view><uni-icons color="#2ecc71" type="medal" size="32"></uni-icons></view>
          <text class="text">{{ globalConfig.appInfo.author_info[1].title }}</text>
        </view>
        <view class="action-item" @click="goFx67ll(2)">
          <view><uni-icons color="#2ecc71" type="fire" size="32"></uni-icons></view>
          <text class="text">{{ globalConfig.appInfo.author_info[2].title }}</text>
        </view>
        <view class="action-item" @click="goFx67ll(3)">
          <view><uni-icons color="#2ecc71" type="hand-up" size="32"></uni-icons></view>
          <text class="text">{{ globalConfig.appInfo.author_info[3].title }}</text>
        </view>
      </view>

      <view class="menu-list">
        <!-- <view class="list-cell list-cell-arrow" @click="handleToCubeGame">
          <view class="menu-item-box">
            <view><uni-icons color="#2ecc71" type="star" size="20"></uni-icons></view>
            <view>魔方小游戏</view>
          </view>
        </view> -->
        <view class="list-cell list-cell-arrow" @click="handleAbout">
          <view class="menu-item-box">
            <view><uni-icons color="#2ecc71" type="paperclip" size="20"></uni-icons></view>
            <view>关于我们</view>
          </view>
        </view>
        <view class="list-cell list-cell-arrow" @click="handleToSetting">
          <view class="menu-item-box">
            <view><uni-icons color="#2ecc71" type="gear" size="20"></uni-icons></view>
            <view>应用设置</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>

export default {
  data() {
    return {
      // 当前登录用户信息
      userName: this.$store.state.user.name,
      version: getApp().globalData.config.appInfo.version,
      globalConfig: getApp().globalData.config,
    };
  },
  computed: {
    avatar() {
      return this.$store.state.user.avatar;
    },
    windowHeight() {
      return uni.getSystemInfoSync().windowHeight - 50;
    },
  },
  methods: {
    goFx67ll(index) {
      let site = this.globalConfig.appInfo.author_info[index];
      this.$tab.navigateTo(
        `/pages/common/webview/index?title=${site.title}&url=${site.url}`
      );
    },
    handleToCubeGame() {
      this.$tab.navigateTo(
        `/pages/common/webview/index?title=魔方小游戏&url=https://three.fx67ll.com/cube`
      );
    },
    handleToInfo() {
      this.$tab.navigateTo("/pages/mine/info/index");
    },
    handleToSetting() {
      this.$tab.navigateTo("/pages/mine/setting/index");
    },
    handleToLogin() {
      this.$tab.reLaunch("/pages/login");
    },
    handleToAvatar() {
      // this.$tab.navigateTo("/pages/mine/avatar/index");
      uni.showToast({
        title: "暂不开放修改头像功能",
        icon: "none",
        duration: 1998,
      });
    },
    handleLogout() {
      this.$modal.confirm("确定注销并退出系统吗？").then(() => {
        this.$store.dispatch("LogOut").then(() => {
          this.$tab.reLaunch("/pages/mahjong/reservation/index");
        });
      });
    },
    handleAbout() {
      this.$tab.navigateTo("/pages/mine/about/index");
    },
  },
};
</script>

<style lang="scss">
page {
  background-color: #f5f6f7;
}

.mine-container {
  width: 100%;
  height: 100%;

  .header-section {
    padding: 15px 15px 45px 15px;
    background-color: #2ecc71;
    color: white;

    .login-tip {
      font-size: 18px;
      margin-left: 10px;
    }

    .cu-avatar {
      border: 2px solid #eaeaea;

      .icon {
        font-size: 40px;
      }
    }

    .user-info {
      margin-left: 15px;

      .u_title {
        font-size: 18px;
        line-height: 30px;
      }
    }
  }

  .content-section {
    position: relative;
    top: -50px;

    .menu-list {
      margin-top: 15px;
    }

    .menu-list-last {
      padding-bottom: 68px;
    }

    .mine-actions {
      margin: 15px 15px 0 15px;
      padding: 20px 0px;
      border-radius: 8px;
      background-color: white;

      .action-item {
        .icon {
          font-size: 28px;
        }

        .text {
          display: block;
          font-size: 13px;
          margin: 8px 0px;
        }
      }
    }
  }
}
</style>
