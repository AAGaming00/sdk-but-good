const { React, getModule } = require('powercord/webpack');
const { join } = require('path');
const fs = require('fs');
class Popout extends React.PureComponent {
  constructor (props) {
    super(props);
    this.scriptRef = React.createRef();
  }

  componentDidMount () {
    console.log(this.scriptRef.current.ownerDocument.defaultView);
    this.props.resolve(this.scriptRef.current.ownerDocument.defaultView);
    const win = this.scriptRef.current.ownerDocument.defaultView;
    delete win.opener;
    delete win.DiscordNative;
    delete win.require;
    const ready1 = false;
    let ready2 = false;
    const interval = setInterval(() => {
      if (ready2) {
        clearInterval(interval);
        this.scriptRef.current.ownerDocument.href = this.props.url;
      }
      if (win.powercord?.pluginManager && !ready2) {
        win.powercord.pluginManager.load = void 0;
        win.powercord.pluginManager.mount = void 0;
        ready2 = true;
      }
      if (!win.require?.bruh && !ready1) {
        const realdirname = __dirname;
        win.require = function (mdl, dir) {
          const dirname = dir || join(realdirname, '../../../../');
          console.log(dir);
          if (mdl === 'electron') {
            const e = require(mdl);
            e.remote = { getGlobal: (h) => h };
            return e;
          }
          console.log(mdl);
          if ((mdl.startsWith('/') || mdl.startsWith('.') || mdl.startsWith('powercord/')) && !mdl.endsWith('json')) {
            const wrapper = (str, dir, file) =>
              `(function (module, __dirname, __filename) {\n${str}\nreturn module.exports\n})({}, "${dir}", "${file}");`
                .replace(/require\((['"].*['"])\)/g, 'require($1, __dirname)');
            const mdlpath = mdl.startsWith('/') || mdl.startsWith('.') ? require.resolve(join(dirname, mdl)) : require.resolve(mdl);
            const mdldirarr = mdlpath.split('/');
            mdldirarr.pop();
            const mdldir = mdldirarr.join('/');
            console.log(mdlpath, mdldir);
            const code = wrapper(fs.readFileSync(mdlpath), mdldir, mdlpath);
            const bruh = win.eval(code);
            console.log(bruh, code);
            return bruh;
          }
          return require(mdl);
        };
        win.require.bruh = true;
      }
    }, 10);
    setTimeout(() => {
      const splashContainer = win.document.createElement('div');
      win.document.body.appendChild(splashContainer);
      splashContainer.outerHTML = this.props.html;
      win.document.getElementById('app-mount').remove();
      win.__dirname = join(__dirname, '../../../../');
      win.global = win;
      const preloadScr = win.document.createElement('script');
      preloadScr.textContent = this.props.preload;
      win.document.head.appendChild(preloadScr);
      win.PowercordNative.openDevTools({ mode: 'detach' });
      const scr = win.document.createElement('script');
      scr.textContent = this.props.js;
      win.document.head.appendChild(scr);
    }, 1000);
  }

  render () {
    return React.createElement('div', { ref: this.scriptRef });
  }
}


module.exports = function (props, name, id) {
  return new Promise((resolve) => {
    const popoutModule = getModule([ 'setAlwaysOnTop', 'open' ], false);
    const PopoutWindow = getModule(m => m.DecoratedComponent && m.DecoratedComponent.render, false);
    popoutModule.open(id, (key) =>
      React.createElement(PopoutWindow, {
        windowKey: key,
        title: name
      }, React.createElement(Popout, { ...props,
        resolve })),
    { frame: false,
      chrome:false,
      status:false,
      menubar:false,
      toolbar:false,
      location:false,
      resizable: false,
      height: props.height,
      width: props.width }
    );
  });
};
