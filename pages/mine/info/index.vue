<template>
  <view class="container">
    <uni-list class="fx67ll-info-box">
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'person-filled' }"
        title="昵称"
        :rightText="user.nickName || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'staff-filled' }"
        title="性别"
        :rightText="userSex || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'phone-filled' }"
        title="手机号码"
        :rightText="user.phonenumber || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'email-filled' }"
        title="电子邮箱"
        :rightText="user.email || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'flag-filled' }"
        title="岗位"
        :rightText="postGroup || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'auth-filled' }"
        title="角色"
        :rightText="roleGroup || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'calendar-filled' }"
        title="创建时间"
        :rightText="user.createTime || '-'"
      />
      <uni-list-item
        showExtraIcon="true"
        :extraIcon="{ type: 'navigate-filled' }"
        title="登录时间"
        :rightText="loginTime || '-'"
      />
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
  onLoad() {
    this.getUser();
  },
  methods: {
    getUser() {
      getUserProfile().then((response) => {
        this.user = response.data;
        this.userSex = this.user.sex === "0" ? "♂" : "♀";
        this.roleGroup = response.roleGroup;
        this.postGroup = response.postGroup
          ? `${this.user.dept.deptName ? this.user.dept.deptName + " /" : ""} ${
              response.postGroup
            }`
          : "-";
        this.loginTime = moment(this.user.loginDate).format("YYYY-MM-DD hh:mm:ss");
      });
    },
    handleToEditInfo() {
      this.$tab.navigateTo("/pages/mine/info/edit");
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
