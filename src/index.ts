import type { VueConstructor } from "vue";
import VirtualList from "./VirtualList.vue";

export { VirtualList };

export default {
  install(vue: VueConstructor<Vue>) {
    vue.component("VirtualList", VirtualList);
  },
};
