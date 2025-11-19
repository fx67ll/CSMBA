<template>
  <view class="fx67ll-reservation-box">
    <!-- 新增：全局遮罩层 -->
    <view v-if="loading || !isDataLoaded" class="loading-mask">
      <view class="loading-content">
        <text class="loading-text">加载数据中...</text>
      </view>
    </view>

    <!-- 新增：添加v-if控制，等待两次请求完成后再渲染子组件 -->
    <prettyTimes v-if="isDataLoaded" ref="prettyTimes" :showOvernight="appointConfig.showOvernight"
      :beginTime="appointConfig.allowBeginTime" :endTime="appointConfig.allowEndTime"
      :timeInterval="appointConfig.allowTimeInterval" :appointTime="appointConfig.appointTime" :isSection="true"
      :disableTimeSlot="appointConfig.disableTimeSlot" :myAppointTimeSlot="appointConfig.myAppointTimeSlot"
      :formParams="formParams" @change="handleTimeChange" @date-change="handleDateChange" @ready="handleComponentReady"
      @overnight-change="handleOvernightChange" @overnight-submit="handleOvernightSubmit">
    </prettyTimes>

    <!-- 优化：底部提交按钮容器（放入文档流，适配安全区域） -->
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

// 引入underscore库用于防抖
import _ from "@/node_modules/underscore";

