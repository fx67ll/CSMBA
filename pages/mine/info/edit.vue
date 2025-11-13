<template>
  <view class="container">
    <view class="example">
      <uni-forms ref="form" :model="user" labelWidth="80px">
        <uni-forms-item label="用户昵称" name="nickName" required>
          <uni-easyinput v-model="user.nickName" placeholder="请输入昵称" />
        </uni-forms-item>
        <uni-forms-item label="用户性别" name="sex" required>
          <uni-data-checkbox v-model="user.sex" :localdata="sexs" />
        </uni-forms-item>
        <uni-forms-item label="联系方式" name="contactInfo" required>
          <uni-easyinput v-model="user.contactInfo" placeholder="请输入联系方式" />
        </uni-forms-item>
        <!-- <uni-forms-item label="电子邮箱" name="email" required>
          <uni-easyinput v-model="user.email" placeholder="请输入电子邮箱" />
        </uni-forms-item> -->
      </uni-forms>
    </view>
    <button class="fx67ll-info-btn" type="primary" @click="submit">提交</button>
  </view>
</template>

<script>
import { getUserProfile } from "@/api/system/user";
import { updateUserProfile } from "@/api/system/user";

export default {
  data() {
    return {
      user: {
        nickName: "",
        contactInfo: "",
        // email: "",
        sex: "",
      },
      sexs: [
        {
          text: "男",
          value: "0",
        },
        {
          text: "女",
          value: "1",
        },
      ],
      rules: {
        nickName: {
          rules: [
            {
              required: true,
              errorMessage: "用户昵称不能为空",
            },
          ],
        },
        sex: {
          rules: [
            {
              required: true,
              errorMessage: "用户性别不能为空",
            },
          ],
        },
        // email: {
        //   rules: [
        //     {
        //       required: true,
        //       errorMessage: "邮箱地址不能为空",
        //     },
        //     {
        //       format: "email",
        //       errorMessage: "请输入正确的邮箱地址",
        //     },
        //   ],
        // },
      },
    };
  },
  onLoad() {
    this.getUser();
  },
  onReady() {
    this.$refs.form.setRules(this.rules);
  },
  methods: {
    getUser() {
      getUserProfile().then((response) => {
        this.user = response.data;
      });
    },
    submit(ref) {
      const self = this;
      this.$refs.form.validate().then((res) => {
        updateUserProfile(this.user).then((response) => {
          uni.showToast({
            title: "账户信息修改成功！",
            icon: "none",
            duration: 1998,
          });
          setTimeout(() => {
            self.$tab.navigateBack("/pages/mine/info/index");
          }, 1023);
        });
      });
    },
  },
};
</script>

<style lang="scss">
page {
  background-color: #ffffff;
}

.example {
  padding: 25px 25px 10px 25px;
  background-color: #ffffff;
}

.segmented-control {
  margin-bottom: 15px;
}

.form-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.fx67ll-info-btn {
  margin: 0 15px 88px 15px;
}
</style>
