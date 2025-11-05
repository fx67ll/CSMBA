<template>
  <view class="fx67ll-log-box">
    <z-paging-mini ref="paging" :default-page-size="100" back-to-top-bottom="166rpx" :auto-show-back-to-top="true"
      v-model="logList" @query="queryLogList">
      <uni-swipe-action>
        <view class="fx67ll-log-item" v-for="item in logList" :key="item.mahjongReservationLogId">
          <uni-swipe-action-item :left-options="leftActionOptions"
            :right-options="item.reservationStatus === '0' ? rightActionOptions : []"
            @click="(e) => handleActionClick(e, item)">
            <uni-section :title="item.createTime" type="line">
              <uni-list :border="true">
                <uni-list-item ellipsis="3"
                  :title="`预约时间: ${formatTime(item.reservationStartTime)} - ${formatTime(item.reservationEndTime)}`" />
                <view class="reservation-details">
                  <view class="detail-item">
                    <text class="label">棋牌室:</text>
                    <text class="value">{{ item.mahjongRoomName }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="label">联系方式:</text>
                    <text class="value">{{ item.reservationContact }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="label">状态:</text>
                    <text class="value">{{ formatStatus(item.reservationStatus) }}</text>
                  </view>
                </view>
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
import { listMahjongReservationLog, editMahjongReservationLog } from "@/api/mahjong/log"
import uniListChat from "@/uni_modules/uni-list/components/uni-list-chat/uni-list-chat.vue";

export default {
  components: { uniListChat, editDrawer },
  data() {
    return {
      logList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 100,
        mahjongRoomId: 1,
        reservationDate: '',
        reservationStatus: '',
        isNeedAll: false,
      },
      leftActionOptions: [
      ],
      rightActionOptions: [
        // {
        //   text: "关闭",
        //   style: {
        //     backgroundColor: "#4096ff",
        //   },
        // },
        // {
        //   text: "修改备注",
        //   style: {
        //     backgroundColor: "#2ecc71",
        //   },
        // },
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
    // 格式化时间显示
    formatTime(timeStr) {
      if (!timeStr) return '未知时间';
      // 处理ISO格式时间 例如: "2025-10-08T00:00:00.000+08:00"
      const date = new Date(timeStr);
      return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`;
    },
    // 数字补零
    padZero(num) {
      return num < 10 ? `0${num}` : num;
    },
    // 格式化状态显示
    formatStatus(status) {
      const statusMap = {
        '0': '已预约',
        '1': '已完成',
        '2': '已取消',
        // 可以根据实际业务添加更多状态
      };
      return statusMap[status] || `状态(${status})`;
    },
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
    // 编辑预约订单记录
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
      // if (e?.position === "right" && e?.index === 1) {
      //   this.editReservationLogLogInfo(record);
      // }
      if (e?.position === "right" && e?.index === 0) {
        console.log('取消订单', record);
        const formParams = {
          ...record,
          reservationStatus: 2,
        }
        editMahjongReservationLog(formParams)
          .then((res) => {
            if (res?.code === 200) {
              self.queryLogList();
              self.$refs.paging.refresh();
              uni.showToast({
                title: "取消预约订单成功！",
                icon: "none",
                duration: 1998,
              });
            } else {
              uni.showToast({
                title: "取消预约订单失败！",
                icon: "none",
                duration: 1998,
              });
            }
          })
          .catch((res) => {
            uni.showToast({
              title: "取消预约订单失败！",
              icon: "none",
              duration: 1998,
            });
          });
      }
    },
  },
};
</script>

<style lang="less">
.fx67ll-log-box {
  padding: 16rpx;
}

.fx67ll-log-item {
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.reservation-details {
  padding: 16rpx 30rpx;
  font-size: 26rpx;
  color: #666;
}

.detail-item {
  display: flex;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  color: #999;
  width: 140rpx;
  flex-shrink: 0;
}

.value {
  flex: 1;
  word-break: break-all;
}
</style>
