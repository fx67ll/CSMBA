<template>
  <view class="fx67ll-log-box">
    <z-paging-mini ref="paging" :default-page-size="100" back-to-top-bottom="1rpx" :auto-show-back-to-top="true"
      v-model="logList" @query="queryLogList">
      <uni-swipe-action>
        <view class="fx67ll-log-item" v-for="item in logList" :key="item.mahjongReservationLogId">
          <uni-swipe-action-item :left-options="leftActionOptions"
            :right-options="item.reservationStatus === '0' ? rightActionOptions : []"
            @click="(e) => handleActionClick(e, item)">
            <uni-section :title="`订单编号：${getOrderNo(item)}`" type="line">
              <!-- 新增头部：日期+状态标签 组合 -->
              <view class="section-header">
                <text class="reservation-date">预约日期: {{ formatDate(item.reservationStartTime) }}</text>
                <text :class="['status-tag', getStatusClass(item.reservationStatus)]">
                  {{ formatStatus(item.reservationStatus) }}
                </text>
              </view>
              <uni-list :border="true">
                <!-- 预约时段+时长 组合行 -->
                <view class="reservation-time-container" :class="getStatusClass(item.reservationStatus)">
                  <text class="icon-clock">⏱️</text>
                  <text class="reservation-time-text">
                    {{ formatHourMinute(item.reservationStartTime) }} - {{ formatHourMinute(item.reservationEndTime) }}
                  </text>
                  <text class="reservation-duration">
                    时长: {{ calculateDuration(item.reservationStartTime, item.reservationEndTime) }}
                  </text>
                </view>
                <view class="reservation-details">
                  <view class="detail-item">
                    <text class="label icon-room">🏠</text>
                    <text class="label-text">棋牌室:</text>
                    <text class="value">{{ item.mahjongRoomName || '-' }}</text>
                  </view>
                  <view class="detail-item">
                    <text class="label icon-contact">📞</text>
                    <text class="label-text">联系方式:</text>
                    <text class="value">{{ item.reservationContact || '-' }}</text>
                  </view>
                  <!-- 新增：预约人数 -->
                  <view class="detail-item">
                    <text class="label icon-people">👥</text>
                    <text class="label-text">预约人数:</text>
                    <text class="value">{{ item.reservationPersonCount || 4 }}</text>
                  </view>
                  <!-- 新增：创建时间 -->
                  <view class="detail-item">
                    <text class="label icon-create">📅</text>
                    <text class="label-text">创建时间:</text>
                    <text class="value">{{ formatTimeForJapan(item.createTime) || '-' }}</text>
                  </view>
                  <!-- 新增：备注信息 -->
                  <view class="detail-item">
                    <text class="label icon-note">📝</text>
                    <text class="label-text">备注:</text>
                    <text class="value">{{ item.reservationRemark || '无特殊备注' }}</text>
                  </view>
                </view>
              </uni-list>
            </uni-section>
          </uni-swipe-action-item>
        </view>
      </uni-swipe-action>
    </z-paging-mini>
    <editDrawer :isShowDrawer="isShowDrawer" :logInfo="editLogInfo" @hideDrawer="val => setIsShowDrawer(val, 3)"
      @reloadMahjongReservationLogList="reloadMahjongReservationLogList"></editDrawer>
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
        //     backgroundColor: "#2ecc71",
        //   },
        // },
        {
          text: "修改备注",
          style: {
            backgroundColor: "#4096ff",
          },
        },
        {
          text: "取消订单",
          style: {
            backgroundColor: "#ff4d4f",
          },
        },
      ],
      isShowDrawer: false,
      editLogInfo: {},
    };
  },
  onShow() {
    this.reloadMahjongReservationLogList();
  },
  methods: {
    // 强制刷新列表
    reloadMahjongReservationLogList() {
      if (this.$refs.paging) {
        this.$refs.paging.refresh();
      }
      this.queryLogList();
    },
    // 生成订单编号（创建时间戳 + mahjongReservationLogId）
    getOrderNo(item) {
      // 将创建时间转为时间戳（毫秒），再拼接id
      const timeStamp = new Date(item.createTime).getTime();
      return timeStamp + (item?.mahjongReservationLogId || 0);
    },
    // 格式化完整时间（用于创建时间）
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
    // 格式化状态显示
    formatStatus(status) {
      const statusMap = {
        '0': '已预约',
        '1': '已取消',
        '2': '已完成',
      };
      return statusMap[status] || `状态(${status})`;
    },
    // 获取状态对应的样式类
    getStatusClass(status) {
      const statusClassMap = {
        '0': 'status-reserved', // 已预约
        '1': 'status-canceled', // 已取消
        '2': 'status-completed', // 已完成
      };
      return statusClassMap[status] || '';
    },
    // 计算预约时长
    calculateDuration(startTime, endTime) {
      if (!startTime || !endTime) return '-';
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const hour = Math.floor((end - start) / 3600000);
      const minute = Math.floor(((end - start) % 3600000) / 60000);
      return hour > 0 ? `${hour}小时${minute > 0 ? minute + '分' : ''} ` : `${minute} 分钟`;
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
    // 侧滑菜单事件 - 增加二次确认
    handleActionClick(e, record) {
      const self = this;
      if (e?.position === "right" && e?.index === 0) {
        this.editReservationLogLogInfo(record);
      }
      if (e?.position === "right" && e?.index === 1) {
        // 二次确认弹窗
        uni.showModal({
          title: '提示',
          content: '确定要取消该预约订单吗？',
          confirmText: '确认',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              const formParams = {
                ...record,
                reservationStatus: 1,
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
          }
        });
      }
    },
  }
}
</script>

