<template>
  <view class="fx67ll-room-box">
    <rich-text :nodes="mahjongRoomDescription"></rich-text>
  </view>
</template>

<script>
import { getMahjongRoomInfo } from "@/api/mahjong/room"

export default {
  data() {
    return {
      mahjongRoomDescription: '',
    };
  },
  onLoad() {
    this.queryRoomInfo();
  },
  methods: {
    // 查询麻将室介绍详情
    queryRoomInfo() {
      const self = this;
      getMahjongRoomInfo()
        .then((res) => {
          console.log('res', res);
          if (res?.code === 200) {
            let htmlContent = res?.data?.mahjongRoomDescription;
            // 给所有img标签添加样式，限制最大宽度为100%
            htmlContent = htmlContent.replace(/<img/g, '<img style="max-width:100%; height:auto; margin-top:10px;"');
            self.mahjongRoomDescription = htmlContent;
          } else {
            uni.showToast({
              title: "查询麻将室介绍详情失败！",
              icon: "none",
              duration: 1998,
            });
          }
        })
        .catch(() => {
          uni.showToast({
            title: "查询麻将室介绍详情失败！",
            icon: "none",
            duration: 1998,
          });
        });
    },
  },
};
</script>

<style lang="less">
@import url("./index.less");
</style>
