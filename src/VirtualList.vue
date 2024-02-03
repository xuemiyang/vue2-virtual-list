<template>
  <div class="wrapper" @scroll.passive="handleScroll">
      <div class="content" :style="contentStyle">
          <div v-for="(item, index) in showList" :key="index" :style="itemStyle">
              <slot :item="item.value" :index="item.index"></slot>
          </div>
      </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'

type Region = { rowCount: number; columnCount: number }
type Position = { row: number; column: number }

export default Vue.extend({
  props: {
    type: {
      type: String as PropType<'horizontal' | 'vertical'>,
      required: true
    },
    itemWidth: Number,
    itemHeight: Number,
    rowSpace: Number,
    columnSpace: Number,
    repeatNumber: Number,
    values: Array
  },
  data() {
    return {
      width: 0,
      height: 0,
      // 偏移位置，用于处理到达css最大长度的情况
      offsetRegion: { rowCount: 0, columnCount: 0 },
      // 渲染元素的第一个位置
      startPosition: { row: 0, column: 0 },

    }
  },
  computed: {
    itemWidthWithSpace(): number {
      return this.itemWidth + this.columnSpace
    },
    itemHeightWithSpace(): number {
      return this.itemHeight + this.rowSpace
    },
    /**
     * css能设置的最大宽高，这里取一半
     * https://stackoverflow.com/questions/16637530/whats-the-maximum-pixel-value-of-css-width-and-height-properties
     * Firefox: 33554400px
     * Chrome:  33554428px
     * Opera:   33554428px
     * IE 9:    21474836.47px
     */
    CSSMaxWidth(): number {
      return Math.floor(16777200 / this.itemWidthWithSpace) * this.itemWidthWithSpace
    },
    CSSMaxHeight(): number {
      return Math.floor(16777200 / this.itemHeightWithSpace) * this.itemHeightWithSpace
    },
    offsetRow(): number {
      return Math.floor(167772 / this.itemHeightWithSpace)
    },
    offseColumn(): number {
      return Math.floor(167772 / this.itemWidthWithSpace)
    },
    itemWidthPx(): string {
      return `${this.itemWidth}px`
    },
    itemHeightPx(): string {
      return `${this.itemHeight}px`
    },
    columnSpacePx(): string {
      return `${this.columnSpace}px`
    },
    rowSpacePx(): string {
      return `${this.rowSpace}px`
    },
    contentMarginLeftPx(): string {
      return `${-this.columnSpace}px`
    },
    contentMarginTopPx(): string {
      return `${-this.rowSpace}px`
    },
    contentRegion(): Region {
      const region = { rowCount: 1, columnCount: 1 }
      if (this.type == 'horizontal') {
          if (this.repeatNumber > 0) {
              region.rowCount = Math.ceil(this.values.length / this.repeatNumber)
              region.columnCount = Math.min(this.values.length, this.repeatNumber)
          } else if (this.values.length > 0) {
              region.columnCount = this.values.length
          }
      } else if (this.type == 'vertical') {
          if (this.repeatNumber > 0) {
              region.columnCount = Math.ceil(this.values.length / this.repeatNumber)
              region.rowCount = Math.min(this.values.length, this.repeatNumber)
          } else if (this.values.length > 0) {
              region.rowCount = this.values.length
          }
      }
      return region
    },
    // 可见区域能显示多少行，多少列
    showRegion(): Region {
      return {
        rowCount: Math.min(Math.floor((this.height + this.rowSpace) / this.itemHeightWithSpace) + 1, this.contentRegion.rowCount),
        columnCount: Math.min(Math.floor((this.width + this.columnSpace) / this.itemWidthWithSpace) + 1, this.contentRegion.columnCount),
      }
    },
    endPosition(): Position {
      const position = { row: 0, column: 0 }
      // 3倍是需要预留缓冲区域
      position.row = Math.min(this.startPosition.row + this.showRegion.rowCount * 3, this.contentRegion.rowCount - 1)
      position.column = Math.min(this.startPosition.column + this.showRegion.columnCount * 3, this.contentRegion.columnCount - 1)
      if (this.type == 'horizontal') {
          const index = position.row * this.contentRegion.columnCount + position.column
          if (index >= this.values.length) {
              position.row = this.contentRegion.rowCount - 1
              position.column = this.contentRegion.columnCount - 1
          }
          if (this.repeatNumber <= 0) {
              position.row = 0
          }
      } else if (this.type == 'vertical') {
          const index = position.column * this.contentRegion.rowCount + position.row
          if (index >= this.values.length) {
              position.column = this.contentRegion.columnCount - 1
              position.row = this.contentRegion.rowCount - 1
          }
          if (this.repeatNumber <= 0) {
              position.column = 0
          }
      }
      return position
    },
    showList(): { index: number, value: any }[] {
      const result: { index: number, value: any }[] = []
      if (this.type == 'horizontal') {
          for (let row = this.startPosition.row; row <= this.endPosition.row; row++) {
              const startIndex = row * this.contentRegion.columnCount + this.startPosition.column
              const endIndex = row * this.contentRegion.columnCount + this.endPosition.column
              for (let i = startIndex; i <= endIndex && i < this.values.length; i++) {
                  result.push({ index: i, value: this.values[i]})
              }
          }
      } else if (this.type == 'vertical') {
          for (let column = this.startPosition.column; column <= this.endPosition.column; column++) {
              const startIndex = column * this.contentRegion.rowCount + this.startPosition.row
              const endIndex = column * this.contentRegion.rowCount + this.endPosition.row
              for (let i = startIndex; i <= endIndex && i < this.values.length; i++) {
                  result.push({ index: i, value: this.values[i]})
              }
          }
      }
      return result
    },
    contentStyle(): {[key: string]: any} {
      let left = this.itemWidthWithSpace * (this.startPosition.column - this.offsetRegion.columnCount)
      let top = this.itemHeightWithSpace * (this.startPosition.row - this.offsetRegion.rowCount)
      let right = this.itemWidthWithSpace * (this.contentRegion.columnCount - 1 - (this.endPosition.column - this.offsetRegion.columnCount))
      let bottom = this.itemHeightWithSpace * (this.contentRegion.rowCount - 1 - (this.endPosition.row - this.offsetRegion.rowCount))
      if (left + right > this.CSSMaxWidth) {
          if (left > this.CSSMaxWidth) {
              left = this.CSSMaxWidth
          }
          right = this.CSSMaxWidth - left
      }
      if (top + bottom > this.CSSMaxHeight) {
          if (top > this.CSSMaxHeight) {
              top = this.CSSMaxHeight
          }
          bottom = this.CSSMaxHeight - top
      }
      const width = this.itemWidthWithSpace * (this.endPosition.column - this.startPosition.column + 1)
      const height = this.itemHeightWithSpace * (this.endPosition.row - this.startPosition.row + 1)
      return {
          padding: `${top}px ${right}px ${bottom}px ${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          flexDirection: this.type == 'horizontal' ? 'row' : 'column',
          marginLeft: this.contentMarginLeftPx,
          marginTop: this.contentMarginTopPx
      } 
    },
    itemStyle(): {[key: string]: any} {
      return {
        width: this.itemWidthPx,
        height: this.itemHeightPx,
        marginLeft: this.columnSpacePx,
        marginTop: this.rowSpacePx,
        position: 'relative'
      }
    }
  },
  mounted() {
      this.width = this.$el.clientWidth
      this.height = this.$el.clientHeight
  },
  methods: {
    handleScroll(e: UIEvent) {
      const target: HTMLElement = e.target as HTMLElement
      // 可见区域第一个元素的index
      const row = Math.floor((target.scrollTop + this.rowSpace) / this.itemHeightWithSpace) + this.offsetRegion.rowCount
      const column = Math.floor((target.scrollLeft + this.columnSpace) / this.itemWidthWithSpace) + this.offsetRegion.columnCount
      this.startPosition.row = row < this.showRegion.rowCount ? 0 : row - this.showRegion.rowCount
      this.startPosition.column = column < this.showRegion.columnCount ? 0 : column - this.showRegion.columnCount
      if (this.repeatNumber <= 0) {
          if (this.type == 'horizontal') {
              this.startPosition.row = 0
          } else if (this.type == 'vertical') {
              this.startPosition.column = 0
          }
      }
      //TODO: 分页加载时，由于滚动过快，target.scrollTop并不会立即生效，导致数据加载会出现偏移
      // 到达最低部或者最右部，分页加载数据
      if (target.scrollTop + target.offsetHeight >= target.scrollHeight && this.endPosition.row < this.contentRegion.rowCount - 1) {
          const offset = this.contentRegion.rowCount - 1 - this.endPosition.row > this.offsetRow ? this.offsetRow : this.contentRegion.rowCount - 1 - this.endPosition.row
          this.offsetRegion.rowCount += offset
          target.scrollTop -= this.itemHeightWithSpace * offset
      } else if (this.offsetRegion.rowCount > 0 && this.startPosition.row < this.offsetRegion.rowCount) {
          const offset = this.offsetRegion.rowCount > this.offsetRow ? this.offsetRow : this.offsetRegion.rowCount
          this.offsetRegion.rowCount -= offset
          target.scrollTop += this.itemHeightWithSpace * offset
      } else if (target.scrollLeft + target.offsetWidth >= target.scrollWidth && this.endPosition.column < this.contentRegion.columnCount - 1) {
          const offset = this.contentRegion.columnCount - 1 - this.endPosition.column > this.offseColumn ? this.offseColumn : this.contentRegion.columnCount - 1 - this.endPosition.column
          this.offsetRegion.columnCount += offset
          target.scrollLeft -= this.itemWidthWithSpace * offset
      } else if (this.offsetRegion.columnCount > 0 && this.startPosition.column < this.offsetRegion.columnCount) {
          const offset = this.offsetRegion.columnCount > this.offseColumn ? this.offseColumn : this.offsetRegion.columnCount
          this.offsetRegion.columnCount -= offset
          target.scrollLeft += this.itemWidthWithSpace * offset
      }
    },
    scrollTo(row: number, column: number) {
      if (!this.$el) {
        return
      }
      if (row < 0) {
          row = 0
      } else if (row > this.contentRegion.rowCount - this.showRegion.rowCount) {
          row = this.contentRegion.rowCount - this.showRegion.rowCount
      }
      if (column < 0) {
          column = 0
      } else if (column > this.contentRegion.columnCount - this.showRegion.columnCount) {
          column = this.contentRegion.columnCount - this.showRegion.columnCount
      }
      if (column > this.CSSMaxWidth / this.itemWidthWithSpace - this.offseColumn) {
          this.offsetRegion.columnCount = column - (this.CSSMaxWidth / this.itemWidthWithSpace - this.offseColumn)
      } else if (column < this.offsetRegion.columnCount) {
          this.offsetRegion.columnCount = column
      }
      if (row > this.CSSMaxHeight / this.itemHeightWithSpace - this.offsetRow) {
          this.offsetRegion.rowCount = row - (this.CSSMaxHeight / this.itemHeightWithSpace - this.offsetRow)
      } else if (row < this.offsetRegion.rowCount) {
          this.offsetRegion.rowCount = row
      }

      const left = (column - this.offsetRegion.columnCount) * this.itemWidthWithSpace
      const top = (row - this.offsetRegion.rowCount) * this.itemHeightWithSpace

      this.$el.scrollTo(left, top)
    }
  }
})

</script>

<style scoped>
.wrapper {
    overflow: auto;
}

.wrapper .content {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
}
</style>