<style lang="less">
// 定义全局状态颜色变量，统一色系
@reserved-color: #4096ff;
@canceled-color: #ff4d4f;
@completed-color: #2ecc71;
@gray-color: #888;
@light-bg-color: #fafafa;

.fx67ll-log-box {
  padding: 16rpx;
  background-color: #f5f5f5;
}

.fx67ll-log-item {
  margin-bottom: 20rpx;
  background: linear-gradient(180deg, #ffffff 0%, @light-bg-color 100%);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.1);
    transform: translateY(-2rpx);
  }
}

// 头部日期+状态标签样式
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1px solid #f0f0f0;

  .reservation-date {
    font-size: 28rpx;
    font-weight: 600;
    color: #222;
  }

  .status-tag {
    padding: 6rpx 16rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
    font-weight: 600;
  }
}

// 预约时间容器样式，关联状态颜色
.reservation-time-container {
  width: 100%;
  padding: 30rpx 24rpx;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  gap: 20rpx;

  .icon-clock {
    font-size: 32rpx;
  }

  .reservation-time-text {
    font-size: 40rpx;
    font-weight: bold;
    letter-spacing: 1rpx;
    flex: 1;
  }

  .reservation-duration {
    font-size: 24rpx;
    color: @gray-color;
    background: #f5f5f5;
    padding: 4rpx 12rpx;
    border-radius: 16rpx;
  }
}

// 已预约状态颜色统一
.status-reserved {

  color: @completed-color !important;
  background: rgba(46, 204, 113, 0.1);

  .reservation-time-text,
  .icon-clock,
  .status-tag {
    color: @completed-color !important;
  }

  .status-tag {
    background: rgba(46, 204, 113, 0.1);
  }
}

// 已取消状态颜色统一
.status-canceled {

  color: @canceled-color !important;
  background: rgba(255, 77, 79, 0.1);

  .reservation-time-text,
  .icon-clock,
  .status-tag {
    color: @canceled-color !important;
  }

  .status-tag {
    background: rgba(255, 77, 79, 0.1);
  }
}

// 已完成状态颜色统一
.status-completed {

  color: @reserved-color !important;
  background: rgba(64, 150, 255, 0.1);

  .reservation-time-text,
  .icon-clock,
  .status-tag {
    color: @reserved-color !important;
  }

  .status-tag {
    background: rgba(64, 150, 255, 0.1);
  }
}

.reservation-details {
  padding: 24rpx;
  font-size: 26rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  line-height: 36rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    color: inherit;
    font-size: 28rpx;
    margin-right: 8rpx;
  }

  .label-text {
    color: @gray-color;
    width: 140rpx;
    flex-shrink: 0;
    font-size: 26rpx;
  }

  .value {
    flex: 1;
    word-break: break-all;
    color: #333;
    font-size: 26rpx;
    font-weight: 500;
  }
}

// 调整uni组件默认样式
.uni-section__header {
  display: none !important; // 隐藏原有头部，使用自定义头部
}

.uni-list {
  border-top: none !important;
}

// 图标辅助样式
.icon-room,
.icon-contact,
.icon-people,
.icon-create,
.icon-note {
  font-size: 26rpx;
}
</style>