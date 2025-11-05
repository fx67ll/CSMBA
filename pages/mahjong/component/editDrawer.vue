<template>
  <zb-drawer mode="bottom" title="修改" :wrapperClosable="false" :visible.sync="isShowDrawer" :radius="true"
    :height="drawerHeight">
    <scroll-view :scroll-y="true" class="fx67ll-reservation-drawer">
      <view class="fx67ll-reservation-remark">
        <uni-easyinput type="textarea" :value="logRemark" placeholder="有需要的话可以在这里记录备注信息" maxlength="1023"
          :disabled="isNetworkLoading" @input="logRemarkChange" />
      </view>
      <view class="fx67ll-reservation-btn">
        <button class="fx67ll-btn-submit" type="default" :disabled="isNetworkLoading" @click="submitLogForm"
          style="color:#ffffff; background-color:#1AAD19; border-color:#1AAD19">
          提交
        </button>
        <button class="fx67ll-btn-cancel" type="warn" :disabled="isNetworkLoading" @click="closeDrawer">取消</button>
      </view>
    </scroll-view>
  </zb-drawer>
</template>

<script>
import { updateMahjongReservationLog } from "@/api/mahjong/log";

export default {
  name: 'editDrawer',
  props: {
    // 加载状态
    isNetworkLoading: false,
    // 是否显示抽屉
    isShowDrawer: {
      type: Boolean,
      required: true,
      default: false,
    },
    // 预约订单信息详情
    logInfo: {
      type: Object,
      required: false,
      default: () => {
        return {};
      },
    },
  },
  data() {
    return {
      // Drawer组件相关参数
      drawerHeight: "calc(100% - 300px)",
      // 表单相关参数
      logRemark: "",
    };
  },
  watch: {
    isShowDrawer(newValue, oldValue) {
      if (!newValue) {
        // 监听父节点是否需要关闭当前弹窗
        this.$emit("hideDrawer", newValue);
      }
    },
    logInfo(newValue, oldValue) {
      const self = this;
      if (newValue?.mahjongReservationLogId) {
        const { noteRemark } = newValue;
        self.noteRemark = noteRemark || "";
      }
    },
  },
  methods: {
    // 输入预约订单备注
    logRemarkChange: function (e) {
      this.logRemark = e;
    },
    // 新增或修改预约订单信息
    submitLogForm() {
      const self = this;
      const formParams = {
        logRemark: self.logRemark,
      };
      const mahjongReservationLogarams = {
        ...self.logInfo,
        ...formParams,
      };
      updateMahjongReservationLog(mahjongReservationLogarams).then((res) => {
        self.isNetworkLoading = false;
        if (res?.code === 200) {
          self.closeDrawer();
          uni.showToast({
            title: "修改成功！",
            icon: "none",
            duration: 1998,
          });
          self.$emit("reloadMahjongReservationLogList");
        } else {
          uni.showToast({
            title: "修改失败，请联系管理员！",
            icon: "none",
            duration: 1998,
          });
        }
      });
    },
    // 关闭当前弹窗
    closeDrawer() {
      this.$emit("hideDrawer", false);
    },
  },
};
</script>

<style lang="less">
@import url("./editDrawer.less");
</style>
