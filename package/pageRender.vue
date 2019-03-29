<template>
   <RecycleScroller
    v-if="itemSize"
    class="scroller"
    :items="list"
    :item-size="itemSize"
    :emitUpdate="true"
    @update="onUpdate"
  >
    <template v-slot="item">
      <canvas id="canvas-ctx">{{test(item)}}</canvas>
    </template>
  </RecycleScroller>
</template>


<script>
import { RecycleScroller } from "vue-virtual-scroller";
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { getPDF } from "./pdf.js";
import { Subject } from "rxjs";
import { throttleTime, distinctUntilChanged, filter } from "rxjs/operators";

export default {
  props: {
    url: String
  },
  components: {
    RecycleScroller
  },
  data() {
    return {
      pdf: null,
      scale: 1,
      list: [],
      itemSize: 0,
      updateSubject: new Subject()
    };
  },
  watch: {
    url(val) {
      this.fetchPDF(val);
    }
  },
  created() {
    this.fetchPDF(this.url);
  },
  mounted() {
    this.$nextTick(() => {
      this.updateSubject
        .pipe(
          filter((e) => (e.startIndex + e.endIndex)),
          throttleTime(50),
          distinctUntilChanged((a, b) => {
            return (a.startIndex + a.endIndex) === (b.startIndex + b.endIndex)  
          })
        )
        .subscribe((e) => {
          this.frensh(e)
        })
    })
  },
  methods: {
    test(e) {
      console.log(e)
    },
    onUpdate(startIndex, endIndex) {
      this.updateSubject.next({startIndex, endIndex})
    },
    frensh({startIndex, endIndex}) {
      console.log(startIndex, endIndex)
      for (let index = startIndex; index < endIndex; index++) {
        this.rendePage(index);
      }
    },
    rendePage(idx) {
      this.pdf.getPage(1 + idx).then(page => {
        let viewport = page.getViewport(this.scale);
        this.$nextTick(() => {
          //
          // Prepare canvas using PDF page dimensions
          //
          let canvas = this.$el.querySelectorAll('#canvas-ctx')[idx % 3];
          let context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          //
          // Render PDF page into canvas context
          //
          let renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      });
    },
    onProgress(e) {
      this.$emit("loading", e);
    },
    fetchPDF(url) {
      getPDF(url, this.onProgress)
        .then(pdf => {
          this.pdf = pdf;
          this.list = [...new Array(pdf.numPages).keys()];
          // 获取视口参数
          pdf.getPage(1).then((page) => {
            const viewport = page.getViewport(this.scale)
            console.log(viewport)
            const desiredWidth = document.documentElement.clientWidth
            this.scale = desiredWidth / viewport.width;
            this.itemSize = viewport.height * this.scale;
            this.$emit("finish");
          })
        })
        .catch(error => {
          this.$emit(error);
        });
    }
  }
};
</script>

<style scoped>
.scroller {
  height: 100%;
}

.item {
  height: 32%;
  padding: 0 12px;
  display: flex;
  align-items: center;
}
</style>
