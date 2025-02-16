(function(factory) {
  const mod = factory();
  if(typeof window !== 'undefined') {
    window["Lsw_filesystem_explorer_components"] = mod;
  }
  if(typeof global !== 'undefined') {
    global["Lsw_filesystem_explorer_components"] = mod;
  }
  if(typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function() {
Vue.component("LswFilesystemButtonsPanel", {
  name: "LswFilesystemButtonsPanel",
  template: `<div class="lsw_filesystem_buttons_panel">
    
</div>`,
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

  },
  mounted() {

  }
});
Vue.component("LswFilesystemEditor", {
  name: "LswFilesystemEditor",
  template: `<div class="lsw_filesystem_editor">
    <textarea class="editor" v-model="filecontents" />
</div>`,
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
      
    };
  },
  watch: {

  },
  methods: {

  },
  mounted() {

  }
});
Vue.component("LswFilesystemExplorer", {
  name: "LswFilesystemExplorer",
  template: `<div class="lsw_filesystem_explorer">
    <div class="current_node_box">
        <span class="previous_node_path" v-if="current_node !== '/'">
            <button class="mini previous_node_button" v-on:click="go_up">◀</button>
        </span>
        <span class="current_node_path">{{ current_node_basedir }}</span>
        <span class="current_node_filename">{{ current_node_basename }}</span>
    </div>
    <div class="filesystem_ui">
        <div class="leftside">
            <lsw-filesystem-buttons-panel :explorer="this" />
        </div>
        <div class="middleside">
            <div class="headerside">
                <lsw-filesystem-buttons-panel :explorer="this" />
            </div>
            <div class="bodyside">
                <lsw-filesystem-treeviewer v-if="current_node_is_directory" :explorer="this" ref="treeviewer" />
                <lsw-filesystem-editor v-else-if="current_node_is_file" :explorer="this" ref="editor" :filecontents="current_node_contents" />
            </div>
            <div class="footerside">
                <lsw-filesystem-buttons-panel :explorer="this" />
            </div>
        </div>
        <div class="rightside">
            <lsw-filesystem-buttons-panel :explorer="this" />
        </div>
    </div>
</div>`,
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
Vue.component("LswFilesystemTreeviewer", {
  name: "LswFilesystemTreeviewer",
  template: `<div class="lsw_filesystem_treeviewer">
    <table class="filesystem_treeviewer_table width_100">
        <thead style="display: none;"></thead>
        <tbody>
            <tr v-if="explorer.current_node !== '/'"
                class="treeviewer_row">
                <td>📁</td>
                <td v-on:click="() => go_up()">
                    <a href="javascript:void(0)">..</a>
                </td>
                <td></td>
            </tr>
            <template v-for="subnode, subnodeIndex, subnodeCounter in explorer.current_node_subnodes">
                <tr class="treeviewer_row"
                    v-bind:key="'subnode_obj_' + subnodeIndex">
                    <template v-if="typeof subnode === 'object'">
                        <td v-on:click="() => open_subnode(subnodeIndex)">📁</td>
                        <td v-on:click="() => open_subnode(subnodeIndex)">
                            <a href="javascript:void(0)"><b>{{ subnodeIndex }}</b></a>
                        </td>
                        <td>
                            <button class="mini">X</button>
                        </td>
                    </template>
                    <template v-else-if="typeof subnode === 'string'">
                        <td v-on:click="() => open_subnode(subnodeIndex)"> </td>
                        <td v-on:click="() => open_subnode(subnodeIndex)">
                            <a href="javascript:void(0)">{{ subnodeIndex }}</a>
                        </td>
                        <td>
                            <button class="mini">X</button>
                        </td>
                    </template>
                </tr>
            </template>
        </tbody>
    </table>

</div>`,
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
});
