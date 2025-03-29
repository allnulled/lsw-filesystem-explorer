Vue.component("LswFilesystemExplorer", {
  name: "LswFilesystemExplorer",
  template: $template,
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