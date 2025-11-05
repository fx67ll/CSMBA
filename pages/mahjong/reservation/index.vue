<template>
  <view class="fx67ll-reservation-box">
    <prettyTimes :beginTime="appointConfig.allowBeginTime" :endTime="appointConfig.allowEndTime"
      :timeInterval="appointConfig.allowTimeInterval" :appointTime="appointConfig.appointTime" :isSection="true"
      :disableTimeSlot="appointConfig.disableTimeSlot" @change="handleTimeChange" @date-change="handleDateChange">
    </prettyTimes>

    <!-- 新增：底部提交按钮容器 -->
    <view class="submit-btn-container">
      <button class="submit-btn" @click="handleSubmitReservation">提交预约</button>
    </view>
  </view>
</template>

<script>

// API文档地址：https://ext.dcloud.net.cn/plugin?id=3593
import prettyTimes from "@/components/pretty-times/pretty-times.vue";
import { listMahjongReservationLog, addMahjongReservationLog } from "@/api/mahjong/log"

// 日期时间处理
import moment from "@/node_modules/moment";
import "@/node_modules/moment/locale/zh-cn";

export default {
  components: { prettyTimes },
  data() {
    return {
      appointConfig: {
        allowBeginTime: "00:00:00",
        allowEndTime: "23:00:00",
        allowTimeInterval: 1,
        appointTime: ["2022-02-10 15:30:00"],
        disableTimeSlot: [],
      },
      logList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 999999999,
        mahjongRoomId: 1,
        reservationDate: '',
        reservationStatus: '',
        isNeedAll: true,
      },
      formParams: {
        mahjongRoomId: 1,
        reservationStartTime: null,
        reservationEndTime: null,
        reservationStatus: null,
      }
    };
  },
  onLoad() {
    // 1. 使用moment获取当日日期，格式化为 "YYYYMMDD"（与后端接收格式匹配，若需"YYYY-MM-DD"可调整）
    const today = moment().format('YYYYMMDD');
    // 2. 给查询参数的reservationDate赋值当日日期
    this.queryParams.reservationDate = today;
    // 3. 重置页码为1（避免页面切换后页码残留导致查询异常）
    this.queryParams.pageNum = 1;
    this.queryParams.pageSize = 999999999;
    // 4. 调用列表查询，此时会携带当日日期参数
    this.queryLogList();
    // 5. 刷新z-paging-mini组件，确保列表重新渲染（避免缓存旧数据）
    if (this.$refs.paging) {
      this.$refs.paging.reload();
    }
  },
  methods: {
    // 查询预约订单记录列表
    queryLogList() {
      const self = this;
      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 999;
      listMahjongReservationLog(self.queryParams)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.rows && res?.rows?.length > 0) {
              self.log = res.rows;

              this.appointConfig.disableTimeSlot = res?.rows
                // 第一步：过滤出 reservationStatus 等于 '0' 的数据
                ?.filter(item => item.reservationStatus === '0')
                // 第二步：对过滤后的数据处理时间，生成禁用时间段
                ?.map(item => {
                  const startTime = moment(item.reservationStartTime).format('YYYY-MM-DD HH:mm:ss');
                  let endTime = moment(item.reservationEndTime);
                  const currentTime = moment();
                  // 如果结束时间晚于当前时间前1小时，则调整为当前时间前1小时
                  if (endTime.isAfter(currentTime.subtract(1, 'hours'))) {
                    endTime = endTime.subtract(1, 'hours');
                  }
                  return [startTime, endTime.format('YYYY-MM-DD HH:mm:ss')];
                }) || [];

              console.log(this.appointConfig.disableTimeSlot);
            } else {
              self.logList = [];
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
          self.logList = [];
        });
    },
    handleTimeChange(timeArr) {
      const self = this;
      console.log('当前选中的时间段：', timeArr, this.formParams)

      let startTime = timeArr?.beginTime || '';
      let endTime = timeArr?.endTime || '';

      // 如果开始时间和结束时间相同，则给结束时间加1小时
      if (startTime && endTime && startTime === endTime) {
        endTime = moment(startTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
        console.log(`开始时间与结束时间相同，自动将结束时间调整为：${endTime}`);
      }

      this.formParams = {
        ...self.formParams,
        reservationStartTime: startTime,
        reservationEndTime: endTime,
      }
    },
    handleDateChange(dateInfo) {
      console.log(dateInfo.selectedDate);
      console.log('当前选中的星期：', dateInfo.selectedWeek);
      console.log('选中日期的索引：', dateInfo.activeIndex);
      const dateStr = dateInfo?.selectedDate?.replace(/-/g, "") || '';
      console.log('选中的日期更新后的传参：', dateStr);
      this.queryParams.isNeedAll = true;
      this.queryParams.reservationDate = dateStr;
      this.queryLogList();
    },
    handleSubmitReservation() {
      const self = this;
      this.formParams.mahjongRoomId = 1;
      this.formParams.reservationStatus = 0;

      // 检查开始时间是否晚于结束时间
      if (this.formParams.reservationStartTime && this.formParams.reservationEndTime) {
        const start = moment(this.formParams.reservationStartTime);
        const end = moment(this.formParams.reservationEndTime);

        if (start.isAfter(end)) {
          uni.showToast({
            title: "开始时间不能晚于结束时间！",
            icon: "none",
            duration: 1998,
          });
          return; // 阻止提交
        }
      } else {
        // 检查时间是否为空
        uni.showToast({
          title: "请选择完整的预约时间段！",
          icon: "none",
          duration: 1998,
        });
        return; // 阻止提交
      }

      console.log('当前参数：', this.formParams)
      addMahjongReservationLog(self.formParams)
        .then((res) => {
          if (res?.code === 200) {
            self.queryLogList();
            uni.showToast({
              title: "提交预约订单成功！",
              icon: "none",
              duration: 1998,
            });
          } else {
            uni.showToast({
              title: "提交预约订单失败！",
              icon: "none",
              duration: 1998,
            });
          }
        })
        .catch((res) => {
          uni.showToast({
            title: "提交预约订单失败！",
            icon: "none",
            duration: 1998,
          });
        });
    }
  },
};
</script>

<style lang="scss">
page {
  background-color: #ffffff;
}

/* 新增：提交按钮容器（固定定位到底部） */
.submit-btn-container {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05); // 加底部阴影区分层级
  z-index: 99; // 确保按钮在最上层，不被其他元素遮挡
}

/* 新增：提交按钮样式 */
.submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #2ecc71;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 40rpx; // 圆角样式
}
</style>
