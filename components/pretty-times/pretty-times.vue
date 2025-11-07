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
							<text v-else>{{ item.time }}</text>
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
							'active': item.time == timeQuanBegin || item.time == timeQuanEnd
						}" :style="{
							color: item.isMyAppoint ? '#2ecc71' :
								(item.time == timeQuanBegin || item.time == timeQuanEnd ? selectedItemColor : '#333')
						}" @click="handleSection(_index, item)">
							<text>{{ item.time }}</text>
							<!-- 核心修改2：区分过期/约满/可预约文本 -->
							<text class="all">
								{{ item.isMyAppoint ? '我已约' : (item.isExpired ? '已过期' : (item.disable ? disableText :
									undisableText)) }}
							</text>
						</view>
					</view>
				</template>
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
			}
		},
		// 新增：监听个人预约时段变化，重新初始化
		myAppointTimeSlot: {
			handler(val) {
				this.initOnload()
			}
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
			timeQuanEnd: "", //时间段结束时间
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

			// 计算“当前时间+1小时”
			const nowTimeStr = currentTime().time;
			const nowTimeStamp = new Date(`2000-01-01 ${nowTimeStr}`).getTime();
			const nextHourTimeStamp = nowTimeStamp + 3600000;
			const nextHourTime = new Date(nextHourTimeStamp).toTimeString().slice(0, 8);

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
						for (let time of this.disableTimeSlot) {
							const [begin_time = "", end_time = ""] = time
							if (begin_time && end_time && (begin_time <= cur_be_time && cur_end_time <= end_time)) {
								item.disable = true
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
					const cur_time = `${this.selectDate} ${item.time}`

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
						// 普通预约禁用（约满）
						this.appointTime.forEach(t => {
							let [date, time] = t.split(' ')
							if (date == this.selectDate && item.time == time) {
								item.disable = true
							}
						})
						// 禁用时间段（约满）
						for (let time of this.disableTimeSlot) {
							const [begin_time = "", end_time = ""] = time
							if (begin_time && end_time && (begin_time <= cur_time && cur_time <= end_time)) {
								item.disable = true
							}
						}
						// 核心修改4：当日过期判断，标记isExpired
						if (this.selectDate == this.nowDate && nextHourTime > item.time) {
							item.disable = true
							item.isExpired = true // 标记为过期时间
						}
					}

					if (!item.disable && !item.isMyAppoint) {
						isFullTime = false
					}
					this.isSection && (item.isInclude = false)
					if (this.isMultiple && (this.orderTimeArr[this.selectDate] || []).includes(item.time)) {
						item.isActive = true
					}
				}
			})

			// 默认时间选中逻辑
			this.orderDateTime = isFullTime ? "暂无选择" : this.selectDate
			this.timeActive = -1
			for (let i = 0, len = this.timeArr.length; i < len; i++) {
				if (!this.timeArr[i].disable && !this.timeArr[i].isMyAppoint) {
					this.orderDateTime = `${this.selectDate} ${this.timeArr[i].time}`
					this.timeActive = i
					return
				}
			}
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
				this.orderDateTime = `${this.selectDate} ${item.time}`;
				this.$emit('change', this.orderDateTime);
			}
		},
		// 选择时间段
		handleSection(index, item) {
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
				this.$emit('change', {
					beginTime: `${this.selectDate} ${this.timeQuanBegin}`,
					endTime: this.timeQuanEnd ? `${this.selectDate} ${this.timeQuanEnd}` : null,
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
				this.orderDateTime = {
					begin: `${this.selectDate} ${item.begin}:00`,
					end: `${this.selectDate} ${item.end}:00`,
				};
				this.$emit('change', this.orderDateTime);
			}
		},
		handleChange() {
			this.timeQuanBegin > this.timeQuanEnd && ([this.timeQuanBegin, this.timeQuanEnd] = [this.timeQuanEnd, this.timeQuanBegin])
		},
		handleSubmit() {
			if (this.isSection) {
				this.handleChange()
				this.$emit('change', {
					beginTime: `${this.selectDate} ${this.timeQuanBegin}`,
					endTime: this.timeQuanEnd ? `${this.selectDate} ${this.timeQuanEnd}` : null,
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

		}
	}
}
</script>
<style lang="scss" scoped>
@import './pretty-times.scss';
</style>