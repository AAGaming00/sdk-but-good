const { React, getModule, getModuleByDisplayName, contextMenu } = require('powercord/webpack');
const { PopoutWindow, Tooltip, ContextMenu, Icons: { CodeBraces } } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { getOwnerInstance, waitFor } = require('powercord/util');
const { Plugin } = require('powercord/entities');
const SdkWindow = require('./components/SdkWindow');

module.exports = class SDKButGood extends Plugin {
  constructor () {
    super();
  }

  async startPlugin () {
    powercord.pluginManager.disable('pc-sdk')
    this.loadStylesheet('scss/style.scss');
    this._addPopoutIcon();
  }

  pluginWillUnload () {
    uninject('pc-sdk-icon');
    this.reloadTitle()
  }

  async _addPopoutIcon () {
    const classes = await getModule([ 'iconWrapper', 'clickable' ]);
    const HeaderBarContainer = await getModuleByDisplayName('HeaderBarContainer');
    inject('pc-sdk-icon', HeaderBarContainer.prototype, 'renderLoggedIn', (args, res) => {
      const Switcher = React.createElement(Tooltip, {
        text: 'SDK',
        position: 'bottom'
      }, React.createElement('div', {
        className: [ classes.iconWrapper, classes.clickable ].join(' ')
      }, React.createElement(CodeBraces, {
        className: classes.icon,
        onClick: () => this._openSdk(),
        onContextMenu: (e) => {
          contextMenu.openContextMenu(e, () =>
            React.createElement(ContextMenu, {
              width: '50px',
              itemGroups: [ [
                {
                  type: 'button',
                  name: 'Open Powercord SDK',
                  onClick: () => this._openSdk()
                },
                {
                  type: 'button',
                  name: 'Open QuickCSS pop-out',
                  onClick: () => powercord.pluginManager.get('pc-moduleManager')._openQuickCSSPopout()
                }
              ], [
                {
                  type: 'button',
                  color: 'colorDanger',
                  name: 'Completely restart Discord',
                  onClick: () => DiscordNative.app.relaunch()
                }
              ] ]
            })
          );
        }
      })));

      if (!res.props.toolbar) {
        res.props.toolbar = React.createElement(React.Fragment, { children: [] });
      }
      res.props.toolbar.props.children.push(Switcher);
      return res;
    });

    this.reloadTitle()
  }

  async _openSdk () {
    const popoutModule = await getModule([ 'setAlwaysOnTop', 'open' ]);
    popoutModule.open('DISCORD_POWERCORD_SANDBOX', (key) =>
      React.createElement(PopoutWindow, {
        windowKey: key,
        title: 'SDK'
      }, React.createElement(SdkWindow))
    );
    popoutModule.setAlwaysOnTop('DISCORD_POWERCORD_SANDBOX', true);
  }

  async reloadTitle () {
    const { title } = await getModule([ 'title', 'chatContent' ]);
    getOwnerInstance(await waitFor(`.${title}`)).forceUpdate();
  }
};
