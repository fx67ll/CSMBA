<template>
  <view class="content">
    <image class="logo" :src="randomAvatar" @click="getRandomAvatarDebounce"></image>
    <view class="text-area">
      <text class="title">Powered & Designed By fx67ll</text>
    </view>
  </view>
</template>

<script>
import { getAvatar } from "@/api/system/user";
import _ from "@/node_modules/underscore";

export default {
  data() {
    return {
      userName: this.$store.state.user.name,
      // randomAvatar: "https://test.fx67ll.com/fx67ll-img-collection/fx67ll.jpg",
      randomAvatar: "/static/images/mahjong-app.jpg",
    };
  },
  onLoad() {
    this.getRandomAvatarDebounce();
  },
  methods: {
    getRandomAvatarDebounce: _.debounce(function () {
      this.getRandomAvatar();
    }, 233),
    getRandomAvatar() {
      const self = this;
      getAvatar("fx67ll").then((res) => {
        if (res?.avatar) {
          self.randomAvatar = "data:image/gif;base64," + res.avatar;
        } else {
          self.randomAvatar = getApp().globalData.config.appInfo.logo;
        }
      });
    },
  },
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 400rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
