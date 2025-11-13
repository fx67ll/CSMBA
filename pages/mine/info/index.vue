<template>
  <view class="container">
    <uni-list class="fx67ll-info-box">
      <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'person-filled' }" title="昵称"
        :rightText="user.nickName || '-'" />
      <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'staff-filled' }" title="性别"
        :rightText="userSex || '-'" />
      <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'phone-filled' }" title="联系方式"
        :rightText="user.contactInfo || '-'" />
      <!-- <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'email-filled' }" title="电子邮箱"
        :rightText="user.email || '-'" /> -->
      <!-- <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'flag-filled' }" title="岗位"
        :rightText="postGroup || '-'" /> -->
      <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'auth-filled' }" title="角色"
        :rightText="roleGroup || '-'" />
      <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'calendar-filled' }" title="创建时间"
        :rightText="formatTimeForJapan(user.createTime)" />
      <!-- <uni-list-item showExtraIcon="true" :extraIcon="{ type: 'navigate-filled' }" title="登录时间"
        :rightText="formatTimeForJapan(loginTime)" /> -->
    </uni-list>
    <button class="fx67ll-info-btn" type="primary" @click="handleToEditInfo">
      编辑资料
    </button>
  </view>
</template>

<script>
import { getUserProfile } from "@/api/system/user";
// 日期时间处理
import moment from "@/node_modules/moment";
import "@/node_modules/moment/locale/zh-cn";

export default {
  data() {
    return {
      user: {},
      userSex: "",
      roleGroup: "",
      postGroup: "",
      loginTime: "",
    };
  },
  onShow() {
    this.getUser();
  },
  methods: {
    getUser() {
      getUserProfile().then((response) => {
        this.user = response.data;
        const sexText = this.user.sex === "0" ? "♂" : "♀";
        this.userSex = this.user.sex ? sexText : '-';
        this.roleGroup = response.roleGroup;
        this.postGroup = response.postGroup
          ? `${this.user.dept.deptName ? this.user.dept.deptName + " /" : ""} ${response.postGroup
          }`
          : "-";
        this.loginTime = moment(this.user.loginDate).format("YYYY-MM-DD hh:mm:ss");
      });
    },
    handleToEditInfo() {
      this.$tab.navigateTo("/pages/mine/info/edit");
    },
    formatTimeForJapan(timeStr) {
      if (!timeStr) return '-';
      // 日本时间比国内时间晚1个小时
      const date = new Date(new Date(timeStr).getTime() + 3600000);
      return `${date.getFullYear()} -${this.padZero(date.getMonth() + 1)} -${this.padZero(date.getDate())} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())} `;
    },
    // 单独格式化日期
    formatDate(timeStr) {
      if (!timeStr) return '-';
      const date = new Date(timeStr);
      return `${date.getFullYear()} -${this.padZero(date.getMonth() + 1)} -${this.padZero(date.getDate())} `;
    },
    // 单独格式化时分
    formatHourMinute(timeStr) {
      if (!timeStr) return '-';
      const date = new Date(timeStr);
      return `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())} `;
    },
    // 数字补零
    padZero(num) {
      return num < 10 ? `0${num} ` : num;
    },
  },
};
</script>

<style lang="scss">
page {
  background-color: #ffffff;
}

.fx67ll-info-box {
  margin: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.fx67ll-info-btn {
  margin: 10px 15px 88px 15px;
}
</style>
