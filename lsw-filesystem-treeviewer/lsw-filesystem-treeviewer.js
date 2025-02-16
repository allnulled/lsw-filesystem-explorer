Vue.component("LswFilesystemTreeviewer", {
  name: "LswFilesystemTreeviewer",
  template: $template,
  props: {
    explorer: {
      type: Object,
      required: true
    }
  },
  data() {
    return {

    };
  },
  watch: {

  },
  methods: {
    go_up() {
      return this.explorer.go_up();
    },
    open_subnode(subnodeIndex) {
      return this.explorer.open(subnodeIndex);
    }
  },
  mounted() {
    this.explorer.set_panel_buttons({
      top: [],
      left: [],
      right: [],
      bottom: [],
    })
  },
  unmounted() {

  }
});