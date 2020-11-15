const { join } = require('path');
const { format: formatUrl } = require('url');
const popout = require('./Window');
const { React } = require('powercord/webpack');
const { Flex, Button } = require('powercord/components');
const fs = require('fs')
const SplashStages = Object.freeze({
  CHECKING_FOR_UPDATES: 'CHECKING_FOR_UPDATES',
  DOWNLOADING_UPDATES: 'DOWNLOADING_UPDATES',
  INSTALLING_UPDATES: 'INSTALLING_UPDATES',
  UPDATES_FAILED: 'UPDATES_FAILED',
  LUCKY_DAY: 'LUCKY_DAY',
  STARTING_UP: 'STARTING_UP'
});

class SplashScreen extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {
      opened: false
    };
  }

  componentWillUnmount () {
    if (this.state.opened) {
      this.closeSplashScreen(true);
    }
  }

  render () {
    console.log('rendering yes')
    return (
      <div id='splash-screen' className='category'>
        <h2>Discord Splash Screen</h2>
        <p>
          Here, you can open a fake splash screen (with its developer tools) that will remain on-screen until closed. You can also manipulate
          its state to your likings and theme all parts of it without any trouble.
        </p>
        {this.state.opened ? this.renderOpened() : this.renderClosed()}
      </div>
    );
  }

  renderClosed () {
    return (
      <Button onClick={() => this.openSplashScreen()}>Open Splash Screen</Button>
    );
  }

  renderOpened () {
    return (
      <>
        <Flex className='splash-buttons' wrap={Flex.Wrap.WRAP}>
          <Button color={Button.Colors.YELLOW} onClick={() => this.closeSplashScreen(true) | this.openSplashScreen(true)}>
            Restart Splash Screen
          </Button>
          <Button color={Button.Colors.RED} onClick={() => this.closeSplashScreen()}>
            Close Splash Screen
          </Button>
        </Flex>
        <Flex className='splash-buttons' wrap={Flex.Wrap.WRAP}>
          <Button onClick={() => this.setSplashStage(SplashStages.CHECKING_FOR_UPDATES)}>
            Checking For Updates
          </Button>
          <Button onClick={() => this.setSplashStage(SplashStages.DOWNLOADING_UPDATES)}>
            Downloading Updates
          </Button>
          <Button onClick={() => this.setSplashStage(SplashStages.INSTALLING_UPDATES)}>
            Installing Updates
          </Button>
          <Button onClick={() => this.setSplashStage(SplashStages.UPDATES_FAILED)}>
            Updates Failed
          </Button>
          <Button onClick={() => this.setSplashStage(SplashStages.LUCKY_DAY)}>
            It's your lucky day!
          </Button>
          <Button onClick={() => this.setSplashStage(SplashStages.STARTING_UP)}>
            Starting Up
          </Button>
        </Flex>
      </>
    );
  }

  async openSplashScreen (keepState) {
    const splashIndex = formatUrl({
      protocol: 'file',
      slashes: true,
      pathname: join(process.resourcesPath, 'app.asar', 'app_bootstrap', 'splash', 'index.html')
    });
    const windowSettings = {
      /*
       * Here's a c/c of the comment I've found in Discord's src code regarding this:
       * - citron note: atom seems to add about 50px height to the frame on mac but not windows
       */
      height: process.platform === 'darwin' ? 300 : 350,
      width: 300,
      transparent: false,
      frame: false,
      resizable: false,
      center: true,
      show: true,
      url: splashIndex.replace('app.asar', 'app'),
      html: await fs.promises.readFile(join(process.resourcesPath, 'app.asar', 'app_bootstrap', 'splash', 'index.html')),
      js: (await fs.promises.readFile(join(process.resourcesPath, 'app.asar', 'app_bootstrap', 'splash', 'index.js'), 'utf8')).replace('../videos/connecting.webm', 'https://discord.com/assets/0bdc0497eb3a19e66f2b1e3d5741634c.webm'),
      preload: await fs.promises.readFile(join(__dirname, '../../../../preloadSplash.js'))
    };

    // this._window = PowercordNative.openBrowserWindow(windowSettings);
    this._window = await popout(windowSettings, 'bruh', 'DISCORD_BRUH');
    this._window.PowercordNative.openDevTools({ mode: 'detach' });
    this._window.addEventListener('unload', () => {
      if (!this._closeScheduled) {
        this.setState({ opened: false });
        delete this._window;
      }
    });

    if (!keepState) {
      this.setState({ opened: true });
    }
  }

  closeSplashScreen (keepState) {
    this._closeScheduled = true;
    this._window.close();
    delete this._window;
    setImmediate(() => (this._closeScheduled = false));
    if (!keepState) {
      this.setState({ opened: false });
    }
  }

  setSplashStage (stage) {
    const data = { status: 'checking-for-updates' };
    switch (stage) {
      case SplashStages.DOWNLOADING_UPDATES:
      case SplashStages.INSTALLING_UPDATES:
        data.status = stage === SplashStages.DOWNLOADING_UPDATES ? 'downloading-updates' : 'installing-updates';
        data.current = Math.floor(Math.random() * 4) + 1;
        data.total = Math.floor(Math.random() * 4) + 5;
        data.progress = Math.floor(Math.random() * 91) + 10;
        break;
      case SplashStages.UPDATES_FAILED:
        data.status = 'update-failure';
        data.seconds = Math.floor(Math.random() * 69) + 10;
        break;
      case SplashStages.LUCKY_DAY:
        data.status = 'update-manually';
        data.newVersion = '69.69.69';
        break;
      case SplashStages.STARTING_UP:
        data.status = 'launching';
        break;
    }
    this._window.eval(`require("electron").ipcRenderer._events.DISCORD_SPLASH_UPDATE_STATE.forEach((e) => e("DISCORD_SPLASH_UPDATE_STATE", JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(data))}"))))`);
  }
}

module.exports = SplashScreen;
