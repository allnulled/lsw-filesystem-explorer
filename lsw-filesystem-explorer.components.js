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
    <div class="buttons_panel centered" :class="'flex_' + orientation">
        <div class="flex_1 pad_right_1" v-for="button, buttonIndex in buttons" v-bind:key="'button_index_' + buttonIndex">
            <button class="nowrap" :class="button.classes || ''" v-on:click="button.click">{{ button.text }}</button>
        </div>
        <div class="flex_100"></div>
    </div>
</div>`,
  props: {
    explorer: {
      type: Object,
      required: true
    },
    orientation: {
      type: String,
      default: () => "row" // could be "column" too
    }
  },
  data() {
    return {
      buttons: []
    };
  },
  watch: {

  },
  methods: {
    setButtons(...buttons) {
      this.$trace("lsw-filesystem-buttons-panel.methods.prependButtons");
      this.buttons = buttons;
    },
    prependButtons(...buttons) {
      this.$trace("lsw-filesystem-buttons-panel.methods.prependButtons");
      this.buttons = buttons.concat(this.buttons);
    },
    appendButtons(...buttons) {
      this.$trace("lsw-filesystem-buttons-panel.methods.appendButtons");
      this.buttons = this.buttons.concat(buttons);
    },
  },
  mounted() {

  }
});
Vue.component("LswFilesystemEditor", {
  name: "LswFilesystemEditor",
  template: `<div class="lsw_filesystem_editor" style="padding-bottom:1px;">
    <div style="min-height:1px;"></div>
    <textarea class="editor" v-model="contents" spellcheck="false" />
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
Vue.component("LswFilesystemExplorer", {
  name: "LswFilesystemExplorer",
  template: `<div class="lsw_filesystem_explorer">
    <div class="current_node_box">
        <span class="previous_node_path" :class="current_node !== '/' ? '' : 'visibility_hidden'">
            <button class="mini previous_node_button" v-on:click="goUp"
            style="transform: rotate(180deg); margin: 1px;">➜</button>
        </span>
        <span class="current_node_path">{{ current_node_basedir }}</span>
        <span class="current_node_filename">{{ current_node_basename }}</span>
    </div>
    <div class="filesystem_ui">
        <div class="leftside">
            <lsw-filesystem-buttons-panel :explorer="this" ref="panelLeft" />
        </div>
        <div class="middleside">
            <div class="headerside">
                <lsw-filesystem-buttons-panel :explorer="this" ref="panelTop" />
            </div>
            <div class="bodyside" v-if="is_ready">
                <lsw-filesystem-treeviewer v-if="current_node_is_directory" :explorer="this" ref="treeviewer" />
                <lsw-filesystem-editor v-else-if="current_node_is_file" :explorer="this" ref="editor" :filecontents="current_node_contents" />
            </div>
            <div class="footerside">
                <lsw-filesystem-buttons-panel :explorer="this" ref="panelBottom" />
            </div>
        </div>
        <div class="rightside">
            <lsw-filesystem-buttons-panel :explorer="this" ref="panelRight" />
        </div>
    </div>
</div>`,
  props: {},
  data() {
    this.$trace("lsw-filesystem-explorer.data");
    return {
      is_ready: false,
      current_node: undefined,
      current_node_parts: undefined,
      current_node_basename: undefined,
      current_node_basedir: undefined,
      current_node_contents: undefined,
      current_node_subnodes: [],
      current_node_is_file: false,
      current_node_is_directory: false,
      STANDARIZED_REFRESH_DELAY: 100
    };
  },
  methods: {
    open(...args) {
      this.$trace("lsw-filesystem-explorer.methods.open");
      return this.open_node(...args);
    },
    goUp() {
      this.$trace("lsw-filesystem-explorer.methods.goUp");
      const parts = this.current_node.split("/");
      parts.pop();
      const dest = this.normalize_path("/" + parts.join("/"));
      return this.open(dest);
    },
    async refresh() {
      this.$trace("lsw-filesystem-explorer.methods.refresh");
      this.is_ready = false;
      try {
        await this.open(this.current_node);
      } catch (error) {
        throw error;
      } finally {
        this.$nextTick(() => {
          this.is_ready = true;
          this.$forceUpdate(true);
        });
      }
    },
    normalize_path(subpath) {
      this.$trace("lsw-filesystem-explorer.methods.normalize_path");
      return this.$lsw.fs.resolve_path(this.current_node, subpath);
    },
    async open_node(subpath = this.current_node) {
      this.$trace("lsw-filesystem-explorer.methods.open_node");
      try {
        if (["", "/"].indexOf(subpath) !== -1) {
          return await this._openDirectory("/");
        }
        const temporaryPath = this.normalize_path(subpath);
        const is_directory = await this.$lsw.fs.is_directory(temporaryPath);
        if (is_directory) {
          return await this._openDirectory(temporaryPath);
        }
        const is_file = await this.$lsw.fs.is_file(temporaryPath);
        if (is_file) {
          return await this._openFile(temporaryPath);
        }
        throw new Error(`Cannot open path because it does not exist: ${temporaryPath} on «LswFilesystemExplorer.methods.open_node»`);
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    async processToCreateFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToCreateFile");
      const filename = await this.$lsw.dialogs.open({
        title: "Crear fichero",
        template: `<div>
          <div class="pad_1">
            <div>Estás en la carpeta:</div>
            <div class="pad_2">{{ current_directory }}</div>
            <div>Di el nombre del nuevo fichero:</div>
            <div class="pad_top_1">
              <input class="width_100" type="text" placeholder="myfile.txt" v-model="filename" v-focus v-on:keyup.enter="() => accept(filename)" />
            </div>
          </div>
          <hr />
          <div class="flex_row centered pad_1">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="nowrap danger_button" v-on:click="() => accept(filename)">Crear fichero</button>
            </div>
            <div class="flex_1">
              <button class="nowrap " v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data() {
            return {
              current_directory: this.$lsw.fs.get_current_directory(),
              filename: "",
            };
          },
        },
      });
      if(!filename) return;
      const filepath = this.$lsw.fs.resolve_path(this.$lsw.fs.get_current_directory(), filename);
      await this.$lsw.fs.write_file(filepath, "");
      this.refresh();
    },
    async processToCreateDirectory() {
      this.$trace("lsw-filesystem-explorer.methods.processToCreateDirectory");
      const filename = await this.$lsw.dialogs.open({
        title: "Crear directorio",
        template: `<div>
          <div class="pad_1">
            <div>Estás en la carpeta:</div>
            <div class="pad_2">{{ current_directory }}</div>
            <div>Di el nombre del nuevo directorio:</div>
            <div class="pad_top_1">
              <input class="width_100" type="text" placeholder="myfolder" v-model="filename" v-focus v-on:keyup.enter="() => accept(filename)" />
            </div>
          </div>
          <hr />
          <div class="flex_row centered pad_1">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="nowrap danger_button" v-on:click="() => accept(filename)">Sí, seguro</button>
            </div>
            <div class="flex_1">
              <button class="nowrap " v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data() {
            return {
              current_directory: this.$lsw.fs.get_current_directory(),
              filename: "",
            };
          },
        },
      });
      if(!filename) return;
      const filepath = this.$lsw.fs.resolve_path(this.$lsw.fs.get_current_directory(), filename);
      await this.$lsw.fs.make_directory(filepath);
      this.refresh();
    },
    async processToDeleteDirectory() {
      this.$trace("lsw-filesystem-explorer.methods.processToDeleteDirectory");
      const confirmation = await this.$lsw.dialogs.open({
        title: "Eliminar directorio",
        template: `<div>
          <div class="pad_1">
            <div>¿Seguro que quieres eliminar el directorio?</div>
            <div class="pad_2">{{ current_directory }}</div>
          </div>
          <hr />
          <div class="flex_row centered pad_1">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="nowrap danger_button" v-on:click="() => accept(true)">Sí, seguro</button>
            </div>
            <div class="flex_1">
              <button class="nowrap " v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data: {
            current_directory: this.$lsw.fs.get_current_directory(),
          }
        }
      });
      if(!confirmation) return;
      await this.$lsw.fs.delete_directory(this.$lsw.fs.get_current_directory());
      this.refresh();
    },
    async processToDeleteFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToDeleteFile");
      const confirmation = await this.$lsw.dialogs.open({
        title: "Eliminar fichero",
        template: `<div>
          <div class="pad_1">
            <div>¿Seguro que quieres eliminar el fichero?</div>
            <div class="pad_2">{{ current_file }}</div>
          </div>
          <hr />
          <div class="flex_row centered pad_1">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="nowrap danger_button" v-on:click="() => accept(true)">Sí, seguro</button>
            </div>
            <div class="flex_1">
              <button class="nowrap " v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data: {
            current_file: this.current_node,
          }
        }
      });
      if(!confirmation) return;
      await this.$lsw.fs.delete_file(this.current_node);
      const upperDir = (() => {
        const parts = this.current_node.split("/");
        parts.pop();
        return parts.join("/");
      })();
      this.refresh();
    },
    async processToRenameFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToRenameFile");
      const elementType = this.current_node_is_file ? "fichero" : "directorio";
      const newName = await this.$lsw.dialogs.open({
        title: "Renombrar " + elementType,
        template: `<div>
          <div class="pad_1">
            <div>Refiriéndose al {{ elementType }}:</div>
            <div class="pad_2">{{ filename }}</div>
          </div>
          <div class="pad_1">
            <div>Di el nuevo nombre del {{ elementType }}:</div>
            <div class="pad_top_1">
              <input v-focus class="width_100" type="text" placeholder="Nuevo nombre aquí" v-model="new_filename" v-on:keyup.enter="() => accept(new_filename)" />
            </div>
          </div>
          <hr />
          <div class="flex_row centered">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="nowrap danger_button" v-on:click="() => accept(new_filename)">Sí, seguro</button>
            </div>
            <div class="flex_1">
              <button class="nowrap " v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data: {
            elementType,
            filename: this.current_node,
            new_filename: this.current_node.split("/").pop(),
          }
        }
      });
      if(newName === false) return;
      if(newName.trim() === "") return;
      const allParts = this.current_node.split("/");
      allParts.pop();
      const dirPath = "/" + allParts.join("/");
      const newFullpath = this.$lsw.fs.resolve_path(dirPath, newName);
      await this.$lsw.fs.rename(this.current_node, newName.replace(/^\/+/g, ""));
      await this.open(newFullpath);
    },
    async processToExecuteFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToExecuteFile");
      const editorContents = this.$refs.editor.getContents();
      const AsyncFunction = (async function() {}).constructor;
      const asyncFunction = new AsyncFunction(editorContents);
      try {
        await asyncFunction.call(this);
      } catch (error) {
        this.$lsw.toasts.send({
          title: "Error arised when executing file",
          text: `File ${this.current_node} produced following error: ${error.name}: ${error.message}`
        });
      }
    },
    async processToLoadFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToLoadFile");
      this.is_ready = false;
      const contents = await this.$lsw.fs.read_file(this.current_node);
      this.current_node_contents = contents;
      this.$nextTick(() => {
        this.is_ready = true;
      });
    },
    async processToSaveFile() {
      this.$trace("lsw-filesystem-explorer.methods.processToSaveFile");
      if(this.$refs.editor) {
        const editorContents = this.$refs.editor.getContents();
        console.log(this.current_node, editorContents);
        await this.$lsw.fs.write_file(this.current_node, editorContents);
      }
    },
    _setButtonsForFile() {
      this.$trace("lsw-filesystem-explorer.methods._setButtonsForFile");
      this.is_ready = false;
      this.current_node_is_file = true;
      this.current_node_is_directory = false;
      const allButtonsOnFile = [
        {
          text: "➜",
          classes: "reversed",
          click: () => this.goUp(),
        }, {
          text: "💾",
          click: () => this.processToSaveFile(),
        }, {
          text: "↔️",
          click: () => this.processToRenameFile(),
        }, {
          text: "🔄",
          click: () => this.processToLoadFile(),
        }, {
          text: "📄 ❌",
          classes: "danger_button",
          click: () => this.processToDeleteFile(),
        }
      ];
      if(this.current_node.endsWith(".js")) {
        allButtonsOnFile.push({
          text: "⚡️",
          classes: "danger_button",
          click: () => this.processToExecuteFile(),
        });
      }
      this.$refs.panelTop.setButtons(...allButtonsOnFile);
      this.$nextTick(() => {
        this.is_ready = true;
      });
    },
    _setButtonsForDirectory() {
      this.$trace("lsw-filesystem-explorer.methods._setButtonsForDirectory");
      this.is_ready = false;
      this.current_node_is_directory = true;
      this.current_node_is_file = false;
      this.$refs.panelTop.setButtons({
        text: "📄+",
        click: () => this.processToCreateFile(),
      }, {
        text: "📁+",
        click: () => this.processToCreateDirectory(),
      }, {
        text: "📁 ❌",
        classes: "danger_button",
        click: () => this.processToDeleteDirectory()
      });
      this.$nextTick(() => {
        this.is_ready = true;
      });
    },
    async _openFile(subpath) {
      this.$trace("lsw-filesystem-explorer.methods._openFile");
      this.current_node = subpath;
      const contents = await this.$lsw.fs.read_file(this.current_node);
      this.current_node_contents = contents;
      this._setButtonsForFile();
    },
    async _openDirectory(subpath) {
      this.$trace("lsw-filesystem-explorer.methods._openDirectory");
      this.current_node = subpath;
      const subnodes = await this.$lsw.fs.read_directory(this.current_node);
      const sortedSubnodes = {
        files: [],
        folders: []
      };
      Object.keys(subnodes).forEach(id => {
        const subnode = subnodes[id];
        const subnodeType = typeof subnode === "string" ? "files" : "folders";
        sortedSubnodes[subnodeType].push(id);
      });
      const formattedSubnodes = {};
      sortedSubnodes.folders.sort().forEach(folder => {
        formattedSubnodes[folder] = {};
      });
      sortedSubnodes.files.sort().forEach(file => {
        formattedSubnodes[file] = "...";
      });
      console.log(subnodes, formattedSubnodes);
      this.$lsw.fs.change_directory(subpath);
      this.current_node_subnodes = formattedSubnodes;
      this._setButtonsForDirectory();
    },
    __update_node_parts(newValue = this.current_node) {
      this.$trace("lsw-filesystem-explorer.methods.__update_node_parts");
      this.current_node_parts = newValue.split("/").filter(p => p !== "");
    },
    __update_current_node_basename(current_node_parts = this.current_node_parts) {
      this.$trace("lsw-filesystem-explorer.methods.__update_current_node_basename");
      if (current_node_parts.length) {
        this.current_node_basename = current_node_parts[current_node_parts.length - 1];
      } else {
        this.current_node_basename = "/";
      }
    },
    __update_current_node_basedir(current_node_parts = this.current_node_parts) {
      this.$trace("lsw-filesystem-explorer.methods.__update_current_node_basedir");
      if (current_node_parts.length > 1) {
        this.current_node_basedir = "/" + [].concat(current_node_parts).splice(0, current_node_parts.length - 1).join("/") + "/";
      } else {
        this.current_node_basedir = "/";
      }
    },
    _updateNodeSubdata(newValue = this.current_node) {
      this.$trace("lsw-filesystem-explorer.methods._updateNodeSubdata");
      this.__update_node_parts(newValue);
      this.__update_current_node_basename();
      this.__update_current_node_basedir();
    },
    setPanelButtons(panelOptions = {}) {
      this.$trace("lsw-filesystem-explorer.methods.setPanelButtons");
      Validation: {
        if (typeof panelOptions !== "object") {
          throw new Error("Required argument «panelOptions» to be an object on «LswFilesystemExplorer.methods.setPanelButtons»");
        }
        const keys = Object.keys(panelOptions);
        if (keys.length === 0) {
          throw new Error("Required argument «panelOptions» to be have 1 or more keys on «LswFilesystemExplorer.methods.setPanelButtons»");
        }
        const valid_keys = ["top", "bottom", "left", "right"];
        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          if(valid_keys.indexOf(key) === -1) {
            throw new Error(`Required argument «panelOptions[${key}]» to be a valid key out of «${valid_keys.join(",")}», not «${key}» on «LswFilesystemExplorer.methods.setPanelButtons»`);
          }
          const value = panelOptions[key];
          if(typeof value !== "object") {
            throw new Error(`Required argument «panelOptions[${key}]» to be an object or array, not ${typeof value}» on «LswFilesystemExplorer.methods.setPanelButtons»`);
          }
        }
      }
    }
  },
  watch: {
    current_node(newValue) {
      this.$trace("lsw-filesystem-explorer.watch.current_node");
      this._updateNodeSubdata(newValue);
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
                class="treeviewer_row"
                v-on:click="() => goUp()">
                <td class="icon_cell">📁</td>
                <td>
                    <a class="filename_link" href="javascript:void(0)">..</a>
                </td>
                <td></td>
                <td>
                    <button style="visibility: hidden;" class="mini" v-on:click="() => deleteNode(subnodeIndex)">❌</button>
                </td>
            </tr>
            <template v-for="subnode, subnodeIndex, subnodeCounter in explorer.current_node_subnodes">
                <tr class="treeviewer_row"
                    v-bind:key="'subnode_obj_' + subnodeIndex">
                    <template v-if="typeof subnode === 'object'">
                        <td v-on:click="() => openSubnode(subnodeIndex)" class="icon_cell">📁</td>
                        <td v-on:click="() => openSubnode(subnodeIndex)">
                            <a class="filename_link" href="javascript:void(0)"><b>{{ subnodeIndex }}</b></a>
                        </td>
                        <td style="padding: 2px;">
                            <button class="mini nowrap" v-on:click="() => renameNode(subnodeIndex)">↔️</button>
                        </td>
                        <td style="padding: 2px;">
                            <button class="mini danger_button nowrap" v-on:click="() => deleteNode(subnodeIndex)">📁 ❌</button>
                        </td>
                    </template>
                    <template v-else-if="typeof subnode === 'string'">
                        <td v-on:click="() => openSubnode(subnodeIndex)" class="icon_cell">📄</td>
                        <td v-on:click="() => openSubnode(subnodeIndex)">
                            <a class="filename_link" href="javascript:void(0)">{{ subnodeIndex }}</a>
                        </td>
                        <td style="padding: 2px;">
                            <button class="mini nowrap" v-on:click="() => renameNode(subnodeIndex)">↔️</button>
                        </td>
                        <td style="padding: 2px;">
                            <button class="mini danger_button nowrap" v-on:click="() => deleteNode(subnodeIndex)">📄 ❌</button>
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
    this.$trace("lsw-filesystem-treeviewer.data");
    return {};
  },
  watch: {},
  methods: {
    goUp() {
      this.$trace("lsw-filesystem-treeviewer.methods.goUp");
      return this.explorer.goUp();
    },
    openSubnode(subnodeIndex) {
      this.$trace("lsw-filesystem-treeviewer.methods.openSubnode");
      return this.explorer.open(subnodeIndex);
    },
    async deleteNode(subnodeIndex) {
      this.$trace("lsw-filesystem-treeviewer.methods.deleteNode");
      const fullpath = this.$lsw.fs.resolve_path(subnodeIndex);
      const isDirectory = await this.$lsw.fs.is_directory(fullpath);
      const elementType = isDirectory ? 'directorio' : 'fichero';
      const confirmation = await this.$lsw.dialogs.open({
        title: `Proceder a eliminar ${elementType}`,
        template: `
          <div class="pad_1">
            <div>Seguro que quieres eliminar el {{ elementType }} «{{ fullpath }}»?</div>
            <hr />
            <div class="flex_row centered">
              <div class="flex_100"></div>
              <div class="flex_1 pad_right_1">
                <button class="danger_button nowrap" v-on:click="() => accept(true)">Sí, eliminar</button>
              </div>
              <div class="flex_1">
                <button class="" v-on:click="() => accept(false)">Salir</button>
              </div>
            </div>
          </div>
        `,
        factory: {
          data: {
            elementType,
            fullpath,
          }
        }
      });
      if(!confirmation) return;
      try {
        if(isDirectory) {
          await this.$lsw.fs.delete_directory(fullpath);
        } else {
          await this.$lsw.fs.delete_file(fullpath);
        }
        await this.explorer.refresh();
      } catch (error) {
        await this.$lsw.dialogs.open({
          title: `El fichero no se pudo eliminar`,
          template: `
            <div class="pad_1">
              <div>El fichero «{{ fullpath }}» no se pudo eliminar debido al siguiente error:</div>
              <hr />
              <div v-if="error">{{ error.name }}: {{ error.message }}</div>
            </div>
          `,
          factory: {
            data: {
              error,
              fullpath,
            }
          }
        });
      }
    },
    async renameNode(subnodeIndex) {
      this.$trace("lsw-filesystem-treeviewer.methods.renameNode");
      const fullpath = this.$lsw.fs.resolve_path(subnodeIndex);
      const isDirectory = await this.$lsw.fs.is_directory(fullpath);
      const elementType = isDirectory ? 'directorio' : 'fichero';
      const newName = await this.$lsw.dialogs.open({
        title: "Renombrar " + elementType,
        template: `<div>
          <div class="pad_1">
            <div>Refiriéndose al {{ elementType }}:</div>
            <div class="pad_2">{{ filename }}</div>
            <div>Di el nuevo nombre del {{ elementType }}:</div>
            <input v-focus class="width_100" type="text" v-model="newFilename" v-on:keyup.enter="() => accept(newFilename)" />
          </div>
          <hr />
          <div class="flex_row centered pad_1">
            <div class="flex_100"></div>
            <div class="flex_1 pad_right_1">
              <button class="" v-on:click="() => accept(newFilename)">Renombrar</button>
            </div>
            <div class="flex_1">
              <button class="" v-on:click="() => accept(false)">Cancelar</button>
            </div>
          </div>
        </div>`,
        factory: {
          data: {
            elementType,
            fullpath,
            filename: subnodeIndex,
            newFilename: subnodeIndex,
          }
        }
      });
      if(typeof newName !== "string") return;
      if(newName.trim() === "") return;
      await this.$lsw.fs.rename(subnodeIndex, newName.replace(/^\/+/g, ""));
      this.explorer.refresh();
    }
  },
  mounted() {
    this.$trace("lsw-filesystem-treeviewer.mounted");
    this.explorer.setPanelButtons({
      top: [],
      left: [],
      right: [],
      bottom: [],
    })
  },
  unmounted() {
    this.$trace("lsw-filesystem-treeviewer.unmounted");
  }
});
});
