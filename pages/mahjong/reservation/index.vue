<template>
  <view class="fx67ll-reservation-box">
    <prettyTimes ref="prettyTimes" :beginTime="appointConfig.allowBeginTime" :endTime="appointConfig.allowEndTime"
      :timeInterval="appointConfig.allowTimeInterval" :appointTime="appointConfig.appointTime" :isSection="true"
      :disableTimeSlot="appointConfig.disableTimeSlot" :myAppointTimeSlot="appointConfig.myAppointTimeSlot"
      @change="handleTimeChange" @date-change="handleDateChange" @ready="handleComponentReady">
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
        myAppointTimeSlot: []
      },
      logList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 999,
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
      },
      nowDateInfo: {}
    };
  },
  onShow() {
    // 重新渲染当前日期的预约
    console.log('nowDateInfo', this.nowDateInfo);
    this.handleDateChange(this.nowDateInfo);
  },
  onLoad() {
    // 1. 初始化当日日期（与组件返回的 selectedDate 格式一致：YYYY-MM-DD）
    const today = moment().format('YYYY-MM-DD');
    const todayWeek = moment().format('dddd'); // 获取星期（如 "Monday"，可按需转换为 "周一"）
    // 2. 初始化 nowDateInfo（匹配 handleDateChange 所需的参数结构）
    this.nowDateInfo = {
      selectedDate: today,
      selectedWeek: todayWeek, // 转换为中文星期（见步骤3的工具方法）
      activeIndex: 0 // 当日在日期列表中的索引（默认第1个）
    };
    // 3. 初始化查询参数（使用当日日期）
    this.queryParams.reservationDate = today.replace(/-/g, ""); // 转为后端需要的 YYYYMMDD 格式
    this.queryParams.pageNum = 1;
    this.queryParams.pageSize = 999;
    // 4. 首次加载数据
    this.queryLogList(true);
    this.queryLogList(false);
  },
  methods: {
    // 子组件渲染完成后，同步初始日期到父组件 nowDateInfo
    handleComponentReady() {
      // 子组件的 dateArr 是生成的日期列表，取第一个（默认选中的当日）
      const initDate = this?.$refs?.prettyTimes?.dateArr?.[0] || null;
      if (initDate) {
        this.nowDateInfo = {
          selectedDate: initDate.date,
          selectedWeek: initDate.week,
          activeIndex: 0
        };
      }
    },
    clearLogList() {
      this.logList = [];
      this.appointConfig.disableTimeSlot = [];
      this.appointConfig.myAppointTimeSlot = [];
    },
    // 查询预约历史记录
    queryLogList(isNeedAll = true) {
      const self = this;
      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 999;
      this.queryParams.isNeedAll = isNeedAll;
      listMahjongReservationLog(self.queryParams)
        .then((res) => {
          if (res?.code === 200) {
            if (res?.rows && res?.rows?.length > 0) {
              self.logList = res?.rows || [];
              const targetTimeSlot = (res?.rows || [])
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

              // 根据查询类型更新对应配置
              if (isNeedAll) {
                this.appointConfig.disableTimeSlot = targetTimeSlot;
              } else {
                this.appointConfig.myAppointTimeSlot = targetTimeSlot;
              }
            } else {
              self.clearLogList();
            }
          } else {
            self.clearLogList();
            uni.showToast({
              title: "查询预约订单记录失败！",
              icon: "none",
              duration: 1998,
            });
          }
        })
        .catch((res) => {
          self.clearLogList();
        });
    },
    // 时间范围点击监听 
    handleTimeChange(timeArr) {
      const self = this;

      let startTime = timeArr?.beginTime || '';
      let endTime = timeArr?.endTime || '';

      // 如果开始时间和结束时间相同，则给结束时间加1小时
      if (startTime && endTime && startTime === endTime) {
        endTime = moment(startTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
      }

      this.formParams = {
        ...self.formParams,
        reservationStartTime: startTime,
        reservationEndTime: endTime,
      }
    },
    // 日期切换监听
    handleDateChange(dateInfo) {
      this.nowDateInfo = dateInfo;
      // console.log('当前选中的日期：',dateInfo.selectedDate);
      // console.log('当前选中的星期：', dateInfo.selectedWeek);
      // console.log('选中日期的索引：', dateInfo.activeIndex);
      const dateStr = dateInfo?.selectedDate?.replace(/-/g, "") || '';
      this.queryParams.isNeedAll = true;
      this.queryParams.reservationDate = dateStr;
      this.queryLogList(true);
      this.queryLogList(false);
    },
    // 提交预约
    handleSubmitReservation() {
      const self = this;
      this.formParams.mahjongRoomId = 1;
      this.formParams.reservationStatus = 0;

      // 检查时间是否为空
      if (!this.formParams.reservationStartTime || !this.formParams.reservationEndTime) {
        uni.showToast({
          title: "请选择完整的预约时间段！",
          icon: "none",
          duration: 1998,
        });
        return; // 阻止提交
      }

      // 处理时间逻辑
      const start = moment(this.formParams.reservationStartTime);
      const end = moment(this.formParams.reservationEndTime);

      // 如果开始时间晚于结束时间，则自动对调
      if (start.isAfter(end)) {
        // 交换时间值
        [this.formParams.reservationStartTime, this.formParams.reservationEndTime] =
          [this.formParams.reservationEndTime, this.formParams.reservationStartTime];
      }

      addMahjongReservationLog(self.formParams)
        .then((res) => {
          if (res?.code === 200) {
            this.queryLogList(true);
            this.queryLogList(false);
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