export default {
  components: { prettyTimes },
  data() {
    return {
      appointConfig: {
        showOvernight: true,
        allowBeginTime: "10:00:00",
        allowEndTime: "22:00:00",
        allowTimeInterval: 1,
        appointTime: [],
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
      nowDateInfo: {},
      isOvernightSelected: false,  // 新增：标记是否选择了包夜
      // 新增：防抖函数实例
      debouncedSubmitReservation: null,
      // 新增：加载状态
      loading: false,
      // 新增：标记两次请求是否都完成
      isDataLoaded: false
    };
  },
  onShow() {
    // 重新渲染当前日期的预约
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

    // 4. 初始化防抖函数
    this.debouncedSubmitReservation = _.debounce(this._realHandleSubmitReservation, 500, true);

    // 5. 首次加载数据：等待两次请求都完成后再标记数据加载完成
    this.initData();
  },
  methods: {
    // 新增：初始化数据方法，等待两次queryLogList请求完成
    async initData() {
      this.loading = true;
      try {
        // 等待两次查询请求都完成
        await Promise.all([
          this.queryLogList(true),
          this.queryLogList(false)
        ]);
        // 两次请求都完成后，标记数据加载完成，渲染子组件
        this.isDataLoaded = true;
      } catch (error) {
        // 异常处理：即使有请求失败，也标记加载完成，避免页面卡死
        this.isDataLoaded = true;
        this.clearLogList();
        uni.showToast({
          title: "初始化数据失败！",
          icon: "none",
          duration: 1998,
        });
      } finally {
        this.loading = false;
      }
    },

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
    // 查询预约历史记录 - 修改为返回Promise
    queryLogList(isNeedAll = true) {
      const self = this;

      // 新增：开始查询时显示加载状态（如果还没显示的话）
      if (!this.loading) {
        this.loading = true;
      }

      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 999;
      this.queryParams.isNeedAll = isNeedAll;

      // 返回Promise，便于外部等待
      return new Promise((resolve, reject) => {
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
                // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
                if (isNeedAll) {
                  self.clearLogList();
                }
              }
              resolve(res);
            } else {
              // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
              if (isNeedAll) {
                self.clearLogList();
              }
              uni.showToast({
                title: "查询预约订单记录失败！",
                icon: "none",
                duration: 1998,
              });
              resolve(res); // 即使失败也resolve，让Promise.all能继续执行
            }
          })
          .catch((res) => {
            // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
            if (isNeedAll) {
              self.clearLogList();
            }
            reject(res);
          })
          .finally(() => {
            // 只有当两次请求都完成后才隐藏加载状态（在initData的finally中处理）
          });
      });
    },
    // 新增：包夜变化事件处理
    handleOvernightChange(overnightData) {
      if (overnightData) {
        this.isOvernightSelected = true;
        this.formParams.reservationStartTime = overnightData.start;
        this.formParams.reservationEndTime = moment(overnightData.end).subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss');
      } else {
        this.isOvernightSelected = false;
        this.formParams.reservationStartTime = null;
        this.formParams.reservationEndTime = null;
      }
    },
    // 新增：包夜提交事件处理
    handleOvernightSubmit(overnightData) {
      if (overnightData) {
        this.formParams.reservationStartTime = overnightData.start;
        this.formParams.reservationEndTime = overnightData.end;
        this.submitReservation();
      }
    },
    // 时间范围点击监听 
    handleTimeChange(timeArr) {
      const self = this;

      // 选择普通时间时，取消包夜标记
      this.isOvernightSelected = false;

      let startTime = timeArr?.beginTime || '';
      let endTime = timeArr?.endTime || '';

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

      // 日期切换时也等待两次请求完成
      this.loading = true;
      Promise.all([
        this.queryLogList(true),
        this.queryLogList(false)
      ]).finally(() => {
        this.loading = false;
      });
    },
    // 提交预约 - 添加防抖处理
    handleSubmitReservation() {
      // 调用防抖函数
      this.debouncedSubmitReservation();
    },

    // 新增：实际的提交预约逻辑（原handleSubmitReservation方法内容）
    _realHandleSubmitReservation() {
      // 如果已经通过包夜提交事件处理，则不再重复处理
      if (this.isOvernightSelected && this.formParams.reservationStartTime && this.formParams.reservationEndTime) {
        this.submitReservation();
        return;
      }

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

      this.submitReservation();
    },
    // 新增：统一的提交方法
    submitReservation() {
      const self = this;
      // 提交预约时显示加载状态
      this.loading = true;
      this.formParams.reservationEndTime = moment(self.formParams.reservationEndTime).add(1, 'h').format('YYYY-MM-DD HH:mm:ss');
      addMahjongReservationLog(self.formParams)
        .then((res) => {
          if (res?.code === 200) {
            // 提交成功后刷新数据，等待两次请求完成
            Promise.all([
              this.queryLogList(true),
              this.queryLogList(false)
            ]).then(() => {
              // 重置表单
              this.formParams.reservationStartTime = null;
              this.formParams.reservationEndTime = null;
              this.isOvernightSelected = false;

              uni.showToast({
                title: "提交预约订单成功！",
                icon: "none",
                duration: 1998,
              });
            });
          } else {
            uni.showToast({
              title: "提交预约订单失败！",
              icon: "none",
              duration: 1998,
            });
            // 提交失败后刷新当前预约记录
            Promise.all([
              this.queryLogList(true),
              this.queryLogList(false)
            ]);
          }
        })
        .catch((res) => {
          uni.showToast({
            title: "提交预约订单失败！",
            icon: "none",
            duration: 1998,
          });
          // 提交失败后刷新当前预约记录
          Promise.all([
            this.queryLogList(true),
            this.queryLogList(false)
          ]);
        })
        .finally(() => {
          // 提交完成（成功/失败）后隐藏加载状态
          this.loading = false;
          // 通过ref获取组件实例，调用清除方法
          this.$refs.prettyTimes.clearSelected();
        });
    }
  },
};
</script>

<style lang="scss">
page {
  background-color: #ffffff;
  padding-bottom: 220rpx;
  // min-height: 100vh;
  box-sizing: border-box;
}

.fx67ll-reservation-box {
  /* 优化：确保容器占满页面，按钮自然下沉到文档流底部 */
  width: 100%;
  // min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 优化：提交按钮容器（放入文档流，通过margin-top自动填充剩余空间） */
.submit-btn-container {
  width: 100%;
  padding: 20rpx 30rpx;
  padding-bottom: 220rpx;
  box-sizing: border-box;
}

/* 新增：提交按钮样式（保持原有样式不变） */
.submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #2ecc71;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 40rpx; // 圆角样式
}

/* 新增：全局遮罩层样式（保持原有样式不变） */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background-color: #ffffff;
  padding: 40rpx 60rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 32rpx;
  color: #333333;
}
</style>