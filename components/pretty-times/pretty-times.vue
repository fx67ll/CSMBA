<template>
	<view class="content">
		<view class="container">
			<!-- 日期列表 -->
			<scroll-view class="scroll-view_H b-t b-b" scroll-x>
				<block v-for="(item, index) in dateArr" :key="index">
					<div class="flex-box" @click="selectDateEvent(index, item)"
						:class="{ borderb: index == dateActive }">
						<view class="date-box" :style="{ color: index == dateActive ? selectedTabColor : '#333' }">
							<text class="fontw">{{ item.week }}</text>
							<text>{{ item.date }}</text>
						</view>
					</div>
				</block>
			</scroll-view>

			<!-- 时间选项 -->
			<view class="time-box" v-if="!isSection || isQuantum">
				<template v-for="(item, _index) in timeArr">
					<view class="item" :key="_index">
						<view class="item-box" :class="{
							'disable': item.disable && !item.isMyAppoint,
							'my-appoint': item.isMyAppoint,
							'active': isMultiple ? item.isActive : _index == timeActive
						}" :style="{
							color: item.isMyAppoint ? '#2ecc71' :
								(isMultiple ? item.isActive ? selectedItemColor : '#333'
									: _index == timeActive ? selectedItemColor : '#333')
						}" @click="selectTimeEvent(_index, item)">
							<text v-if="isQuantum">{{ item.begin }}~{{ item.end }}</text>
							<text v-else>{{ item.timeRange }}</text>
							<!-- 核心修改1：区分过期/约满/可预约文本 -->
							<text class="all">
								{{ item.isMyAppoint ? '我已约' : (item.isExpired ? '已过期' : (item.disable ? disableText :
									undisableText)) }}
							</text>
						</view>
					</view>
				</template>
			</view>

			<!-- 预约时间段 -->
			<view class="time-box" v-else>
				<template v-for="(item, _index) in timeArr">
					<view class="item" :key="_index">
						<view class="item-box" :class="{
							'disable': item.disable && !item.isMyAppoint,
							'my-appoint': item.isMyAppoint,
							'active': item.time == timeQuanBegin || item.time == timeQuanEnd || item.isInclude
						}" :style="{
							color: item.isMyAppoint ? '#2ecc71' :
								(item.time == timeQuanBegin || item.time == timeQuanEnd || item.isInclude ? selectedItemColor : '#333')
						}" @click="handleSection(_index, item)">
							<text>{{ item.timeRange }}</text>
							<!-- 核心修改2：区分过期/约满/可预约文本 -->
							<text class="all">
								{{ item.isMyAppoint ? '我已约' : (item.isExpired ? '已过期' : (item.disable ? disableText :
									undisableText)) }}
							</text>
						</view>
					</view>
				</template>

				<!-- 包夜选项 - 修改：放在时间段的最后，占用两个格子 -->
				<view class="item overnight-item-wrapper" v-if="showOvernight">
					<view class="item-box overnight-box" :class="{
						'active': isOvernightActive,
						'disable': isOvernightDisabled
					}" @click="selectOvernightEvent">
						<view class="overnight-content">
							<text class="overnight-title">包夜</text>
							<text class="overnight-time">23:00 ~ 次日09:59</text>
							<text class="overnight-status">
								{{ getOvernightStatusText() }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<view class="bottom">
			<view class="show-time" v-if="!isMultiple && !isSection && !isQuantum">
				预约时间：{{ orderDateTime }}
			</view>
			<button form-type="submit" type="default" size="mini" class="submit-btn" @click="handleSubmit">
				确认预约
			</button>
		</view>
	</view>
</template>

<script>
import {
	initData,
	initTime,
	timeStamp,
	currentTime
} from '@/utils/date.js'

export default {
	name: 'prettyTimes',
	model: {
		prop: "showPop",
		event: "change"
	},
	props: {
		isQuantum: {
			type: Boolean,
			default: false
		},
		isMultiple: { //是否多选
			type: Boolean,
			default: false
		},
		isSection: { //预约时间段
			type: Boolean,
			default: false
		},
		// 新增：是否显示包夜选项
		showOvernight: {
			type: Boolean,
			default: false
		},
		disableText: { //禁用显示的文本（约满时）
			type: String,
			default: "已约满"
		},
		undisableText: { //未禁用显示的文本
			type: String,
			default: "可预约"
		},
		timeInterval: { // 时间间隔，小时为单位
			type: Number,
			default: 1
		},
		selectedTabColor: { // 日期栏选中的颜色
			type: String,
			default: "#2ecc71"
		},
		selectedItemColor: { // 时间选中的颜色
			type: String,
			default: "#2ecc71"
		},
		beginTime: {
			type: String,
			default: "09:00:00"
		},
		endTime: {
			type: String,
			default: "19:00:00"
		},
		appointTime: { // 预约的时间
			type: Array,
			default() {
				return []
			}
		},
		disableTimeSlot: { // 预约开始和结束时间，来禁用时间段
			type: Array,
			default() {
				return []
			}
		},
		// 新增：个人预约时段，格式同disableTimeSlot [['开始时间1','结束时间1'], ['开始时间2','结束时间2']]
		myAppointTimeSlot: {
			type: Array,
			default() {
				return []
			}
		},
		// 新增：用于回显的formParams
		formParams: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	watch: {
		appointTime: {
			handler(val) {
				this.initOnload()
			}
		},
		disableTimeSlot: {
			handler(val) {
				this.initOnload()
			},
			deep: true
		},
		// 新增：监听个人预约时段变化，重新初始化
		myAppointTimeSlot: {
			handler(val) {
				this.initOnload()
			},
			deep: true
		},
		// 新增：监听formParams变化，用于回显
		formParams: {
			handler(val) {
				this.checkOvernightEcho();
				this.checkTimeSectionEcho();
			},
			deep: true
		}
	},
	data() {
		return {
			orderDateTime: '暂无选择', // 选中时间
			orderTimeArr: {}, //多选的时间
			dateArr: [], //日期数据
			timeArr: [], //时间数据
			nowDate: "", // 当前日期
			dateActive: 0, //选中的日期索引
			timeActive: 0, //选中的时间索引
			timeQuanBeginIndex: 0, //时间段开始的下标
			selectDate: "", //选择的日期
			timeQuanBegin: "", //时间段开始时间
			timeQuanEnd: "", //时间段结束时间,
			// 新增：包夜选中状态
			isOvernightActive: false,
			// 新增：包夜禁用状态
			isOvernightDisabled: false,
			// 新增：包夜是否已过期
			isOvernightExpired: false,
			// 新增：包夜是否是我已约
			isOvernightMyAppoint: false
		}
	},
	created(props) {
		this.selectDate = this.nowDate = currentTime().date
		this.initOnload()
	},
	mounted() {
		this.$emit('ready');
	},
	methods: {
		initOnload() {
			this.dateArr = initData()
			this.timeArr = initTime(this.beginTime, this.endTime, this.timeInterval, this.isQuantum)
			this.timeQuanBegin = this.timeQuanEnd = ""
			let isFullTime = true

			// 计算"当前时间+1小时"
			const nowTimeStr = currentTime().time;
			const nowTimeStamp = new Date(`2000-01-01 ${nowTimeStr}`).getTime();
			const nextHourTimeStamp = nowTimeStamp + 3600000;
			const nextHourTime = new Date(nextHourTimeStamp).toTimeString().slice(0, 8);

			// 核心修改1：为时间段模式的时间项添加时间范围显示（改为 xx:00~xx:59 格式）
			if (this.isSection && !this.isQuantum) {
				this.timeArr.forEach((item, index) => {
					const currentTime = item.time;
					// 去掉秒数，只保留小时和分钟（开始时间：xx:00）
					const currentTimeWithoutSeconds = currentTime.slice(0, 5);
					// 提取当前小时，拼接 ":59" 作为结束时间（显示用）
					const currentHour = currentTime.slice(0, 2);
					const endTime = `${currentHour}:59`;
					// 添加时间范围属性（xx:00~xx:59）
					item.timeRange = `${currentTimeWithoutSeconds}~${endTime}`;
				});
			} else if (!this.isQuantum) {
				// 普通时间模式也添加时间范围显示（改为 xx:00~xx:59 格式）
				this.timeArr.forEach((item, index) => {
					const currentTime = item.time;
					// 去掉秒数，只保留小时和分钟（开始时间：xx:00）
					const currentTimeWithoutSeconds = currentTime.slice(0, 5);
					// 提取当前小时，拼接 ":59" 作为结束时间（显示用）
					const currentHour = currentTime.slice(0, 2);
					const endTime = `${currentHour}:59`;
					// 添加时间范围属性（xx:00~xx:59）
					item.timeRange = `${currentTimeWithoutSeconds}~${endTime}`;
				});
			}

			// 新增：检查包夜状态
			this.checkOvernightStatus();

			// 新增：检查时间段回显
			this.checkTimeSectionEcho();

			this.timeArr.forEach((item, index) => {
				// 初始化状态：清除之前的标记
				item.isMyAppoint = false;
				item.isExpired = false; // 核心新增：标记是否为过期时间

				// 时间段（量子时间模式）
				if (this.isQuantum) {
					const cur_be_time = `${this.selectDate} ${item.begin}:00`
					const cur_end_time = `${this.selectDate} ${item.end}:00`

					// 优先判断是否为个人预约时段
					for (let time of this.myAppointTimeSlot) {
						const [my_begin = "", my_end = ""] = time
						if (my_begin && my_end && (my_begin <= cur_be_time && cur_end_time <= my_end)) {
							item.isMyAppoint = true;
							item.disable = false;
						}
					}

					// 再判断普通禁用时段（个人预约时段不受此影响）
					if (!item.isMyAppoint) {
						// 增加disableTimeSlot空数组判断
						if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
							for (let time of this.disableTimeSlot) {
								const [begin_time = "", end_time = ""] = time
								// 增加时间格式校验
								if (!begin_time || !end_time ||
									isNaN(new Date(begin_time).getTime()) ||
									isNaN(new Date(end_time).getTime())) {
									continue;
								}
								if (begin_time <= cur_be_time && cur_end_time <= end_time) {
									item.disable = true
								}
							}
						}
						// 核心修改3：当日过期判断，标记isExpired
						if (this.selectDate == this.nowDate && nextHourTime > `${item.begin}:00`) {
							item.disable = true
							item.isExpired = true // 标记为过期时间
						}
					}

					// 多选时间段回显
					if (this.orderTimeArr[this.selectDate]) {
						for (let items of this.orderTimeArr[this.selectDate]) {
							if (items[0].split(' ')[1] === `${item.begin}:00` && items[1].split(' ')[1] === `${item.end}:00`) {
								item.isActive = true
							}
						}
					}

				} else {
					// 普通时间模式
					// 增加item.time格式校验
					if (!item.time || item.time.length < 8) {
						item.disable = true;
						return;
					}
					const cur_time = `${this.selectDate} ${item.time}`;
					// 增加cur_time格式校验
					if (isNaN(new Date(cur_time).getTime())) {
						item.disable = true;
						return;
					}

					// 优先判断是否为个人预约时段
					for (let time of this.myAppointTimeSlot) {
						const [my_begin = "", my_end = ""] = time
						if (my_begin && my_end && (my_begin <= cur_time && cur_time <= my_end)) {
							item.isMyAppoint = true;
							item.disable = false;
						}
					}

					// 再判断普通禁用逻辑（个人预约时段不受此影响）
					if (!item.isMyAppoint) {
						// 调整顺序：先处理时间段禁用（disableTimeSlot）
						if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
							for (let time of this.disableTimeSlot) {
								const [begin_time = "", end_time = ""] = time
								if (!begin_time || !end_time ||
									isNaN(new Date(begin_time).getTime()) ||
									isNaN(new Date(end_time).getTime())) {
									continue;
								}
								if (begin_time <= cur_time && cur_time <= end_time) {
									item.disable = true;
									break; // 匹配到一个禁用时段即可
								}
							}
						}

						// 再处理普通预约禁用（约满）
						if (!item.disable) {
							this.appointTime.forEach(t => {
								let [date, time] = t.split(' ');
								if (!date || !time || date !== this.selectDate) {
									return;
								}
								if (item.time === time) {
									item.disable = true;
								}
							});
						}

						// 核心修改4：当日过期判断，标记isExpired
						if (!item.disable && this.selectDate == this.nowDate && nextHourTime > item.time) {
							item.disable = true
							item.isExpired = true // 标记为过期时间
						}
					}

					if (!item.disable && !item.isMyAppoint) {
						isFullTime = false
					}
					// 初始化时不清除isInclude，以便回显
					if (this.isSection) {
						// 只有在没有回显数据时才重置isInclude
						if (!this.formParams.reservationStartTime || !this.formParams.reservationEndTime) {
							item.isInclude = false;
						}
					}
					if (this.isMultiple && (this.orderTimeArr[this.selectDate] || []).includes(item.time)) {
						item.isActive = true
					}
				}
			})

			// 重新计算isFullTime（确保基于完整的状态）
			isFullTime = true;
			this.timeArr.forEach(item => {
				if (!item.disable && !item.isMyAppoint) {
					isFullTime = false;
				}
			});

			// 默认时间选中逻辑（修复：用break代替return，避免中断遍历）
			this.orderDateTime = isFullTime ? "暂无选择" : this.selectDate
			this.timeActive = -1
			for (let i = 0, len = this.timeArr.length; i < len; i++) {
				if (!this.timeArr[i].disable && !this.timeArr[i].isMyAppoint) {
					// 核心修改5：显示时间时去掉秒数（开始时间），结束时间显示为 xx:59
					const currentHour = this.timeArr[i].time.slice(0, 2);
					const timeWithoutSeconds = this.timeArr[i].time.slice(0, 5);
					this.orderDateTime = `${this.selectDate} ${timeWithoutSeconds}~${currentHour}:59`
					this.timeActive = i
					break; // 用break代替return，确保后续逻辑执行
				}
			}
		},
		// 新增：检查时间段回显
		checkTimeSectionEcho() {
			if (!this.isSection || !this.formParams.reservationStartTime || !this.formParams.reservationEndTime) {
				return;
			}

			const startTime = this.formParams.reservationStartTime;
			const endTime = this.formParams.reservationEndTime;

			// 检查是否是当前选中的日期
			const startDate = startTime.split(' ')[0];
			if (startDate !== this.selectDate) {
				return;
			}

			// 解析开始和结束时间（实际提交的时间不变，仅显示修改）
			const startHour = startTime.split(' ')[1].slice(0, 2);
			const startHourMin = startTime.split(' ')[1].slice(0, 5);
			// 显示用结束时间改为 startHour:59（实际提交的 endTime 不变）
			const displayEndTime = `${startHour}:59`;

			// 找到开始和结束时间对应的索引
			let startIndex = -1;
			let endIndex = -1;

			this.timeArr.forEach((item, index) => {
				const itemTime = item.time.slice(0, 5);
				if (itemTime === startHourMin) {
					startIndex = index;
				}
				// 结束时间索引匹配实际提交的 endTime（确保选中状态正确）
				if (item.time.slice(0, 5) === endTime.split(' ')[1].slice(0, 5)) {
					endIndex = index;
				}
			});

			if (startIndex !== -1 && endIndex !== -1) {
				// 设置时间段选择状态
				this.timeQuanBeginIndex = startIndex;
				this.timeQuanBegin = this.timeArr[startIndex].time;
				this.timeQuanEnd = this.timeArr[endIndex].time;

				// 设置中间时间段的isInclude状态
				for (let i = startIndex + 1; i < endIndex; i++) {
					this.timeArr[i].isInclude = true;
				}

				// 核心修改6：回显时显示为 xx:00~xx:59 格式
				this.orderDateTime = `${this.selectDate} ${startHourMin} ~ ${displayEndTime}`;
			}
		},
		// 新增：获取包夜状态文本
		getOvernightStatusText() {
			if (this.isOvernightExpired) {
				return '已过期';
			} else if (this.isOvernightMyAppoint) {
				return '我已约';
			} else if (this.isOvernightDisabled) {
				return '已约满';
			} else {
				return '可预约';
			}
		},
		// 新增：检查包夜状态
		checkOvernightStatus() {
			// 重置包夜状态
			this.isOvernightActive = false;
			this.isOvernightDisabled = false;
			this.isOvernightExpired = false;
			this.isOvernightMyAppoint = false;

			if (!this.showOvernight) return;

			// 构建包夜时间段
			const overnightStart = `${this.selectDate} 23:00:00`;
			const nextDate = this.getNextDate(this.selectDate);
			const overnightEnd = `${nextDate} 09:00:00`;

			// 检查是否已过期（当日23:00之后不能预约包夜）
			if (this.selectDate === this.nowDate) {
				const currentDateTime = new Date();
				const overnightStartTime = new Date(`${this.selectDate} 23:00:00`);
				if (currentDateTime >= overnightStartTime) {
					this.isOvernightExpired = true;
					this.isOvernightDisabled = true;
				}
			}

			// 检查是否是我已约
			for (let time of this.myAppointTimeSlot) {
				const [my_begin = "", my_end = ""] = time;
				if (my_begin && my_end && my_begin === overnightStart && my_end === overnightEnd) {
					this.isOvernightMyAppoint = true;
					this.isOvernightDisabled = true;
					break;
				}
			}

			// 检查是否是已约满（被其他人预约）
			if (!this.isOvernightMyAppoint && !this.isOvernightExpired) {
				if (this.disableTimeSlot && this.disableTimeSlot.length > 0) {
					for (let time of this.disableTimeSlot) {
						const [begin_time = "", end_time = ""] = time;
						if (begin_time && end_time) {
							// 如果包夜时间段与任何禁用时间段有重叠，则禁用包夜
							if ((begin_time <= overnightStart && overnightStart < end_time) ||
								(begin_time < overnightEnd && overnightEnd <= end_time) ||
								(overnightStart <= begin_time && end_time <= overnightEnd)) {
								this.isOvernightDisabled = true;
								break;
							}
						}
					}
				}
			}

			// 检查回显：如果数据流中包含23:00到10:00的时间段，则选中包夜
			this.checkOvernightEcho();
		},
		// 新增：检查包夜回显
		checkOvernightEcho() {
			if (!this.showOvernight) return;

			// 构建包夜时间段
			const overnightStart = `${this.selectDate} 23:00:00`;
			const nextDate = this.getNextDate(this.selectDate);
			const overnightEnd = `${nextDate} 10:00:00`;

			// 检查当前选中的时间段是否匹配包夜
			if (this.formParams && this.formParams.reservationStartTime && this.formParams.reservationEndTime) {
				const startTime = this.formParams.reservationStartTime;
				const endTime = this.formParams.reservationEndTime;

				if (startTime === overnightStart && endTime === overnightEnd) {
					this.isOvernightActive = true;
					this.orderDateTime = `${this.selectDate} 23:00 ~ ${nextDate} 10:00`;
				} else {
					this.isOvernightActive = false;
				}
			}
		},
		// 新增：获取次日日期
		getNextDate(date) {
			const currentDate = new Date(date);
			currentDate.setDate(currentDate.getDate() + 1);
			return currentDate.toISOString().split('T')[0];
		},
		// 新增：包夜选择事件
		selectOvernightEvent() {
			// 包夜已禁用（已过期、我已约、已约满）时不能选择
			if (this.isOvernightDisabled) return;

			this.isOvernightActive = !this.isOvernightActive;

			if (this.isOvernightActive) {
				// 选中包夜时，清空其他时间选择
				this.clearTimeSelection();

				const overnightStart = `${this.selectDate} 23:00:00`;
				const nextDate = this.getNextDate(this.selectDate);
				const overnightEnd = `${nextDate} 10:00:00`;

				// 触发包夜选择事件
				this.$emit('overnight-change', {
					start: overnightStart,
					end: overnightEnd,
					date: this.selectDate
				});

				// 同时更新orderDateTime用于显示
				this.orderDateTime = `${this.selectDate} 23:00 ~ ${nextDate} 10:00`;
			} else {
				// 取消包夜选择
				this.$emit('overnight-change', null);
				this.orderDateTime = "暂无选择";
			}
		},
		// 新增：清空时间选择
		clearTimeSelection() {
			this.timeActive = -1;
			this.timeQuanBegin = "";
			this.timeQuanEnd = "";
			this.orderDateTime = "暂无选择";
			this.orderTimeArr = {};

			// 清空时间数组的选中状态
			this.timeArr.forEach(item => {
				item.isActive = false;
				item.isInclude = false;
			});
		},
		// 日期选择事件
		selectDateEvent(index, item) {
			this.dateActive = index
			this.selectDate = item.date
			this.initOnload()

			this.$emit('date-change', {
				selectedDate: item.date,
				selectedWeek: item.week,
				activeIndex: index
			});
		},
		// 普通时间选择事件
		selectTimeEvent(index, item) {
			// 选择普通时间时，取消包夜选择
			if (this.isOvernightActive) {
				this.isOvernightActive = false;
				this.$emit('overnight-change', null);
			}

			if (this.isQuantum) {
				return this.handleSelectQuantum(index, item);
			}
			// 个人预约时段禁止点击修改
			if (item.isMyAppoint || item.disable) return;

			if (this.isMultiple) {
				item.isActive = !item.isActive;
				this.timeArr = this.timeArr.slice();
				this.orderTimeArr[this.selectDate] = this.timeArr.reduce((prev, cur) => {
					cur.isActive && prev.push(cur.time);
					return prev;
				}, []);
				let time = [];
				for (let date in this.orderTimeArr) {
					this.orderTimeArr[date].forEach(item => {
						time.push(`${date} ${item}`);
					});
				}
				this.$emit('change', time);
			} else {
				this.timeActive = index;
				// 核心修改7：显示选中时间时改为 xx:00~xx:59 格式（实际提交的时间不变）
				const currentHour = item.time.slice(0, 2);
				const timeWithoutSeconds = item.time.slice(0, 5);
				this.orderDateTime = `${this.selectDate} ${timeWithoutSeconds}~${currentHour}:59`;
				this.$emit('change', this.orderDateTime);
			}
		},
		// 选择时间段
		handleSection(index, item) {
			// 选择时间段时，取消包夜选择
			if (this.isOvernightActive) {
				this.isOvernightActive = false;
				this.$emit('overnight-change', null);
			}

			// 个人预约时段禁止点击修改
			if (item.isMyAppoint || item.disable) return;

			const clearTime = () => {
				this.timeQuanBeginIndex = index;
				this.timeQuanBegin = item.time;
				this.timeQuanEnd = "";
				this.$emit('change', {
					beginTime: `${this.selectDate} ${this.timeQuanBegin}`,
					endTime: this.timeQuanEnd ? `${this.selectDate} ${this.timeQuanEnd}` : null,
				});
			};

			if (!this.timeQuanBegin) {
				clearTime();
				return;
			}

			if (!this.timeQuanEnd && this.timeQuanBegin) {
				let isDisble = false;
				let start = this.timeQuanBeginIndex;
				let end = index;
				start > end && ([start, end] = [end, start]);

				for (let i = start + 1; i < end; i++) {
					if (this.timeArr[i].disable || this.timeArr[i].isMyAppoint) {
						isDisble = true;
						clearTime();
						return;
					}
				}

				if (!isDisble) {
					for (let i = start + 1; i < end; i++) {
						this.timeArr[i].isInclude = true;
					}
				}
				this.timeQuanEnd = item.time;

				// 核心修改8：提交完整的时间段（实际时间不变），显示时改为 xx:00~xx:59
				const startTime = `${this.selectDate} ${this.timeQuanBegin}`;
				const endTime = `${this.selectDate} ${this.timeQuanEnd}`;
				const startHour = this.timeQuanBegin.slice(0, 2);
				const startHourMin = this.timeQuanBegin.slice(0, 5);
				const displayEndTime = `${startHour}:59`;

				// 更新显示文本
				this.orderDateTime = `${this.selectDate} ${startHourMin} ~ ${displayEndTime}`;

				this.$emit('change', {
					beginTime: startTime,
					endTime: endTime,
				});
				return;
			}

			if (this.timeQuanBegin && this.timeQuanEnd) {
				this.timeArr.forEach(t => {
					t.isInclude = false;
				});
				clearTime();
			}
		},
		// 选择量子时间
		handleSelectQuantum(index, item) {
			// 选择量子时间时，取消包夜选择
			if (this.isOvernightActive) {
				this.isOvernightActive = false;
				this.$emit('overnight-change', null);
			}

			// 个人预约时段禁止点击修改
			if (item.isMyAppoint || item.disable) return;

			if (this.isMultiple) {
				item.isActive = !item.isActive;
				this.timeArr = this.timeArr.slice();
				this.orderTimeArr[this.selectDate] = this.timeArr.reduce((prev, cur) => {
					const cur_be_time = `${this.selectDate} ${cur.begin}:00`;
					const cur_end_time = `${this.selectDate} ${cur.end}:00`;
					cur.isActive && prev.push([cur_be_time, cur_end_time]);
					return prev;
				}, []);
				this.$emit('change', this.orderTimeArr);
			} else {
				this.timeActive = index;
				// 核心修改9：量子时间模式显示改为 xx:00~xx:59（实际提交的时间不变）
				const displayEndTime = `${item.begin.slice(0, 2)}:59`;
				this.orderDateTime = {
					begin: `${this.selectDate} ${item.begin}:00`,
					end: `${this.selectDate} ${item.end}:00`,
					// 新增显示用属性（不影响提交）
					displayText: `${item.begin}:00~${displayEndTime}`
				};
				this.$emit('change', this.orderDateTime);
			}
		},
		handleChange() {
			this.timeQuanBegin > this.timeQuanEnd && ([this.timeQuanBegin, this.timeQuanEnd] = [this.timeQuanEnd, this.timeQuanBegin])
		},
		handleSubmit() {
			// 如果选择了包夜，优先触发包夜事件
			if (this.isOvernightActive) {
				const overnightStart = `${this.selectDate} 23:00:00`;
				const nextDate = this.getNextDate(this.selectDate);
				const overnightEnd = `${nextDate} 10:00:00`;

				this.$emit('overnight-submit', {
					start: overnightStart,
					end: overnightEnd,
					date: this.selectDate
				});
				return;
			}

			if (this.isSection) {
				this.handleChange()
				// 核心修改10：提交完整的时间段（实际时间不变）
				const startTime = `${this.selectDate} ${this.timeQuanBegin}`;
				const endTime = this.timeQuanEnd ? `${this.selectDate} ${this.timeQuanEnd}` : null;

				this.$emit('change', {
					beginTime: startTime,
					endTime: endTime,
				})
				return
			}
			if (this.isMultiple) {
				if (this.isQuantum) {
					this.$emit('change', this.orderTimeArr)
					return
				}
				let time = []
				for (let date in this.orderTimeArr) {
					this.orderTimeArr[date].forEach(item => {
						time.push(`${date} ${item}`)
					})
				}
				this.$emit('change', time)
			} else {
				this.$emit('change', this.orderDateTime)
			}
		},
		// 新增：主动清除所有选中状态（供父组件调用）
		clearSelected() {
			// // 1. 重置日期选中
			// this.dateActive = 0;
			// this.selectDate = this.nowDate;

			// 2. 重置时间选中（覆盖所有模式）
			this.timeActive = -1;
			this.timeQuanBegin = "";
			this.timeQuanEnd = "";
			this.timeQuanBeginIndex = 0;
			this.orderDateTime = "暂无选择";
			this.orderTimeArr = {};

			// 3. 重置时间项状态
			this.timeArr.forEach(item => {
				item.isActive = false;
				item.isInclude = false;
			});

			// 4. 重置包夜选中状态
			this.isOvernightActive = false;
			this.$emit('overnight-change', null); // 通知父组件取消包夜

			// 5. 重新初始化时间数据（确保状态同步）
			this.initOnload();

			// 6. 通知父组件选中状态已清空
			this.$emit('clear', true);
		}
	}
}
</script>

<style lang="scss" scoped>
@import './pretty-times.scss';
</style>