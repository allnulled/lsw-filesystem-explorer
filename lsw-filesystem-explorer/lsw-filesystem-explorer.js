Vue.component("LswFilesystemExplorer", {
  name: "LswFilesystemExplorer",
  template: $template,
  props: {},
  data() {
    this.$trace("lsw-filesystem-explorer.data");
    return {
      current_node: undefined,
      current_node_parts: undefined,
      current_node_basename: undefined,
      current_node_basedir: undefined,
      current_node_contents: undefined,
      current_node_subnodes: [],
      current_node_is_file: false,
      current_node_is_directory: false,
    };
  },
  methods: {
    open(...args) {
      this.$trace("lsw-filesystem-explorer.methods.open");
      return this.open_node(...args);
    },
    go_up() {
      const parts = this.current_node.split("/");
      parts.pop();
      const dest = this.normalize_path("/" + parts.join("/"));
      return this.open(dest);
    },
    normalize_path(subpath) {
      this.$trace("lsw-filesystem-explorer.methods.normalize_path");
      return this.$lsw.fs.resolve_path(this.current_node, subpath);
    },
    async open_node(subpath) {
      this.$trace("lsw-filesystem-explorer.methods.open_node");
      try {
        if (["", "/"].indexOf(subpath) !== -1) {
          return await this._open_directory("/");
        }
        const temporaryPath = this.normalize_path(subpath);
        const is_directory = await this.$lsw.fs.is_directory(temporaryPath);
        if (is_directory) {
          return await this._open_directory(temporaryPath);
        }
        const is_file = await this.$lsw.fs.is_file(temporaryPath);
        if (is_file) {
          return await this._open_file(temporaryPath);
        }
        throw new Error(`Cannot open path because it does not exist: ${temporaryPath} on «LswFilesystemExplorer.methods.open_node»`);
      } catch (error) {
        console.log(error);
      }
    },
    _set_as_file() {
      this.current_node_is_file = true;
      this.current_node_is_directory = false;
    },
    _set_as_directory() {
      this.current_node_is_directory = true;
      this.current_node_is_file = false;
    },
    async _open_file(subpath) {
      this.$trace("lsw-filesystem-explorer.methods._open_file");
      this.current_node = subpath;
      const contents = await this.$lsw.fs.read_file(this.current_node);
      this.current_node_contents = contents;
      this._set_as_file();
    },
    async _open_directory(subpath) {
      this.$trace("lsw-filesystem-explorer.methods._open_directory");
      this.current_node = subpath;
      const subnodes = await this.$lsw.fs.read_directory(this.current_node);
      this.current_node_subnodes = subnodes;
      this._set_as_directory();
    },
    _update_node_parts(newValue = this.current_node) {
      this.$trace("lsw-filesystem-explorer.methods._update_node_parts");
      this.current_node_parts = newValue.split("/").filter(p => p !== "");
    },
    _update_current_node_basename(current_node_parts = this.current_node_parts) {
      this.$trace("lsw-filesystem-explorer.methods._update_current_node_basename");
      if (current_node_parts.length) {
        this.current_node_basename = current_node_parts[current_node_parts.length - 1];
      } else {
        this.current_node_basename = "/";
      }
    },
    _update_current_node_basedir(current_node_parts = this.current_node_parts) {
      this.$trace("lsw-filesystem-explorer.methods._update_current_node_basedir");
      if (current_node_parts.length > 1) {
        this.current_node_basedir = "/" + [].concat(current_node_parts).splice(0, current_node_parts.length - 1).join("/") + "/";
      } else {
        this.current_node_basedir = "/";
      }
    },
    _update_node_subdata(newValue = this.current_node) {
      this.$trace("lsw-filesystem-explorer.methods._update_node_subdata");
      this._update_node_parts(newValue);
      this._update_current_node_basename();
      this._update_current_node_basedir();
    },
    set_panel_buttons(panelOptions = {}) {
      Validation: {
        if (typeof panelOptions !== "object") {
          throw new Error("Required argument «panelOptions» to be an object on «LswFilesystemExplorer.methods.set_panel_buttons»");
        }
        const keys = Object.keys(panelOptions);
        if (keys.length === 0) {
          throw new Error("Required argument «panelOptions» to be have 1 or more keys on «LswFilesystemExplorer.methods.set_panel_buttons»");
        }
        const valid_keys = ["top", "bottom", "left", "right"];
        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          if(valid_keys.indexOf(key) === -1) {
            throw new Error(`Required argument «panelOptions[${key}]» to be a valid key out of «${valid_keys.join(",")}», not «${key}» on «LswFilesystemExplorer.methods.set_panel_buttons»`);
          }
          const value = panelOptions[key];
          if(typeof value !== "object") {
            throw new Error(`Required argument «panelOptions[${key}]» to be an object or array, not ${typeof value}» on «LswFilesystemExplorer.methods.set_panel_buttons»`);
          }
        }
      }
    }
  },
  watch: {
    current_node(newValue) {
      this.$trace("lsw-filesystem-explorer.watch.current_node");
      this._update_node_subdata(newValue);
    }
  },
  async mounted() {
    try {
      this.$trace("lsw-filesystem-explorer.mounted");
      this.$lsw.fs = new LswFilesystem();
      this.$lsw.fsExplorer = this;
      await this.$lsw.fs.init();
      await this.open("/");
    } catch (error) {
      console.log(error);
    }
  }
});