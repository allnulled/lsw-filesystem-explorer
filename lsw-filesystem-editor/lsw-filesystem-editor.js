Vue.component("LswFilesystemEditor", {
  name: "LswFilesystemEditor",
  template: $template,
  props: {
    explorer: {
      type: Object,
      required: true
    },
    filecontents: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      contents: this.filecontents
    };
  },
  watch: {

  },
  methods: {
    getContents() {
      return this.contents;
    },
    setContents(contents) {
      this.contents = contents;
    }
  },
  mounted() {

  }
});