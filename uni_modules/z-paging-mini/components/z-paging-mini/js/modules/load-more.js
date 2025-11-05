// [z-paging]滚动到底部加载更多模块
import u from '.././z-paging-utils'
import Enum from '.././z-paging-enum'

export default {
	props: {
		//自定义底部加载更多加载中动画图标图片
		loadingMoreLoadingIconCustomImage: {
			type: String,
			default: u.gc('loadingMoreLoadingIconCustomImage', '')
		},
		//底部加载更多加载中view是否展示旋转动画，默认为是
		loadingMoreLoadingAnimated: {
			type: Boolean,
			default: u.gc('loadingMoreLoadingAnimated', true)
		},
		//是否启用加载更多数据(含滑动到底部加载更多数据和点击加载更多数据)，默认为是
		loadingMoreEnabled: {
			type: Boolean,
			default: u.gc('loadingMoreEnabled', true)
		},
		//是否启用滑动到底部加载更多数据，默认为是
		toBottomLoadingMoreEnabled: {
			type: Boolean,
			default: u.gc('toBottomLoadingMoreEnabled', true)
		},
		//滑动到底部状态为默认状态时，以加载中的状态展示，默认为否。若设置为是，可避免滚动到底部看到默认状态然后立刻变为加载中状态的问题，但分页数量未超过一屏时，不会显示【点击加载更多】
		loadingMoreDefaultAsLoading: {
			type: [Boolean],
			default: u.gc('loadingMoreDefaultAsLoading', false)
		},
		//滑动到底部"默认"文字，默认为【点击加载更多】
		loadingMoreDefaultText: {
			type: String,
			default: u.gc('loadingMoreDefaultText', '点击加载更多')
		},
		//滑动到底部"加载中"文字，默认为【正在加载...】
		loadingMoreLoadingText: {
			type: String,
			default: u.gc('loadingMoreLoadingText', '正在加载...')
		},
		//滑动到底部"没有更多"文字，默认为【没有更多了】
		loadingMoreNoMoreText: {
			type: String,
			default: u.gc('loadingMoreNoMoreText', '没有更多了')
		},
		//滑动到底部"加载失败"文字，默认为【加载失败，点击重新加载】
		loadingMoreFailText: {
			type: String,
			default: u.gc('loadingMoreFailText', '加载失败，点击重新加载')
		},
		//是否显示默认的加载更多text，默认为是
		showDefaultLoadingMoreText: {
			type: Boolean,
			default: u.gc('showDefaultLoadingMoreText', true)
		},
		//是否显示没有更多数据的view
		showLoadingMoreNoMoreView: {
			type: Boolean,
			default: u.gc('showLoadingMoreNoMoreView', true)
		},
		//距底部/右边多远时（单位px），触发 scrolltolower 事件，默认为100rpx
		lowerThreshold: {
			type: [Number, String],
			default: u.gc('lowerThreshold', '100rpx')
		},
	},
	data() {
		return {
			M: Enum.More,
			//底部加载更多状态
			loadingStatus: Enum.More.Default,
			loadingStatusAfterRender: Enum.More.Default,
			loadingMoreTimeStamp: 0,
			loadingMoreDefaultSlot: null,
			showLoadingMore: false,
			customNoMore: -1,
		}
	},
	computed: {
		zLoadMoreConfig() {
			return {
				status: this.loadingStatusAfterRender,
				defaultAsLoading: this.loadingMoreDefaultAsLoading,
				defaultThemeStyle: this.finalLoadingMoreThemeStyle,
				loadingIconCustomImage: this.loadingMoreLoadingIconCustomImage,
				loadingAnimated: this.loadingMoreLoadingAnimated,
				defaultText: this.loadingMoreDefaultText,
				loadingText: this.loadingMoreLoadingText,
				noMoreText: this.loadingMoreNoMoreText,
				failText: this.loadingMoreFailText,
				hideContent: !this.loadingMoreDefaultAsLoading && this.listRendering,
			};
		},
		finalLoadingMoreThemeStyle() {
			return this.loadingMoreThemeStyle.length ? this.loadingMoreThemeStyle : this.defaultThemeStyle;
		},
		showLoadingMoreDefault() {
			return this._showLoadingMore('Default');
		},
		showLoadingMoreLoading() {
			return this._showLoadingMore('Loading');
		},
		showLoadingMoreNoMore() {
			return this._showLoadingMore('NoMore');
		},
		showLoadingMoreFail() {
			return this._showLoadingMore('Fail');
		},
		showLoadingMoreCustom() {
			return this._showLoadingMore('Custom');
		}
	},
	methods: {
		//页面滚动到底部时通知z-paging进行进一步处理
		pageReachBottom() {
			this._onLoadingMore('toBottom');
		},
		//手动触发上拉加载更多(非必须，可依据具体需求使用)
		doLoadMore(type) {
			this._onLoadingMore(type);
		},
		//通过@scroll事件检测是否滚动到了底部
		_checkScrolledToBottom(scrollDiff, checked = false) {
			if (this.checkScrolledToBottomTimeOut) {
				clearTimeout(this.checkScrolledToBottomTimeOut);
				this.checkScrolledToBottomTimeOut = null;
			}
			if (this.cacheScrollNodeHeight === -1) {
				this._getNodeClientRect('.zp-scroll-view').then((res) => {
					if (res) {
						let pageScrollNodeHeight = res[0].height;
						this.cacheScrollNodeHeight = pageScrollNodeHeight;
						if (scrollDiff - pageScrollNodeHeight <= this.finalLowerThreshold) {
							this._onLoadingMore('toBottom');
						}
					}
				});
			} else {
				if (scrollDiff - this.cacheScrollNodeHeight <= this.finalLowerThreshold) {
					this._onLoadingMore('toBottom');
				} else if (scrollDiff - this.cacheScrollNodeHeight <= 500 && !checked) {
					this.checkScrolledToBottomTimeOut = setTimeout(() => {
						this._getNodeClientRect('.zp-scroll-view', true, true).then((res) => {
							this.oldScrollTop = res[0].scrollTop;
							const newScrollDiff = res[0].scrollHeight - this.oldScrollTop;
							this._checkScrolledToBottom(newScrollDiff, true);
						})
					}, 150)
				}
			}
		},
		//触发加载更多时调用,from:0-滑动到底部触发；1-点击加载更多触发
		_onLoadingMore(from = 'click') {
			if (from === 'toBottom' && this.scrollEnable) {
				this.scrollEnable = false;
				this.$nextTick(() => {
					this.scrollEnable = true;
				})
			}
			this.$emit('scrolltolower', from);
			if (from === 'toBottom' && !this.toBottomLoadingMoreEnabled) return;
			if (this.refresherOnly || !this.loadingMoreEnabled || !(this.loadingStatus === Enum.More.Default || this.loadingStatus === Enum.More.Fail) || this.loading) return;
			// #ifdef MP-WEIXIN
			if (!this.isIos && !this.refresherOnly && !this.usePageScroll) {
				const currentTimestamp = u.getTime();
				if (this.loadingMoreTimeStamp > 0 && currentTimestamp - this.loadingMoreTimeStamp < 100) {
					this.loadingMoreTimeStamp = 0;
					return;
				}
			}
			// #endif
			this._doLoadingMore();
		},
		//处理开始加载更多
		_doLoadingMore() {
			if (this.pageNo >= this.defaultPageNo && this.loadingStatus !== Enum.More.NoMore) {
				this.pageNo ++;
				this._startLoading(false);
				if (this.isLocalPaging) {
					this._localPagingQueryList(this.pageNo, this.defaultPageSize, this.localPagingLoadingTime, (res) => {
						this.addData(res);
					})
				} else {
					this._emitQuery(this.pageNo, this.defaultPageSize, Enum.QueryFrom.LoadingMore);
				}
				this.loadingType = Enum.LoadingType.LoadingMore;
			}
		},
		//是否要展示上拉加载更多view
		_showLoadingMore(type) {
			if (!this.showLoadingMoreWhenReload && (!(this.loadingStatus === Enum.More.Default ? this.nShowBottom : true) || !this.totalData.length)) return false;
			if (((!this.showLoadingMoreWhenReload || this.isUserPullDown || this.loadingStatus !== Enum.More.Loading) && !this.showLoadingMore) || 
			(!this.loadingMoreEnabled && (!this.showLoadingMoreWhenReload || this.isUserPullDown || this.loadingStatus !== Enum.More.Loading)) || 
			this.refresherOnly) return false;
			if (!this.$slots) return false;
			if (type === 'Custom') {
				return this.showDefaultLoadingMoreText && !(this.loadingStatus === Enum.More.NoMore && !this.showLoadingMoreNoMoreView);
			}
			const res = this.loadingStatus === Enum.More[type] && this.$slots[`loadingMore${type}`] && (type === 'NoMore' ? this.showLoadingMoreNoMoreView : true);
			if (res) {
				// #ifdef APP-NVUE
				if (!this.isIos) {
					this.nLoadingMoreFixedHeight = false;
				}
				//  #endif
			}
			return res;
		},
	}
}
