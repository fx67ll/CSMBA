<template>
  <view class="fx67ll-log-box">
    <z-paging-mini ref="paging" back-to-top-bottom="166rpx" :auto-show-back-to-top="true" v-model="logList"
      @query="queryLogList">
      <uni-swipe-action>
        <view class="fx67ll-log-item" v-for="item in logList" :key="item.noteId">
          <uni-swipe-action-item :left-options="leftActionOptions" :right-options="rightActionOptions"
            @click="(e) => handleActionClick(e, item)">
            <uni-section :title="item.createTime" type="line">
              <uni-list :border="true">
                <uni-list-item ellipsis="3" :title="item.noteContent" />
              </uni-list>
            </uni-section>
          </uni-swipe-action-item>
        </view>
      </uni-swipe-action>
    </z-paging-mini>
    <editDrawer :isShowDrawer="isShowDrawer" :logInfo="editLogInfo" @hideDrawer="val => setIsShowDrawer(val, 3)"
      @reloadMahjongReservationLogList="queryLogList"></editDrawer>
  </view>
</template>

<script>
import editDrawer from "@/pages/mahjong/component/editDrawer.vue";
import { listMahjongReservationLog } from "@/api/mahjong/log"
import uniListChat from "@/uni_modules/uni-list/components/uni-list-chat/uni-list-chat.vue";

// import moment from "@/node_modules/moment";
// import "@/node_modules/moment/locale/zh-cn";

export default {
  components: { uniListChat, editDrawer },
  data() {
    return {
      logList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
      },
      leftActionOptions: [
        {
          text: "测试预留",
          style: {
            backgroundColor: "#ffa940",
          },
        },
      ],
      rightActionOptions: [
        {
          text: "关闭",
          style: {
            backgroundColor: "#4096ff",
          },
        },
        {
          text: "修改信息",
          style: {
            backgroundColor: "#2ecc71",
          },
        },
        {
          text: "取消订单",
          style: {
            backgroundColor: "#ff4d4f",
          },
        },
      ],
      // Drawer组件相关参数
      isShowDrawer: false,
      editLogInfo: {},
    };
  },
  onShow() {
    this.queryLogList();
  },
  methods: {
    // 查询预约订单记录列表
    queryLogList(pageNum, pageSize) {
      const self = this;

      if (!pageNum || !pageSize) {
        return;
      }

      this.queryParams = {
        ...self.queryParams,
        pageNum,
        pageSize,
      };

      listMahjongReservationLog(self.queryParams)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.rows && res?.rows?.length > 0) {
              self.$refs.paging.complete(res.rows);
            } else {
              self.$refs.paging.complete([]);
            }
          } else {
            uni.showToast({
              title: "查询预约订单记录失败！",
              icon: "none",
              duration: 1998,
            });
            self.$refs.paging.complete(false);
          }
        })
        .catch((res) => {
          self.$refs.paging.complete(false);
        });
    },
    // 关闭修改预约订单记录抽屉
    editReservationLogLogInfo(logInfo) {
      this.editLogInfo = { ...logInfo };
      this.isShowDrawer = true;
    },
    // 关闭修改预约订单记录抽屉
    setIsShowDrawer(val, type) {
      // 关闭弹窗
      this.isShowDrawer = val;
      // 重新加载列表
      if (type === 1 || type === 2) {
        this.queryLogList();
        this.$refs.paging.reload();
      }
    },
    // 侧滑菜单事件
    handleActionClick(e, record) {
      const self = this;
      if (e?.position === "right" && e?.index === 1) {
        this.editReservationLogLogInfo(record);
      }
      if (e?.position === "right" && e?.index === 2) {
        console.log(self.logList);
      }
      if (e?.position === "left" && e?.index === 0) {
        console.log(self.logList);
      }
    },
  },
};
</script>

<!-- <style lang="less">
@import url("./index.less");
</style> -->
