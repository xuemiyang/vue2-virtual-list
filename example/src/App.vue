<template>
  <div>
    <VirtualList
      ref="list"
      class="list"
      type="horizontal"
      :item-width="200"
      :item-height="100"
      :row-space="10"
      :column-space="10"
      :repeat-number="0"
      :values="allList"
    >
      <template #default="{ item, index }">
        <div class="item">
          <h2 >{{ item.title }}</h2>
          <h3>{{ index }}</h3>
        </div>
      </template>
    </VirtualList>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { VirtualList } from "@xuemiyang/vue2-virtual-list";
import "@xuemiyang/vue2-virtual-list/dist/style.css";

export default Vue.extend({
  components: {
    VirtualList
  },
  data() {
    return {
      allList: []
    } as {
      allList: any[]
    }
  },
  created() {
      for (let i = 0; i < 10000000; i++) {
        this.allList.push({ title: `title ${i}` });
      }      
  },
})
</script>

<style scoped>
.list {
  width: 500px;
  height: 300px;
}
.list .item {
  background-color: bisque;
  width: 200px;
  height: 100px;
}
</style>
